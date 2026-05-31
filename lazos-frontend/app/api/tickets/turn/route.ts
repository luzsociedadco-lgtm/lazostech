import { NextResponse } from "next/server";

import {
  getTicketTurnState,
  reactivateTicketTurn,
  requestTicketTurn
} from "@/app/lib/db.server";
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

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return unauthorizedResponse();
  }

  const turn = await getTicketTurnState(sessionUser.id);
  const supabase = await createClient();
  const { data: service } = await supabase
    .from("ticket_turn_services")
    .select("queue_paused")
    .eq("code", "univalle-lunch-main")
    .maybeSingle();

  return NextResponse.json({
    turn: turn ? { ...turn, queuePaused: Boolean(service?.queue_paused) } : null
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

    if (action === "reactivate") {
      const turn = await reactivateTicketTurn(sessionUser.id);
      return NextResponse.json({ turn });
    }

    const type: TicketTurn["type"] = body.type === "special" ? "special" : "regular";
    const qrCodeId = String(body.qrCodeId || "");
    const turn = await requestTicketTurn(sessionUser.id, type, qrCodeId);
    return NextResponse.json({ turn });
  } catch (error) {
    return errorResponse(error);
  }
}
