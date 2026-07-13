import { NextResponse } from "next/server";

import { getSessionUser, unauthorizedResponse } from "@/app/lib/session.server";
import { createClient } from "@/app/lib/supabase/server";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorizedResponse();

  return NextResponse.json({ notifications: sessionUser.notifications });
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return unauthorizedResponse();

  const body = await request.json().catch(() => ({}));
  const notificationId = String(body.notificationId || "").trim();

  if (!/^[0-9a-f-]{36}$/i.test(notificationId)) {
    return NextResponse.json({ error: "Notificacion invalida" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", sessionUser.id)
    .select("id, type, title, body, href, is_read, created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "No se pudo actualizar la notificacion" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Notificacion no encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    notification: {
      id: data.id,
      type: data.type,
      title: data.title,
      body: data.body,
      href: data.href,
      isRead: data.is_read,
      createdAt: data.created_at
    }
  });
}
