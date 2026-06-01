import { NextResponse } from "next/server";

import {
  buildEmptyProfile,
  hasUnivalleEmailDomain,
  isProfileComplete,
  getOrCreateUserFromAuth,
  getUserByEmail,
  getUserById,
  toUserSnapshot
} from "@/app/lib/db.server";
import { createClient } from "@/app/lib/supabase/server";
import type { UserSnapshot } from "@/app/lib/types";

function buildAuthUserSnapshot(input: {
  id: string;
  email: string;
  authProvider: UserSnapshot["authProvider"];
}): UserSnapshot {
  const now = new Date().toISOString();

  return {
    id: input.id,
    email: input.email,
    authProvider: input.authProvider,
    createdAt: now,
    updatedAt: now,
    profile: {
      firstName: "",
      lastName: "",
      phone: "",
      nationalId: "",
      studentCode: "",
      universityId: 0,
      campusId: 1,
      programId: 0,
      studentType: "Pregrado",
      benefitLabel: "Almuerzo Regular"
    },
    linkedWallet: null,
    universityValidated: false,
    syncState: {
      directoryMatched: false,
      profileComplete: false,
      walletLinked: false,
      onchainProfileRegistered: false,
      onchainAffiliationSynced: false
    },
    tickets: {
      available: 0,
      source: "ticket_system"
    },
    notifications: [],
    access: {
      perfil: true,
      tickets: hasUnivalleEmailDomain(input.email),
      reciclaje: false,
      marketplace: false,
      dao: false
    },
    completion: {
      profileComplete: false,
      walletLinked: false
    }
  };
}

function buildSnapshotWithComputedState(snapshot: UserSnapshot): UserSnapshot {
  const profileComplete = isProfileComplete(snapshot.profile);
  const walletLinked = Boolean(snapshot.linkedWallet?.address);

  return {
    ...snapshot,
    syncState: {
      ...snapshot.syncState,
      directoryMatched: snapshot.universityValidated,
      profileComplete,
      walletLinked
    },
    access: {
      ...snapshot.access,
      perfil: true,
      tickets: snapshot.universityValidated || profileComplete || hasUnivalleEmailDomain(snapshot.email),
      reciclaje: walletLinked,
      marketplace: walletLinked,
      dao: walletLinked
    },
    completion: {
      profileComplete,
      walletLinked
    }
  };
}

async function mergeSupabaseProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  snapshot: UserSnapshot,
  authUserId: string,
  _authAvatarUrl: string
) {
  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, phone, national_id, student_code, university_id, campus_id, program_id, student_type, benefit_label, university_validated")
    .eq("user_id", authUserId)
    .maybeSingle();

  const institutionalDefaults = buildEmptyProfile(snapshot.email);
  const mergedProfile = {
    ...institutionalDefaults,
    ...snapshot.profile,
    ...(profileRow
      ? {
          firstName: String(profileRow.first_name || ""),
          lastName: String(profileRow.last_name || ""),
          phone: String(profileRow.phone || ""),
          nationalId: String(profileRow.national_id || ""),
          studentCode: String(profileRow.student_code || ""),
          universityId: Number(profileRow.university_id || 0),
          campusId: Number(profileRow.campus_id || 1),
          programId: Number(profileRow.program_id || 0),
          studentType: String(profileRow.student_type || ""),
          benefitLabel: String(profileRow.benefit_label || "")
        }
      : {})
  };

  return buildSnapshotWithComputedState({
    ...snapshot,
    profile: mergedProfile,
    universityValidated: Boolean(profileRow?.university_validated ?? snapshot.universityValidated),
    updatedAt: new Date().toISOString()
  });
}

export async function getSessionUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error
    } = await supabase.auth.getUser();

    if (error || !authUser?.id) return null;

    const authUserId = String(authUser.id);
    const email = authUser.email ?? "";
    const authProvider = authUser.app_metadata?.provider === "google" ? "google" : "email";

    try {
      const user =
        (await getUserById(authUserId)) ||
        (email ? await getUserByEmail(email) : null) ||
        (email
          ? await getOrCreateUserFromAuth({
              id: authUserId,
              email,
              authProvider
            })
          : null);

      if (!user) return null;

      return mergeSupabaseProfile(
        supabase,
        toUserSnapshot(user),
        authUserId,
        ""
      );
    } catch {
      return email
        ? mergeSupabaseProfile(
            supabase,
            buildAuthUserSnapshot({
              id: authUserId,
              email,
              authProvider
            }),
            authUserId,
            ""
          )
        : null;
    }
  } catch {
    return null;
  }
}

export function unauthorizedResponse(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 401 });
}
