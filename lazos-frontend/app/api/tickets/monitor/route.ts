import { NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { unauthorizedResponse } from "@/app/lib/session.server";

type MonitorRole = {
  role: "restaurant_monitor" | "admin";
  service_id: string | null;
};

type TurnRow = {
  id: string;
  service_id: string;
  user_id: string;
  turn_date?: string;
  student_code: string;
  student_email: string;
  student_name: string;
  turn_code: string;
  status: "activo" | "en_fila" | "atendido" | "expirado";
  sequence_number: number;
  assigned_at: string;
  is_special?: boolean;
  is_paused?: boolean;
  paused_at?: string | null;
};

const emptySummary = {
  activo: 0,
  en_fila: 0,
  atendido: 0,
  expirado: 0
};

function getServiceScope(roles: MonitorRole[]) {
  const serviceIds = roles
    .map(role => role.service_id)
    .filter((serviceId): serviceId is string => Boolean(serviceId));

  return {
    serviceIds,
    hasGlobalRole: roles.some(role => role.service_id === null)
  };
}

function normalizeDate(value: string | null) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? String(value) : getBogotaDate();
}

function getBogotaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      return unauthorizedResponse();
    }

    const { data: roles, error: rolesError } = await supabase
      .from("ticket_turn_monitor_roles")
      .select("role, service_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("role", ["restaurant_monitor", "admin"]);

    if (rolesError) {
      return NextResponse.json({ isRestaurantMonitor: false, roles: [], turns: [], summary: emptySummary });
    }

    const monitorRoles = (roles ?? []) as MonitorRole[];
    if (monitorRoles.length === 0) {
      return NextResponse.json({ isRestaurantMonitor: false, roles: [], turns: [], summary: emptySummary });
    }

    const date = normalizeDate(searchParams.get("date"));
    const { serviceIds, hasGlobalRole } = getServiceScope(monitorRoles);
    const serviceQuery = supabase
      .from("ticket_turn_services")
      .select("id, queue_paused")
      .eq("is_active", true)
      .limit(1);

    if (serviceIds.length > 0 && !hasGlobalRole) {
      serviceQuery.in("id", serviceIds);
    }

    const { data: services } = await serviceQuery;
    const activeService = services?.[0] ?? null;
    let query = supabase
      .from("ticket_turns")
      .select("id, service_id, user_id, turn_date, student_code, student_email, student_name, turn_code, status, sequence_number, assigned_at, is_special, is_paused, paused_at")
      .eq("turn_date", date)
      .order("sequence_number", { ascending: true })
      .limit(1000);

    if (serviceIds.length > 0 && !monitorRoles.some(role => role.service_id === null)) {
      query = query.in("service_id", serviceIds);
    }

    const { data: turns, error: turnsError } = await query;
    const turnRows = turnsError ? [] : ((turns ?? []) as TurnRow[]);
    const summary = turnRows.reduce(
      (acc, turn) => ({
        ...acc,
        [turn.status]: acc[turn.status] + 1
      }),
      { ...emptySummary }
    );

    return NextResponse.json({
      isRestaurantMonitor: true,
      roles: monitorRoles,
      serviceId: activeService?.id ?? null,
      isQueuePaused: Boolean(activeService?.queue_paused),
      date,
      turns: turnRows,
      summary
    });
  } catch {
    return NextResponse.json({ isRestaurantMonitor: false, roles: [], turns: [], summary: emptySummary });
  }
}

async function getMonitorRoles() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return { supabase, userId: null, roles: [] as MonitorRole[] };
  }

  const { data: roles } = await supabase
    .from("ticket_turn_monitor_roles")
    .select("role, service_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .in("role", ["restaurant_monitor", "admin"]);

  return { supabase, userId: user.id, roles: ((roles ?? []) as MonitorRole[]) };
}

export async function PATCH(request: Request) {
  try {
    const { supabase, userId, roles } = await getMonitorRoles();
    if (!userId) {
      return unauthorizedResponse();
    }

    if (roles.length === 0) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");
    const status = String(body.status || "") as TurnRow["status"];
    const turnId = String(body.turnId || "");
    const { serviceIds, hasGlobalRole } = getServiceScope(roles);

    const serviceQuery = supabase
      .from("ticket_turn_services")
      .select("id")
      .eq("is_active", true)
      .limit(1);

    if (serviceIds.length > 0 && !hasGlobalRole) {
      serviceQuery.in("id", serviceIds);
    }

    const { data: services } = await serviceQuery;
    const serviceId = services?.[0]?.id ?? serviceIds[0] ?? null;

    if (action === "pause_queue" || action === "resume_queue") {
      if (!serviceId) {
        return NextResponse.json({ error: "Servicio no disponible" }, { status: 404 });
      }

      const isPaused = action === "pause_queue";
      const { error } = await supabase
        .from("ticket_turn_services")
        .update({
          queue_paused: isPaused,
          queue_paused_at: isPaused ? new Date().toISOString() : null
        })
        .eq("id", serviceId);

      if (error) {
        return NextResponse.json({ error: "No se pudo actualizar la fila" }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "find_student") {
      const studentCode = String(body.studentCode || "").trim();
      if (!studentCode) {
        return NextResponse.json({ error: "Codigo requerido" }, { status: 400 });
      }

      const { data: studentTurns } = await supabase
        .from("ticket_turns")
        .select("user_id, student_code, student_email, student_name")
        .eq("student_code", studentCode)
        .order("assigned_at", { ascending: false })
        .limit(1);

      const student = studentTurns?.[0];
      if (!student?.user_id) {
        return NextResponse.json({ error: "No encontramos ese codigo en la fila" }, { status: 404 });
      }

      return NextResponse.json({ ok: true, student });
    }

    if (action === "special_turn") {
      if (!serviceId) {
        return NextResponse.json({ error: "Servicio no disponible" }, { status: 404 });
      }

      const studentCode = String(body.studentCode || "").trim();
      if (!studentCode) {
        return NextResponse.json({ error: "Codigo requerido" }, { status: 400 });
      }

      const { data: studentTurns } = await supabase
        .from("ticket_turns")
        .select("user_id, student_code, student_email, student_name")
        .eq("student_code", studentCode)
        .order("assigned_at", { ascending: false })
        .limit(1);

      const student = studentTurns?.[0];
      if (!student?.user_id) {
        return NextResponse.json({ error: "No encontramos ese codigo en la fila" }, { status: 404 });
      }

      const today = getBogotaDate();
      const { data: latestTurns } = await supabase
        .from("ticket_turns")
        .select("sequence_number, turn_code")
        .eq("service_id", serviceId)
        .eq("turn_date", today)
        .order("sequence_number", { ascending: false })
        .limit(1);

      const latest = latestTurns?.[0];
      const nextSequence = latest ? Number(latest.sequence_number) + 1 : 0;
      const baseCode = latest?.turn_code ? latest.turn_code.replace(/E$/u, "") : "A-00";
      const specialCode = `${baseCode}E`;

      const { error: insertError } = await supabase
        .from("ticket_turns")
        .insert({
          service_id: serviceId,
          user_id: student.user_id,
          student_code: student.student_code,
          student_email: student.student_email,
          student_name: student.student_name,
          turn_date: today,
          sequence_number: nextSequence,
          turn_code: specialCode,
          status: "activo",
          is_special: true,
          assigned_at: new Date().toISOString()
        });

      if (insertError) {
        return NextResponse.json({ error: "No se pudo asignar el turno especial" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, turnCode: specialCode });
    }

    if (action === "call_next") {
      let query = supabase
        .from("ticket_turns")
        .select("id")
        .eq("turn_date", getBogotaDate())
        .eq("status", "activo")
        .order("sequence_number", { ascending: true })
        .limit(1);

      if (serviceIds.length > 0 && !hasGlobalRole) {
        query = query.in("service_id", serviceIds);
      }

      const { data: nextTurns, error: nextError } = await query;
      if (nextError || !nextTurns?.[0]?.id) {
        return NextResponse.json({ error: "No hay turnos activos para llamar" }, { status: 404 });
      }

      const { error: updateError } = await supabase
        .from("ticket_turns")
        .update({ status: "en_fila" })
        .eq("id", nextTurns[0].id);

      if (updateError) {
        return NextResponse.json({ error: "No se pudo llamar el siguiente turno" }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "pause_turn" || action === "resume_turn") {
      if (!turnId) {
        return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
      }

      const isPaused = action === "pause_turn";
      const { error } = await supabase
        .from("ticket_turns")
        .update({
          status: isPaused ? "en_fila" : status || "en_fila",
          is_paused: isPaused,
          paused_at: isPaused ? new Date().toISOString() : null
        })
        .eq("id", turnId);

      if (error) {
        return NextResponse.json({ error: "No se pudo actualizar el turno" }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    if (!turnId || !["activo", "atendido", "expirado", "en_fila"].includes(status)) {
      return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
    }

    const updates: { status: TurnRow["status"]; attended_at?: string | null; is_paused?: boolean; paused_at?: string | null } = { status };
    if (status === "atendido") {
      updates.attended_at = new Date().toISOString();
      updates.is_paused = false;
      updates.paused_at = null;
    } else {
      updates.attended_at = null;
    }

    if (status === "expirado" || status === "activo") {
      updates.is_paused = false;
      updates.paused_at = null;
    }

    const { error } = await supabase.from("ticket_turns").update(updates).eq("id", turnId);
    if (error) {
      return NextResponse.json({ error: "No se pudo actualizar el turno" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el turno" }, { status: 500 });
  }
}
