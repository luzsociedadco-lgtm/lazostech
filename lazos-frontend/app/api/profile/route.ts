import { NextResponse } from "next/server";

import {
  hasUnivalleEmailDomain,
  updateUserProfile
} from "@/app/lib/db.server";
import { getSessionUser, unauthorizedResponse } from "@/app/lib/session.server";
import { createClient } from "@/app/lib/supabase/server";

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return unauthorizedResponse();
  }

  const body = await request.json();

  try {
    const profileUpdates = {
      firstName: String(body.firstName || ""),
      lastName: String(body.lastName || ""),
      phone: String(body.phone || ""),
      nationalId: String(body.nationalId || ""),
      studentCode: String(body.studentCode || ""),
      universityId: Number(body.universityId || 0),
      campusId: Number(body.campusId || 1),
      programId: Number(body.programId || 0)
    };

    await updateUserProfile(sessionUser.id, profileUpdates).catch(() => null);

    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !authUser?.id || !authUser.email) {
      return unauthorizedResponse();
    }

    const isInstitutionalEmail = hasUnivalleEmailDomain(authUser.email);
    const finalProfile = {
      ...sessionUser.profile,
      ...profileUpdates,
      universityId: isInstitutionalEmail ? profileUpdates.universityId || 1000 : profileUpdates.universityId,
      campusId: isInstitutionalEmail
        ? profileUpdates.campusId && profileUpdates.campusId !== 1
          ? profileUpdates.campusId
          : 1001
        : profileUpdates.campusId
    };

    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: authUser.id,
          email: authUser.email,
          first_name: finalProfile.firstName,
          last_name: finalProfile.lastName,
          phone: finalProfile.phone,
          national_id: finalProfile.nationalId,
          student_code: finalProfile.studentCode,
          university_id: finalProfile.universityId,
          campus_id: finalProfile.campusId,
          program_id: finalProfile.programId,
          student_type: finalProfile.studentType,
          benefit_label: finalProfile.benefitLabel,
          university_validated: isInstitutionalEmail
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      return NextResponse.json({ error: "No se pudo guardar el perfil en Supabase" }, { status: 500 });
    }

    const user = await getSessionUser();
    if (!user) return unauthorizedResponse();

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo actualizar el perfil" }, { status: 500 });
  }
}
