import { NextResponse } from "next/server";

import { addUserNotification, getUserById, toUserSnapshot, updateUserProfile } from "@/app/lib/db.server";
import { getSessionUser, unauthorizedResponse } from "@/app/lib/session.server";

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return unauthorizedResponse();
  }

  const body = await request.json();

  try {
    await updateUserProfile(sessionUser.id, {
      firstName: String(body.firstName || ""),
      lastName: String(body.lastName || ""),
      phone: String(body.phone || ""),
      nationalId: String(body.nationalId || ""),
      studentCode: String(body.studentCode || ""),
      universityId: Number(body.universityId || 0),
      campusId: Number(body.campusId || 1),
      programId: Number(body.programId || 0)
    });

    await addUserNotification(sessionUser.id, {
      type: "profile",
      title: "Perfil actualizado",
      body: "Tus datos de perfil fueron actualizados correctamente.",
      href: null
    });

    const user = await getUserById(sessionUser.id);
    if (!user) {
      return unauthorizedResponse();
    }

    return NextResponse.json({ user: toUserSnapshot(user) });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo actualizar el perfil" }, { status: 500 });
  }
}
