import { NextResponse } from "next/server";

import { getOrCreateUserFromAuth, getUserByEmail, getUserById, toUserSnapshot } from "@/app/lib/db.server";
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
      tickets: false,
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

      return toUserSnapshot(user);
    } catch {
      return email
        ? buildAuthUserSnapshot({
            id: authUserId,
            email,
            authProvider
          })
        : null;
    }
  } catch {
    return null;
  }
}

export function unauthorizedResponse(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 401 });
}
