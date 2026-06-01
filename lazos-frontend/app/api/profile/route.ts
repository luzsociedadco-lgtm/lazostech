import { NextResponse } from "next/server";

import {
  findDirectoryMatch,
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
      avatarUrl: String(body.avatarUrl || sessionUser.profile.avatarUrl || ""),
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

    const directoryMatch = findDirectoryMatch({
      email: authUser.email,
      studentCode: profileUpdates.studentCode,
      nationalId: profileUpdates.nationalId
    });
    const finalProfile = directoryMatch
      ? {
          firstName: directoryMatch.firstName,
          lastName: directoryMatch.lastName,
          phone: directoryMatch.phone,
          nationalId: directoryMatch.nationalId,
          studentCode: directoryMatch.studentCode,
          universityId: directoryMatch.universityId,
          campusId: directoryMatch.campusId,
          programId: directoryMatch.programId,
          studentType: directoryMatch.studentType,
          benefitLabel: directoryMatch.benefitLabel
        }
      : {
          ...sessionUser.profile,
          ...profileUpdates,
          universityId: hasUnivalleEmailDomain(authUser.email)
            ? profileUpdates.universityId || 1000
            : profileUpdates.universityId,
          campusId: hasUnivalleEmailDomain(authUser.email)
            ? profileUpdates.campusId && profileUpdates.campusId !== 1
              ? profileUpdates.campusId
              : 1001
            : profileUpdates.campusId
        };

    if (profileUpdates.avatarUrl) {
      const { error: avatarError } = await supabase.auth.updateUser({
        data: { avatar_url: profileUpdates.avatarUrl }
      });

      if (avatarError) {
        return NextResponse.json({ error: "No se pudo guardar la foto de perfil" }, { status: 500 });
      }
    }

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
          university_validated: Boolean(directoryMatch)
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
