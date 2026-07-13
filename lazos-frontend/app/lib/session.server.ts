import { NextResponse } from "next/server";

import {
  buildEmptyProfile,
  computeAccess,
  isProfileComplete
} from "@/app/lib/db.server";
import { createClient } from "@/app/lib/supabase/server";
import type {
  ProfileRecord,
  UserNotification,
  UserNotificationType,
  UserSnapshot
} from "@/app/lib/types";

function profileFromRow(email: string, row: Record<string, unknown> | null): ProfileRecord {
  const defaults = buildEmptyProfile(email);

  if (!row) return defaults;

  return {
    firstName: String(row.first_name || ""),
    lastName: String(row.last_name || ""),
    phone: String(row.phone || ""),
    nationalId: String(row.national_id || ""),
    studentCode: String(row.student_code || ""),
    universityId: Number(row.university_id ?? defaults.universityId),
    campusId: Number(row.campus_id ?? defaults.campusId),
    programId: Number(row.program_id || 0),
    studentType: String(row.student_type || defaults.studentType),
    benefitLabel: String(row.benefit_label || defaults.benefitLabel)
  };
}

function notificationsFromRows(rows: Array<Record<string, unknown>> | null): UserNotification[] {
  return (rows ?? []).map(row => ({
    id: String(row.id),
    type: String(row.type) as UserNotificationType,
    title: String(row.title),
    body: String(row.body),
    href: row.href ? String(row.href) : null,
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at)
  }));
}

export async function getSessionUser(): Promise<UserSnapshot | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error
    } = await supabase.auth.getUser();

    if (error || !authUser?.id || !authUser.email) return null;

    const [profileResult, notificationsResult] = await Promise.all([
      supabase
        .from("user_profiles")
        .select(
          "first_name, last_name, phone, national_id, student_code, university_id, campus_id, program_id, student_type, benefit_label, university_validated, linked_wallet, wallet_linked_at, onchain_profile_registered, onchain_affiliation_synced, created_at, updated_at"
        )
        .eq("user_id", authUser.id)
        .maybeSingle(),
      supabase
        .from("user_notifications")
        .select("id, type, title, body, href, is_read, created_at")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(50)
    ]);

    const profileRow = profileResult.data as Record<string, unknown> | null;
    const profile = profileFromRow(authUser.email, profileRow);
    const linkedWalletAddress = profileRow?.linked_wallet
      ? String(profileRow.linked_wallet)
      : null;
    const walletLinked = Boolean(linkedWalletAddress);
    const universityValidated = Boolean(profileRow?.university_validated);

    return {
      id: authUser.id,
      email: authUser.email,
      authProvider: authUser.app_metadata?.provider === "google" ? "google" : "email",
      createdAt: String(profileRow?.created_at || authUser.created_at),
      updatedAt: String(profileRow?.updated_at || authUser.updated_at || authUser.created_at),
      profile,
      linkedWallet: linkedWalletAddress
        ? {
            address: linkedWalletAddress,
            linkedAt: String(profileRow?.wallet_linked_at || profileRow?.updated_at || authUser.created_at)
          }
        : null,
      universityValidated,
      syncState: {
        directoryMatched: universityValidated,
        profileComplete: isProfileComplete(profile),
        walletLinked,
        onchainProfileRegistered: Boolean(profileRow?.onchain_profile_registered),
        onchainAffiliationSynced: Boolean(profileRow?.onchain_affiliation_synced)
      },
      tickets: {
        available: 0,
        source: "ticket_system"
      },
      notifications: notificationsFromRows(
        notificationsResult.data as Array<Record<string, unknown>> | null
      ),
      access: computeAccess({
        email: authUser.email,
        profile,
        universityValidated,
        walletLinked
      }),
      completion: {
        profileComplete: isProfileComplete(profile),
        walletLinked
      }
    };
  } catch {
    return null;
  }
}

export function unauthorizedResponse(message = "No autorizado") {
  return NextResponse.json({ error: message }, { status: 401 });
}
