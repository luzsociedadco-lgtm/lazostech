import { NextResponse } from "next/server";

import { hasUnivalleEmailDomain } from "@/app/lib/db.server";
import { createClient } from "@/app/lib/supabase/server";
import type { TicketTurn } from "@/app/lib/types";
import { getSessionUser, unauthorizedResponse } from "@/app/lib/session.server";

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "TURN_OPERATION_FAILED";

  const responses: Record<string, { status: number; error: string }> = {
    TICKETS_LOCKED: {
      status: 403,
      error: "Completa tu perfil o valida tu identidad universitaria para solicitar turnos."
    },
    INVALID_TURN_QR: {
      status: 400,
      error: "Escanea el QR oficial del servicio de almuerzos para solicitar turno."
    },
    SPECIAL_TURN_LIMIT_REACHED: {
      status: 400,
      error: "Ya usaste todas tus reservas especiales de este mes."
    },
    TURN_NOT_FOUND: {
      status: 404,
      error: "No tienes un turno reciente para reactivar."
    },
    TURN_REACTIVATION_LIMIT_REACHED: {
      status: 400,
      error: "Ya usaste todas las reactivaciones disponibles para este turno."
    }
  };

  const response = responses[message] ?? {
    status: 500,
    error: "No se pudo actualizar tu turno."
  };

  return NextResponse.json({ error: response.error }, { status: response.status });
}

function getStudentPayload(sessionUser: Awaited<ReturnType<typeof getSessionUser>>) {
  if (!sessionUser) {
    return {
      studentCode: "",
      studentEmail: "",
      studentName: ""
    };
  }

  const studentName =
    `${sessionUser.profile.firstName} ${sessionUser.profile.lastName}`.trim() ||
    sessionUser.email.split("@")[0] ||
    "Estudiante";

  return {
    studentCode: sessionUser.profile.studentCode || sessionUser.profile.nationalId || sessionUser.email.split("@")[0] || "",
    studentEmail: sessionUser.email,
    studentName
  };
}

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return unauthorizedResponse();
  }

  const supabase = await createClient();
  const { data: turn, error } = await supabase.rpc("get_lunch_turn_state");

  return NextResponse.json({
    turn: error ? null : turn ?? null
  });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "request");
    const supabase = await createClient();

    if (action === "reactivate") {
      const { data: turn, error } = await supabase.rpc("reactivate_lunch_turn");
      if (error) throw new Error(error.message);
      return NextResponse.json({ turn });
    }

    const type: TicketTurn["type"] = body.type === "special" ? "special" : "regular";
    const qrCodeId = String(body.qrCodeId || "");
    if (!sessionUser.access.tickets && !hasUnivalleEmailDomain(sessionUser.email)) {
      throw new Error("TICKETS_LOCKED");
    }
    if (type === "special") {
      throw new Error("SPECIAL_TURN_LIMIT_REACHED");
    }

    const student = getStudentPayload(sessionUser);
    const { data: turn, error } = await supabase.rpc("request_lunch_turn", {
      qr_code_id: qrCodeId,
      student_code: student.studentCode,
      student_email: student.studentEmail,
      student_name: student.studentName
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ turn });
  } catch (error) {
    return errorResponse(error);
  }
}
