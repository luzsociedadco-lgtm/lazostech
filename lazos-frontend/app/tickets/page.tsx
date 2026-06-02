"use client";

import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ListChecks,
  Menu,
  Minus,
  Pause,
  Play,
  Plus,
  QrCode,
  Search,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { FeatureGate } from "@/app/components/FeatureGate";
import { useTicketRedemption } from "@/app/hooks/useTicketRedemption";
import { useAuth } from "@/app/providers/AuthProvider";
import { createClient as createSupabaseBrowserClient } from "@/app/lib/supabase/client";
import type { TicketTurnSnapshot } from "@/app/lib/types";

const days = [
  { day: "Lunes", image: "/tickets/menu-lunes.png" },
  { day: "Martes", image: "/tickets/menu-martes.png" },
  { day: "Miercoles", image: "/tickets/menu-miercoles.png" },
  { day: "Jueves", image: "/tickets/menu-jueves.png" },
  { day: "Viernes", image: "/tickets/menu-viernes.png" },
];

type PaymentMethod = "nudos" | "card" | "nequi";

const paymentMethods: Array<{ key: PaymentMethod; label: string }> = [
  { key: "nudos", label: "Pagar con $NUDOS" },
  { key: "card", label: "Paga con tarjeta" },
  { key: "nequi", label: "NEQUI" },
];

const lunchTurnQrId = "lazos-lunch-turns-v1";

const turnStatusLabels: Record<TicketTurnSnapshot["status"], string> = {
  active: "Activo",
  reserved: "Reservado",
  expired: "Expirado",
  completed: "Completado",
  cancelled: "Cancelado",
};

type MonitorTurnStatus = "activo" | "en_fila" | "atendido" | "expirado";

type MonitorTurn = {
  id: string;
  service_id?: string;
  user_id?: string;
  turn_date?: string;
  student_code: string;
  student_email: string;
  student_name: string;
  turn_code: string;
  status: MonitorTurnStatus;
  sequence_number: number;
  assigned_at: string;
  is_special?: boolean;
  is_paused?: boolean;
  paused_at?: string | null;
};

type MonitorState = {
  isRestaurantMonitor: boolean;
  isQueuePaused: boolean;
  turns: MonitorTurn[];
  summary: Record<MonitorTurnStatus, number>;
};

const emptyMonitorState: MonitorState = {
  isRestaurantMonitor: false,
  isQueuePaused: false,
  turns: [],
  summary: {
    activo: 0,
    en_fila: 0,
    atendido: 0,
    expirado: 0,
  },
};

const monitorStatusLabels: Record<MonitorTurnStatus, string> = {
  activo: "Activo",
  en_fila: "En fila",
  atendido: "Atendido",
  expirado: "Expirado",
};

function formatMonitorDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function sortMonitorTurns(turns: MonitorTurn[]) {
  return [...turns].sort((left, right) => left.sequence_number - right.sequence_number);
}

function summarizeMonitorTurns(turns: MonitorTurn[]) {
  return turns.reduce(
    (acc, turnItem) => ({
      ...acc,
      [turnItem.status]: acc[turnItem.status] + 1,
    }),
    { ...emptyMonitorState.summary }
  );
}

function normalizeRealtimeTurn(value: unknown): MonitorTurn | null {
  const row = value as Partial<MonitorTurn> | null;
  if (!row?.id || !row.turn_code || !row.status) return null;

  return {
    id: String(row.id),
    service_id: row.service_id ? String(row.service_id) : undefined,
    user_id: row.user_id ? String(row.user_id) : undefined,
    turn_date: row.turn_date ? String(row.turn_date) : undefined,
    student_code: String(row.student_code || ""),
    student_email: String(row.student_email || ""),
    student_name: String(row.student_name || ""),
    turn_code: String(row.turn_code),
    status: row.status as MonitorTurnStatus,
    sequence_number: Number(row.sequence_number ?? 0),
    assigned_at: String(row.assigned_at || new Date().toISOString()),
    is_special: Boolean(row.is_special),
    is_paused: Boolean(row.is_paused),
    paused_at: row.paused_at ? String(row.paused_at) : null,
  };
}

export default function TicketsPage() {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(3);
  const [turnsOpen, setTurnsOpen] = useState(false);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [turn, setTurn] = useState<TicketTurnSnapshot | null>(null);
  const [turnMessage, setTurnMessage] = useState("");
  const [turnError, setTurnError] = useState("");
  const [isTurnLoading, setIsTurnLoading] = useState(false);
  const [monitorState, setMonitorState] = useState<MonitorState>(emptyMonitorState);
  const [monitorQuery, setMonitorQuery] = useState("");
  const [selectedMonitorTurnId, setSelectedMonitorTurnId] = useState<string | null>(null);
  const [queuePopupOpen, setQueuePopupOpen] = useState(false);
  const [specialPopupOpen, setSpecialPopupOpen] = useState(false);
  const [monitorQrOpen, setMonitorQrOpen] = useState(false);
  const [studentScanOpen, setStudentScanOpen] = useState(false);
  const [cameraPopupOpen, setCameraPopupOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [turnOptionsOpen, setTurnOptionsOpen] = useState(false);
  const [turnOptionsTarget, setTurnOptionsTarget] = useState<MonitorTurn | null>(null);
  const [specialStudentCode, setSpecialStudentCode] = useState("");
  const [specialStudentPreview, setSpecialStudentPreview] = useState<{
    student_code: string;
    student_email: string;
    student_name: string;
  } | null>(null);
  const [specialMessage, setSpecialMessage] = useState("");
  const [historyPopupDate, setHistoryPopupDate] = useState<string | null>(null);
  const [historyDateInput, setHistoryDateInput] = useState(formatMonitorDate(new Date()));
  const [historyTurns, setHistoryTurns] = useState<MonitorTurn[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [isMonitorActionLoading, setIsMonitorActionLoading] = useState(false);
  const menuSwipeStart = useRef<number | null>(null);
  const turnHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);
  const scannerFrameRef = useRef<number | null>(null);
  const qrScannerRef = useRef<{ start: () => Promise<void>; stop: () => void; destroy: () => void } | null>(null);
  const {
    quoteDisplay,
    isLoadingQuote,
    isSubmitting,
    allowanceEnough,
    statusMessage,
    errorMessage,
    approveAndRedeem
  } = useTicketRedemption(quantity);

  const currentTickets = user?.tickets.available ?? 0;
  const benefitLabel = user?.profile.benefitLabel || "";
  const hasNegotiatedBenefit = /subsidi|negoci/i.test(benefitLabel);
  const pricePerTicketCop = hasNegotiatedBenefit ? 2000 : 2500;
  const subtotalCop = pricePerTicketCop * quantity;
  const totalCop = subtotalCop;
  const nudosEquivalent = totalCop / 250;

  const summary = useMemo(
    () => ({
      current: currentTickets,
      toBuy: quantity,
      after: currentTickets + quantity,
    }),
    [currentTickets, quantity],
  );
  const turnProgress = turn ? Math.min(100, Math.max(18, turn.queuePosition > 1 ? 44 : 72)) : 8;
  const reservationUsage = turn
    ? `${turn.monthlyReservationsUsed}/${turn.monthlyReservationsLimit}`
    : "0/5";
  const filteredMonitorTurns = useMemo(() => {
    const query = monitorQuery.trim().toLowerCase();
    if (!query) return monitorState.turns;

    return monitorState.turns.filter(item =>
      [item.turn_code, item.student_code, item.student_email, item.student_name]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [monitorQuery, monitorState.turns]);
  const filteredHistoryTurns = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) return historyTurns;

    return historyTurns.filter(item =>
      [item.turn_code, item.student_code, item.student_email, item.student_name]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [historyQuery, historyTurns]);

  const refreshTurn = useCallback(async () => {
    if (!user) {
      setTurn(null);
      return;
    }

    const response = await fetch("/api/tickets/turn", { cache: "no-store" });
    const json = await response.json().catch(() => ({}));
    if (response.ok) {
      setTurn(json.turn ?? null);
    }
  }, [user]);

  useEffect(() => {
    if (turnsOpen) {
      refreshTurn();
    }
  }, [refreshTurn, turnsOpen]);

  useEffect(() => {
    if (!user) {
      setMonitorState(emptyMonitorState);
      return;
    }

    fetch("/api/tickets/monitor", { cache: "no-store" })
      .then(response => response.json())
      .then(json => {
        setMonitorState({
          isRestaurantMonitor: Boolean(json.isRestaurantMonitor),
          isQueuePaused: Boolean(json.isQueuePaused),
          turns: Array.isArray(json.turns) ? sortMonitorTurns(json.turns) : [],
          summary: json.summary ?? emptyMonitorState.summary,
        });
      })
      .catch(() => {
        setMonitorState(emptyMonitorState);
      });
  }, [user]);

  const refreshMonitorTools = useCallback(async () => {
    if (!user) {
      setMonitorState(emptyMonitorState);
      return;
    }

    const response = await fetch("/api/tickets/monitor", { cache: "no-store" });
    const json = await response.json().catch(() => ({}));
    setMonitorState({
      isRestaurantMonitor: Boolean(json.isRestaurantMonitor),
      isQueuePaused: Boolean(json.isQueuePaused),
      turns: Array.isArray(json.turns) ? sortMonitorTurns(json.turns) : [],
      summary: json.summary ?? emptyMonitorState.summary,
    });
  }, [user]);

  useEffect(() => {
    if (!user || !monitorState.isRestaurantMonitor) return;

    const today = formatMonitorDate(new Date());
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("ticket-turn-monitor-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ticket_turns" },
        payload => {
          const eventType = payload.eventType;
          const nextTurn = normalizeRealtimeTurn(payload.new);
          const oldTurn = normalizeRealtimeTurn(payload.old);
          const targetTurn = nextTurn ?? oldTurn;
          const targetTurnId =
            targetTurn?.id || String(((payload.old ?? payload.new) as { id?: string } | null)?.id || "");

          if (targetTurn?.turn_date && targetTurn.turn_date !== today) {
            return;
          }

          setMonitorState(previous => {
            if (!previous.isRestaurantMonitor) return previous;

            const currentTurns =
              eventType === "DELETE"
                ? previous.turns.filter(item => item.id !== targetTurnId)
                : nextTurn
                  ? sortMonitorTurns([
                      ...previous.turns.filter(item => item.id !== nextTurn.id),
                      nextTurn,
                    ])
                  : previous.turns;

            return {
              ...previous,
              turns: currentTurns,
              summary: summarizeMonitorTurns(currentTurns),
            };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ticket_turn_services" },
        payload => {
          const row = payload.new as { queue_paused?: boolean } | null;
          setMonitorState(previous => ({
            ...previous,
            isQueuePaused: Boolean(row?.queue_paused),
          }));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [monitorState.isRestaurantMonitor, refreshMonitorTools, user]);

  const submitMonitorAction = async (payload: {
    action?: string;
    turnId?: string;
    status?: MonitorTurnStatus;
    studentCode?: string;
  }) => {
    setIsMonitorActionLoading(true);
    try {
      const response = await fetch("/api/tickets/monitor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await refreshMonitorTools();
        if (turnsOpen) {
          await refreshTurn();
        }
      }

      return response;
    } finally {
      setIsMonitorActionLoading(false);
    }
  };

  const toggleQueuePause = async () => {
    await submitMonitorAction({ action: monitorState.isQueuePaused ? "resume_queue" : "pause_queue" });
  };

  const toggleTurnPassed = async (turn: MonitorTurn) => {
    await submitMonitorAction({
      turnId: turn.id,
      status: turn.status === "atendido" ? "en_fila" : "atendido"
    });
  };

  const expireTurn = async (turn: MonitorTurn) => {
    await submitMonitorAction({ turnId: turn.id, status: "expirado" });
    setTurnOptionsOpen(false);
    setTurnOptionsTarget(null);
  };

  const toggleTurnPause = async (turn: MonitorTurn) => {
    await submitMonitorAction({
      action: turn.is_paused ? "resume_turn" : "pause_turn",
      turnId: turn.id,
      status: "en_fila"
    });
    setTurnOptionsOpen(false);
    setTurnOptionsTarget(null);
  };

  const openTurnOptions = (turnItem: MonitorTurn) => {
    setTurnOptionsTarget(turnItem);
    setTurnOptionsOpen(true);
  };

  const startTurnHold = (turnItem: MonitorTurn) => {
    if (turnHoldTimerRef.current) clearTimeout(turnHoldTimerRef.current);
    turnHoldTimerRef.current = setTimeout(() => {
      openTurnOptions(turnItem);
      turnHoldTimerRef.current = null;
    }, 650);
  };

  const cancelTurnHold = () => {
    if (turnHoldTimerRef.current) {
      clearTimeout(turnHoldTimerRef.current);
      turnHoldTimerRef.current = null;
    }
  };

  const assignSpecialTurn = async () => {
    setSpecialMessage("");
    const response = await submitMonitorAction({ action: "special_turn", studentCode: specialStudentCode });
    const json = await response?.json().catch(() => ({}));
    if (response?.ok) {
      setSpecialMessage(`Turno especial asignado: ${json.turnCode ?? ""}`);
      setSpecialStudentCode("");
      return;
    }

    setSpecialMessage(json.error || "No se pudo asignar el turno especial.");
  };

  const findSpecialStudent = async () => {
    setSpecialMessage("");
    setSpecialStudentPreview(null);
    const response = await submitMonitorAction({ action: "find_student", studentCode: specialStudentCode });
    const json = await response?.json().catch(() => ({}));
    if (response?.ok && json.student) {
      setSpecialStudentPreview(json.student);
      return;
    }

    setSpecialMessage(json.error || "No encontramos ese codigo.");
  };

  const openHistoryDate = async (date: string) => {
    setHistoryPopupDate(date);
    setHistoryQuery("");
    const response = await fetch(`/api/tickets/monitor?date=${date}`, { cache: "no-store" });
    const json = await response.json().catch(() => ({}));
    setHistoryTurns(Array.isArray(json.turns) ? json.turns : []);
  };

  const getBarcodeDetector = () =>
    (window as unknown as {
      BarcodeDetector?: new (options: { formats: string[] }) => {
        detect: (source: ImageBitmap | HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
      };
    }).BarcodeDetector;

  const isOfficialLunchQr = (qrValue: string) => {
    const normalized = qrValue.trim();
    return normalized === lunchTurnQrId || normalized.includes(lunchTurnQrId);
  };

  const stopQrScanner = useCallback(() => {
    if (scannerFrameRef.current !== null) {
      cancelAnimationFrame(scannerFrameRef.current);
      scannerFrameRef.current = null;
    }

    qrScannerRef.current?.stop();
    qrScannerRef.current?.destroy();
    qrScannerRef.current = null;

    scannerStreamRef.current?.getTracks().forEach(track => track.stop());
    scannerStreamRef.current = null;

    if (scannerVideoRef.current) {
      scannerVideoRef.current.srcObject = null;
    }

    setScannerActive(false);
  }, []);

  async function assignTurnFromQr(qrValue: string) {
    if (!isOfficialLunchQr(qrValue)) {
      setScanMessage("Ese QR no corresponde al servicio de almuerzos.");
      return false;
    }

    stopQrScanner();
    await submitTurnAction("request");
    setScanMessage("Lectura completada.");
    setCameraPopupOpen(false);
    setStudentScanOpen(false);
    return true;
  }

  const startBarcodeDetectorScanner = async () => {
    setScanMessage("Abriendo camara...");

    const Detector = getBarcodeDetector();
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      setScanMessage("Este navegador no tiene lector QR en vivo. Usa la galeria como alternativa.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      const video = scannerVideoRef.current;
      if (!video) {
        stream.getTracks().forEach(track => track.stop());
        setScanMessage("No pudimos iniciar el visor de camara.");
        return;
      }

      scannerStreamRef.current = stream;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();
      setScannerActive(true);
      setScanMessage("Apunta la camara al QR oficial de turnos.");

      const detector = new Detector({ formats: ["qr_code"] });
      const scanFrame = async () => {
        if (!scannerStreamRef.current || !scannerVideoRef.current) return;

        try {
          const codes = await detector.detect(scannerVideoRef.current);
          const qrValue = codes[0]?.rawValue ?? "";
          if (qrValue && (await assignTurnFromQr(qrValue))) {
            return;
          }
        } catch {
          // Continue scanning; some browsers throw while the video is warming up.
        }

        scannerFrameRef.current = requestAnimationFrame(scanFrame);
      };

      scannerFrameRef.current = requestAnimationFrame(scanFrame);
    } catch {
      stopQrScanner();
      setScanMessage("No pudimos acceder a la camara. Revisa permisos o usa la galeria.");
    }
  };

  const startQrScanner = async () => {
    stopQrScanner();
    setScanMessage("Abriendo camara...");

    const video = scannerVideoRef.current;
    if (!video) {
      setScanMessage("No pudimos iniciar el visor de camara.");
      return;
    }

    try {
      const { default: QrScanner } = await import("qr-scanner");
      const scanner = new QrScanner(
        video,
        result => {
          const qrValue = typeof result === "string" ? result : result.data;
          if (qrValue) {
            void assignTurnFromQr(qrValue);
          }
        },
        {
          preferredCamera: "environment",
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 10
        }
      );

      qrScannerRef.current = scanner;
      setScannerActive(true);
      await scanner.start();
      setScanMessage("Apunta la camara al QR oficial de turnos.");
    } catch {
      stopQrScanner();
      await startBarcodeDetectorScanner();
    }
  };

  useEffect(() => {
    if (!cameraPopupOpen) {
      stopQrScanner();
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      void startQrScanner();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [cameraPopupOpen]);

  useEffect(() => {
    if (!studentScanOpen) {
      setCameraPopupOpen(false);
    }

    return () => stopQrScanner();
  }, [studentScanOpen, stopQrScanner]);

  useEffect(() => () => cancelTurnHold(), []);

  const readQrFromImage = async (file: File) => {
    setScanMessage("Leyendo imagen...");
    try {
      const Detector = getBarcodeDetector();

      if (!Detector) {
        setScanMessage("Este navegador no puede leer QR desde imagen. Usa la camara en vivo.");
        return;
      }

      const bitmap = await createImageBitmap(file);
      const detector = new Detector({ formats: ["qr_code"] });
      const codes = await detector.detect(bitmap);
      const qrValue = codes[0]?.rawValue ?? "";
      await assignTurnFromQr(qrValue);
    } catch {
      setScanMessage("No pudimos leer el QR. Intenta con otra imagen.");
    }
  };

  const handleQrImageInput = async (file?: File) => {
    if (!file) return;
    await readQrFromImage(file);
  };

  const nextDay = () => setActiveDay(prev => Math.min(days.length - 1, prev + 1));
  const prevDay = () => setActiveDay(prev => Math.max(0, prev - 1));
  const startMenuSwipe = (event: PointerEvent<HTMLDivElement>) => {
    menuSwipeStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const finishMenuSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const startX = menuSwipeStart.current;
    menuSwipeStart.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (startX === null) return;

    const delta = event.clientX - startX;
    if (Math.abs(delta) < 42) return;
    if (delta < 0) {
      nextDay();
      return;
    }
    prevDay();
  };
  const proceedToPayment = async () => {
    if (!selectedPaymentMethod) {
      setPaymentMessage("Selecciona un metodo de pago antes de proceder.");
      return;
    }

    setPaymentMessage("");

    if (selectedPaymentMethod === "nudos") {
      await approveAndRedeem();
      return;
    }

    setPaymentMessage(
      selectedPaymentMethod === "card"
        ? "Metodo con tarjeta seleccionado. La pasarela se conectara en el siguiente paso."
        : "Metodo NEQUI seleccionado. La pasarela se conectara en el siguiente paso.",
    );
  };
  const submitTurnAction = async (action: "request" | "reactivate", type: "regular" | "special" = "regular") => {
    setIsTurnLoading(true);
    setTurnMessage("");
    setTurnError("");

    try {
      const response = await fetch("/api/tickets/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type, qrCodeId: action === "request" ? lunchTurnQrId : undefined }),
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        setTurnError(json.error || "No se pudo actualizar tu turno.");
        return;
      }

      setTurn(json.turn ?? null);
      setTurnMessage(
        type === "special"
          ? "Reserva especial asignada correctamente."
          : action === "reactivate"
            ? "Tu turno fue reactivado por 10 minutos."
            : "Turno asignado correctamente.",
      );
    } finally {
      setIsTurnLoading(false);
    }
  };

  return (
    <>
      <main className="tickets-screen">
        <section className="tickets-shell">
          <FeatureGate module="tickets">
          <header className="tickets-topbar">
            {monitorState.isRestaurantMonitor ? (
              <button
                className="tickets-topbar__monitor"
                type="button"
                onClick={() => setMonitorOpen(true)}
                aria-label="Abrir panel de monitor"
              >
                <ClipboardList size={18} />
              </button>
            ) : null}
            <h1>Compra de Tickets</h1>
            <button className="tickets-topbar__menu" type="button" onClick={() => setTurnsOpen(true)} aria-label="Abrir menu y turnos">
              <Menu size={18} />
            </button>
          </header>

          <section className="tickets-info-grid">
            <article className="tickets-info-card">
              <h2>Tickets de Almuerzo</h2>
              <p>
                Recarga tus tickets para disfrutar de almuerzos en la cafeteria. Puedes
                comprar 3 hasta 45 tickets.
              </p>
            </article>

            <button className="tickets-turn-card" type="button" onClick={() => setTurnsOpen(true)}>
              <span className="tickets-turn-card__icon" aria-hidden="true">
                <Image src="/tickets/Ticket.svg" alt="" width={58} height={58} />
              </span>
              <span>
                Solicitar turno
                <br />
                para almorzar.
              </span>
            </button>
          </section>

          <section className="tickets-purchase-card">
            <div className="tickets-purchase-card__header">
              <div className="tickets-purchase-card__copy">
                <h2>
                  Cantidad
                  <br />
                  de tickets:
                </h2>
                <p>{hasNegotiatedBenefit ? "Tarifa regular con bono" : "Tarifa regular sin bono"}</p>
              </div>
              <div className="tickets-counter">
                <button type="button" onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>
                  <Minus size={16} />
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity(prev => Math.min(45, prev + 1))}>
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="tickets-pricing">
              <div>
                <span>Precio por ticket</span>
                <strong>${pricePerTicketCop.toLocaleString("es-CO")}</strong>
              </div>
              <div>
                <span>Subtotal:</span>
                <strong>${subtotalCop.toLocaleString("es-CO")}</strong>
              </div>
            </div>
          </section>

          <section className="tickets-total-card">
            <div className="tickets-total-card__line">
              <span>Total a pagar:</span>
              <strong>${totalCop.toLocaleString("es-CO")}</strong>
            </div>
            <small>
              <span>Equivalente a</span>
              <em>{nudosEquivalent.toLocaleString("es-CO")} $NUDOS</em>
            </small>
          </section>

          <section className="tickets-summary-card">
            <h2>Resumen de tu cuenta</h2>
            <div className="tickets-summary-card__row">
              <span>Tickets actuales:</span>
              <strong>{summary.current}</strong>
            </div>
            <div className="tickets-summary-card__row">
              <span>Tickets a comprar:</span>
              <strong>{summary.toBuy}</strong>
            </div>
            <div className="tickets-summary-card__row is-total">
              <span>Total despues de compra:</span>
              <strong>{summary.after}</strong>
            </div>
          </section>

          <section className="tickets-payment-card">
            <h2>Metodo de pago</h2>

            <div className="tickets-payment-card__quick">
              {paymentMethods.map(method => (
                <button
                  key={method.key}
                  type="button"
                  className={selectedPaymentMethod === method.key ? "is-selected" : ""}
                  aria-pressed={selectedPaymentMethod === method.key}
                  onClick={() => {
                    setSelectedPaymentMethod(method.key);
                    setPaymentMessage("");
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <form className="tickets-payment-form">
              <button
                type="button"
                onClick={proceedToPayment}
                disabled={!selectedPaymentMethod || isSubmitting || isLoadingQuote}
              >
                {isSubmitting ? "Procesando..." : "Proceder al pago"}
              </button>
            </form>
            {paymentMessage ? <p className="profile-wallet-copy">{paymentMessage}</p> : null}
            {statusMessage ? <p className="profile-wallet-copy">{statusMessage}</p> : null}
            {errorMessage ? <p className="profile-wallet-copy">{errorMessage}</p> : null}
          </section>
          </FeatureGate>
        </section>
      </main>

      <div
        className={`tickets-overlay ${
          turnsOpen ||
          monitorOpen ||
          queuePopupOpen ||
          specialPopupOpen ||
          monitorQrOpen ||
          studentScanOpen ||
          cameraPopupOpen ||
          turnOptionsOpen ||
          historyPopupDate
            ? "is-open"
            : ""
        }`}
        onClick={() => {
          setTurnsOpen(false);
          setMonitorOpen(false);
          setQueuePopupOpen(false);
          setSpecialPopupOpen(false);
          setMonitorQrOpen(false);
          setStudentScanOpen(false);
          setCameraPopupOpen(false);
          setTurnOptionsOpen(false);
          setHistoryPopupDate(null);
        }}
      />

      {monitorState.isRestaurantMonitor ? (
        <aside className={`tickets-monitor-drawer ${monitorOpen ? "is-open" : ""}`}>
          <header className="tickets-drawer__topbar">
            <button type="button" onClick={() => setMonitorOpen(false)} aria-label="Cerrar panel de monitor">
              <X size={18} />
            </button>
            <h2>Control de fila</h2>
            <button type="button" onClick={() => setMonitorQrOpen(true)} aria-label="Mostrar QR de turnos">
              <QrCode size={18} />
            </button>
          </header>

          <section className="tickets-monitor-summary">
            <div>
              <strong>{monitorState.summary.activo}</strong>
              <span>Activos</span>
            </div>
            <div>
              <strong>{monitorState.summary.en_fila}</strong>
              <span>En fila</span>
            </div>
            <div>
              <strong>{monitorState.summary.atendido}</strong>
              <span>Atendidos</span>
            </div>
            <div>
              <strong>{monitorState.summary.expirado}</strong>
              <span>Expirados</span>
            </div>
          </section>

          <button type="button" className="tickets-monitor-list-button" onClick={() => setQueuePopupOpen(true)}>
            <ListChecks size={18} />
            Ver lista en curso
          </button>

          <section className="tickets-monitor-tools">
            <button
              className={monitorState.isQueuePaused ? "is-resume" : "is-pause"}
              type="button"
              disabled={isMonitorActionLoading}
              onClick={toggleQueuePause}
            >
              {monitorState.isQueuePaused ? <Play size={16} /> : <Pause size={16} />}
              {monitorState.isQueuePaused ? "Reanudar fila" : "Pausar fila"}
            </button>
            <button
              className="is-special"
              type="button"
              disabled={isMonitorActionLoading}
              onClick={() => setSpecialPopupOpen(true)}
            >
              <Star size={16} />
              Turno especial
            </button>
          </section>

          <section className="tickets-monitor-list is-retired">
            {filteredMonitorTurns.length > 0 ? (
              filteredMonitorTurns.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`tickets-monitor-row ${selectedMonitorTurnId === item.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedMonitorTurnId(item.id)}
                >
                  <div>
                    <strong>{item.turn_code}</strong>
                    <span>{monitorStatusLabels[item.status]}</span>
                  </div>
                  <p>
                    {item.student_name}
                    <small>{item.student_code} · {item.student_email}</small>
                  </p>
                </button>
              ))
            ) : (
              <div className="tickets-monitor-empty">
                <strong>Sin turnos para mostrar</strong>
                <span>Cuando los estudiantes escaneen el QR apareceran aqui.</span>
              </div>
            )}
          </section>
          <section className="tickets-monitor-calendar">
            <label>
              <span>Histórico de fila</span>
              <input
                type="date"
                value={historyDateInput}
                max={formatMonitorDate(new Date())}
                onChange={event => setHistoryDateInput(event.target.value)}
              />
            </label>
            <button type="button" onClick={() => openHistoryDate(historyDateInput)}>
              <CalendarDays size={16} />
              Abrir día
            </button>
          </section>
        </aside>
      ) : null}

      {monitorQrOpen ? (
        <section className="tickets-monitor-modal is-compact" role="dialog" aria-modal="true">
          <header>
            <h2>QR de turnos</h2>
            <button type="button" onClick={() => setMonitorQrOpen(false)} aria-label="Cerrar QR de turnos">
              <X size={18} />
            </button>
          </header>
          <div className="tickets-monitor-qr">
            <img src="/api/tickets/turn/qr" alt="QR oficial para asignar turnos" width={210} height={210} />
            <span>QR oficial de almuerzos</span>
          </div>
        </section>
      ) : null}

      {queuePopupOpen ? (
        <section className="tickets-monitor-modal" role="dialog" aria-modal="true">
          <header>
            <h2>Lista en curso</h2>
            <button type="button" onClick={() => setQueuePopupOpen(false)} aria-label="Cerrar lista">
              <X size={18} />
            </button>
          </header>
          <label className="tickets-monitor-search is-modal">
            <Search size={16} />
            <input
              value={monitorQuery}
              onChange={event => setMonitorQuery(event.target.value)}
              placeholder="Buscar turno, codigo, correo o nombre"
            />
          </label>
          <div className="tickets-monitor-modal-list">
            {filteredMonitorTurns.length > 0 ? (
              filteredMonitorTurns.map(item => {
                const isChecked = item.status === "atendido";
                return (
                  <article
                    key={item.id}
                    className={`tickets-monitor-row ${isChecked ? "is-checked" : ""} ${item.is_paused ? "is-paused" : ""}`}
                    onPointerDown={() => startTurnHold(item)}
                    onPointerUp={cancelTurnHold}
                    onPointerLeave={cancelTurnHold}
                    onPointerCancel={cancelTurnHold}
                  >
                    <button
                      type="button"
                      className="tickets-monitor-check"
                      onPointerDown={event => event.stopPropagation()}
                      onClick={event => {
                        event.stopPropagation();
                        void toggleTurnPassed(item);
                      }}
                      aria-label={isChecked ? "Desmarcar turno atendido" : "Marcar turno como atendido"}
                    >
                      <Check size={16} />
                    </button>
                    <div>
                      <strong>
                        {item.turn_code}
                        {item.is_special ? <small>Especial</small> : null}
                        {item.is_paused ? <small>Pausado</small> : null}
                      </strong>
                      <span>{monitorStatusLabels[item.status]}</span>
                    </div>
                    <p>
                      {item.student_name}
                      <small>{item.student_code} - {item.student_email}</small>
                    </p>
                  </article>
                );
              })
            ) : (
              <div className="tickets-monitor-empty">
                <strong>Sin turnos en curso</strong>
                <span>Cuando los estudiantes escaneen el QR apareceran aqui.</span>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {turnOptionsOpen && turnOptionsTarget ? (
        <section className="tickets-monitor-modal is-compact" role="dialog" aria-modal="true">
          <header>
            <h2>{turnOptionsTarget.turn_code}</h2>
            <button
              type="button"
              onClick={() => {
                setTurnOptionsOpen(false);
                setTurnOptionsTarget(null);
              }}
              aria-label="Cerrar opciones de turno"
            >
              <X size={18} />
            </button>
          </header>
          <div className="tickets-turn-options">
            <div>
              <strong>{turnOptionsTarget.student_name}</strong>
              <small>{turnOptionsTarget.student_code} - {turnOptionsTarget.student_email}</small>
            </div>
            <button
              type="button"
              className={turnOptionsTarget.is_paused ? "is-resume" : "is-pause"}
              disabled={isMonitorActionLoading || turnOptionsTarget.status === "atendido" || turnOptionsTarget.status === "expirado"}
              onClick={() => toggleTurnPause(turnOptionsTarget)}
            >
              {turnOptionsTarget.is_paused ? <Play size={16} /> : <Pause size={16} />}
              {turnOptionsTarget.is_paused ? "Reanudar turno" : "Pausar turno"}
            </button>
            <button
              type="button"
              className="is-expire"
              disabled={isMonitorActionLoading || turnOptionsTarget.status === "expirado"}
              onClick={() => expireTurn(turnOptionsTarget)}
            >
              <X size={16} />
              Expirar turno
            </button>
          </div>
        </section>
      ) : null}

      {specialPopupOpen ? (
        <section className="tickets-monitor-modal is-compact" role="dialog" aria-modal="true">
          <header>
            <h2>Turno especial</h2>
            <button type="button" onClick={() => setSpecialPopupOpen(false)} aria-label="Cerrar turno especial">
              <X size={18} />
            </button>
          </header>
          <label className="tickets-special-form">
            <span>Codigo del estudiante</span>
            <input
              value={specialStudentCode}
              onChange={event => {
                setSpecialStudentCode(event.target.value);
                setSpecialStudentPreview(null);
                setSpecialMessage("");
              }}
              placeholder="Ej. 20240001"
            />
          </label>
          <button
            type="button"
            className="tickets-special-submit"
            disabled={isMonitorActionLoading || !specialStudentCode.trim()}
            onClick={findSpecialStudent}
          >
            Buscar estudiante
          </button>
          {specialStudentPreview ? (
            <div className="tickets-special-preview">
              <strong>{specialStudentPreview.student_name}</strong>
              <span>{specialStudentPreview.student_code} - {specialStudentPreview.student_email}</span>
            </div>
          ) : null}
          <button
            type="button"
            className="tickets-special-submit"
            disabled={isMonitorActionLoading || !specialStudentPreview}
            onClick={assignSpecialTurn}
          >
            Asignar
          </button>
          {specialMessage ? <p className="tickets-special-message">{specialMessage}</p> : null}
        </section>
      ) : null}

      {studentScanOpen ? (
        <section className="tickets-monitor-modal is-compact" role="dialog" aria-modal="true">
          <header>
            <h2>Leer QR de turno</h2>
            <button
              type="button"
              onClick={() => {
                stopQrScanner();
                setCameraPopupOpen(false);
                setStudentScanOpen(false);
              }}
              aria-label="Cerrar lector de QR"
            >
              <X size={18} />
            </button>
          </header>
          <div className="tickets-scan-options">
            <button
              type="button"
              onClick={() => {
                setScanMessage("");
                setCameraPopupOpen(true);
              }}
            >
              Abrir camara
            </button>
            <button type="button" onClick={() => galleryInputRef.current?.click()}>
              Leer imagen de galeria
            </button>
          </div>
          <input
            ref={galleryInputRef}
            className="tickets-hidden-input"
            type="file"
            accept="image/*"
            onChange={event => handleQrImageInput(event.target.files?.[0])}
          />
          {scanMessage ? <p className="tickets-special-message">{scanMessage}</p> : null}
        </section>
      ) : null}

      {cameraPopupOpen ? (
        <section className="tickets-monitor-modal is-compact" role="dialog" aria-modal="true">
          <header>
            <h2>Camara QR</h2>
            <button
              type="button"
              onClick={() => {
                stopQrScanner();
                setCameraPopupOpen(false);
              }}
              aria-label="Cerrar camara QR"
            >
              <X size={18} />
            </button>
          </header>
          <video
            ref={scannerVideoRef}
            className={`tickets-scan-video ${scannerActive ? "is-active" : ""}`}
            muted
            playsInline
          />
          {scanMessage ? <p className="tickets-special-message">{scanMessage}</p> : null}
        </section>
      ) : null}

      {historyPopupDate ? (
        <section className="tickets-monitor-modal" role="dialog" aria-modal="true">
          <header>
            <h2>Historico {historyPopupDate}</h2>
            <button type="button" onClick={() => setHistoryPopupDate(null)} aria-label="Cerrar historico">
              <X size={18} />
            </button>
          </header>
          <label className="tickets-monitor-search is-modal">
            <Search size={16} />
            <input
              value={historyQuery}
              onChange={event => setHistoryQuery(event.target.value)}
              placeholder="Buscar en el historico"
            />
          </label>
          <div className="tickets-monitor-modal-list">
            {filteredHistoryTurns.length > 0 ? (
              filteredHistoryTurns.map(item => (
                <article key={item.id} className="tickets-monitor-row">
                  <div>
                    <strong>{item.turn_code}</strong>
                    <span>{monitorStatusLabels[item.status]}</span>
                  </div>
                  <p>
                    {item.student_name}
                    <small>{item.student_code} - {item.student_email}</small>
                  </p>
                </article>
              ))
            ) : (
              <div className="tickets-monitor-empty">
                <strong>Sin registros</strong>
                <span>No hay turnos guardados para este dia.</span>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <aside className={`tickets-drawer ${turnsOpen ? "is-open" : ""}`}>
        <header className="tickets-drawer__topbar">
          <button type="button" onClick={() => setTurnsOpen(false)} aria-label="Volver">
            <ArrowLeft size={18} />
          </button>
          <h2>Menus y Turnos</h2>
          <button type="button" onClick={() => setTurnsOpen(false)} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <section className="tickets-menu-carousel">
          <div className="tickets-menu-carousel__controls">
            <button type="button" onClick={prevDay} disabled={activeDay === 0}>
              <ChevronLeft size={16} />
            </button>
            <span>{days[activeDay]?.day}</span>
            <button type="button" onClick={nextDay} disabled={activeDay === days.length - 1}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div
            className="tickets-menu-carousel__image"
            onPointerDown={startMenuSwipe}
            onPointerUp={finishMenuSwipe}
            onPointerCancel={() => {
              menuSwipeStart.current = null;
            }}
          >
            <Image
              key={days[activeDay]?.image}
              src={days[activeDay]?.image ?? "/images/slide-1.jpg"}
              alt={`Menu ${days[activeDay]?.day}`}
              fill
            />
          </div>
        </section>

        <section className="tickets-turn-status">
          <h3>Tu turno actual</h3>
          <div className="tickets-turn-status__grid">
            <div>
              <span>Numero de turno:</span>
              <strong>{turn?.number ?? "--"}</strong>
            </div>
            <div>
              <span>Posicion en la fila:</span>
              <strong>{turn?.queuePosition ?? "--"}</strong>
            </div>
            <div>
              <span>Tiempo estimado:</span>
              <strong>
                {turn ? (turn.queuePaused ? "Fila pausada" : `${turn.estimatedMinutes} minutos (${turn.estimatedTimeLabel})`) : "--"}
              </strong>
            </div>
            <div>
              <span>Estado:</span>
              <strong className={turn?.status === "active" || turn?.status === "reserved" ? "is-active" : ""}>
                {turn ? turnStatusLabels[turn.status] : "Sin turno"}
              </strong>
            </div>
          </div>

          <div className="tickets-turn-status__progress">
            <div className="tickets-turn-status__labels">
              <span>Inicio</span>
              <span>En Fila</span>
              <span>Almuerzo</span>
            </div>
            <div className="tickets-turn-status__bar">
              <span style={{ width: `${turnProgress}%` }} />
            </div>
          </div>
        </section>

        <button
          className="tickets-qr-card"
          type="button"
          disabled={isTurnLoading}
          onClick={() => {
            setScanMessage("");
            setStudentScanOpen(true);
          }}
        >
          <span>Leer QR de turno</span>
          <QrCode size={34} />
        </button>

        <section className="tickets-turn-actions">
          <button
            type="button"
            className="is-dark"
            disabled={isTurnLoading || !turn}
            onClick={() => submitTurnAction("reactivate")}
          >
            Reactivar turno (10 minutos)
          </button>
          <small>Reactivaciones disponibles este mes: {turn?.reactivationsAvailable ?? 10}</small>
          <button
            type="button"
            className="is-accent"
            disabled={isTurnLoading}
            onClick={() => submitTurnAction("request", "special")}
          >
            Reservar almuerzo (turno especial)
          </button>
          <small>Reservas usadas este mes: {reservationUsage}</small>
          {turnMessage ? <small>{turnMessage}</small> : null}
          {turnError ? <small>{turnError}</small> : null}
        </section>
      </aside>
    </>
  );
}
