import { NextResponse } from "next/server";

import { addUserNotification, getUserById, toUserSnapshot, updateUserProfile } from "@/app/lib/db.server";
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

    await updateUserProfile(sessionUser.id, profileUpdates);

    const updatedUser = await getUserById(sessionUser.id);
    if (!updatedUser) {
      return unauthorizedResponse();
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !authUser?.id || !authUser.email) {
      return unauthorizedResponse();
    }

    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: authUser.id,
          email: authUser.email,
          first_name: updatedUser.profile.firstName,
          last_name: updatedUser.profile.lastName,
          phone: updatedUser.profile.phone,
          national_id: updatedUser.profile.nationalId,
          student_code: updatedUser.profile.studentCode,
          university_id: updatedUser.profile.universityId,
          campus_id: updatedUser.profile.campusId,
          program_id: updatedUser.profile.programId,
          student_type: updatedUser.profile.studentType,
          benefit_label: updatedUser.profile.benefitLabel,
          university_validated: updatedUser.universityValidated
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      return NextResponse.json({ error: "No se pudo guardar el perfil en Supabase" }, { status: 500 });
    }

    await addUserNotification(sessionUser.id, {
      type: "profile",
      title: "Perfil actualizado",
      body: "Tus datos de perfil fueron actualizados correctamente.",
      href: null
    });

    const user = await getUserById(sessionUser.id);
    if (!user) return unauthorizedResponse();

    return NextResponse.json({ user: toUserSnapshot(user) });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo actualizar el perfil" }, { status: 500 });
  }
}
