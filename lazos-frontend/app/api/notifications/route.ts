import { NextResponse } from "next/server";

import { getUserById, markUserNotificationRead, toUserSnapshot } from "@/app/lib/db.server";
import { getSessionUser, unauthorizedResponse } from "@/app/lib/session.server";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return unauthorizedResponse();
  }

  const user = await getUserById(sessionUser.id);
  if (!user) {
    return unauthorizedResponse();
  }

  return NextResponse.json({ notifications: toUserSnapshot(user).notifications });
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const notificationId = String(body.notificationId || "").trim();

  if (!notificationId) {
    return NextResponse.json({ error: "Notificacion invalida" }, { status: 400 });
  }

  try {
    const notification = await markUserNotificationRead(sessionUser.id, notificationId);
    return NextResponse.json({ notification });
  } catch (error) {
    if (error instanceof Error && error.message === "NOTIFICATION_NOT_FOUND") {
      return NextResponse.json({ error: "Notificacion no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ error: "No se pudo actualizar la notificacion" }, { status: 500 });
  }
}
