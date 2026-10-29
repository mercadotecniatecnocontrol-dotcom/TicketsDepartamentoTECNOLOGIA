"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  playUserAlarm,
  stopAlarm,
  shouldAlarmForUser,
  unlockAudioContext,
} from "@/lib/sound-alerts";

interface IncomingTicketNotice {
  id: string;
  title: string;
  user: string;
  departamento: string;
  asignadoA?: string;
  timestamp: number;
}

export default function TicketAlarmListener() {
  const { user, isAuthenticated } = useAuth();
  const [activeAlert, setActiveAlert] = useState<IncomingTicketNotice | null>(null);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [dismissedPermissionPrompt, setDismissedPermissionPrompt] = useState(false);

  // Mapa de id -> asignadoA para detectar tanto tickets nuevos como reasignaciones/transferencias
  const knownTicketMapRef = useRef<Map<string, string>>(new Map());
  const initialFetchDoneRef = useRef(false);

  // Consultar estado de permisos de notificación al cargar
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission("unsupported");
    }
  }, []);

  // Solicitar permiso de notificaciones de escritorio
  const handleRequestNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === "granted") {
          try {
            new Notification("🔔 Notificaciones activadas", {
              body: `Listo ${user?.nombre || ""}: Recibirás alertas instantáneas cuando recibas o te transfieran un ticket.`,
              icon: "/logotecno.png",
            });
          } catch {}
        }
      } catch (err) {
        console.warn("Error al solicitar permisos de notificación:", err);
      }
    }
  };

  const triggerAlarm = useCallback(
    async (ticket: IncomingTicketNotice) => {
      setActiveAlert(ticket);

      // Reproducir sonido personalizado para el usuario actual
      const played = await playUserAlarm(user?.nombre);
      setSoundBlocked(!played);

      // Notificación nativa del sistema operativo/navegador (pantalla y escritorio)
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const notif = new Notification(`🔔 Ticket Recibido: ${ticket.title}`, {
            body: `Folio #${ticket.id} (${ticket.departamento}) - Solicitante: ${ticket.user}${
              ticket.asignadoA ? ` • Para: ${ticket.asignadoA}` : ""
            }`,
            icon: "/logotecno.png",
            tag: `ticket-${ticket.id}`,
          });

          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        } catch {}
      }
    },
    [user]
  );

  // Desbloquear audio automáticamente con cualquier interacción del usuario en la página
  useEffect(() => {
    const handleUserInteraction = () => {
      unlockAudioContext();
      if (soundBlocked) {
        setSoundBlocked(false);
      }
    };
    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);
    window.addEventListener("touchstart", handleUserInteraction);
    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, [soundBlocked]);

  // Polling de tickets cada 7 segundos para detectar nuevas entradas y transferencias en tiempo real
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let isMounted = true;

    // Normalizador de destinatario para tolerar distintos formatos de datos
    const extractAssignee = (t: Record<string, unknown>): string => {
      let a = String(t.asignadoA ?? t.asignado_a ?? t.asignado ?? "").trim();
      if (!a && typeof t.detalles === "string") {
        const match = t.detalles.match(/\[Dirigido a:\s*([^\]\n]+)\]/i);
        if (match) a = match[1].trim();
      }
      return a;
    };

    const checkTickets = async () => {
      try {
        const res = await fetch("/api/tickets", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || !isMounted) return;

        // En la primera carga, solo registramos los IDs y asignados existentes sin sonar
        if (!initialFetchDoneRef.current) {
          data.forEach((t) => {
            knownTicketMapRef.current.set(String(t.id), extractAssignee(t));
          });
          initialFetchDoneRef.current = true;
          return;
        }

        const now = Date.now();

        // Buscar tickets nuevos O reasignados que le competan al usuario actual
        for (const t of data) {
          const tId = String(t.id);
          const currentAssignee = extractAssignee(t);
          const prevAssignee = knownTicketMapRef.current.get(tId);

          const isNew = prevAssignee === undefined;
          const isReassigned = !isNew && prevAssignee !== currentAssignee;

          if (isNew || isReassigned) {
            // Actualizar registro para no repetir alerta
            knownTicketMapRef.current.set(tId, currentAssignee);

            // Si es ticket nuevo, no sonar si tiene más de 5 minutos
            if (isNew && t.created_at) {
              const createdMs = new Date(t.created_at).getTime();
              if (!isNaN(createdMs) && now - createdMs > 300_000) {
                continue;
              }
            }

            // Si fue reasignado y el usuario actual fue quien lo transfirió, no sonar para sí mismo
            if (
              isReassigned &&
              user.nombre &&
              prevAssignee.toLowerCase().includes(user.nombre.toLowerCase())
            ) {
              continue;
            }

            const matchesUser = shouldAlarmForUser(
              t.departamento || "",
              user.departamento,
              user.role,
              currentAssignee,
              user.nombre
            );

            if (matchesUser) {
              triggerAlarm({
                id: tId,
                title: String(t.title || "Sin título"),
                user: String(t.user || "Usuario"),
                departamento: String(t.departamento || ""),
                asignadoA: currentAssignee,
                timestamp: Date.now(),
              });
              break; // Una alerta sonora a la vez
            }
          }
        }
      } catch {
        // Silencioso en caso de pérdida de red temporal
      }
    };

    // Primera verificación inmediata
    checkTickets();

    // Verificación periódica cada 7 segundos
    const interval = setInterval(checkTickets, 7000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, user, triggerAlarm]);

  // Cerrar alerta y detener audio
  const handleDismiss = () => {
    stopAlarm();
    setActiveAlert(null);
    setSoundBlocked(false);
  };

  // Reintentar reproducción si el navegador la bloqueó inicialmente
  const handleForcePlay = async () => {
    const ok = await playUserAlarm(user?.nombre, true);
    if (ok) {
      setSoundBlocked(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <>
      {/* ──── BANNER SUGERENCIA DE PERMISOS DE ESCRITORIO (si están en "default") ──── */}
      {notificationPermission === "default" && !dismissedPermissionPrompt && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[94vw] bg-white border border-[#003479]/20 rounded-2xl shadow-xl shadow-[#003479]/10 p-3 sm:p-3.5 flex items-center justify-between gap-3 animate-fade-in backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-[#003479]/10 text-[#003479] flex items-center justify-center shrink-0">
              🔔
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 leading-tight">
                Activa las notificaciones de escritorio
              </p>
              <p className="text-[11px] text-zinc-500 truncate">
                Recibe avisos al instante cuando te asignen un ticket, incluso si estás en otra ventana.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRequestNotifications}
              className="px-3 py-1.5 rounded-lg bg-[#003479] hover:bg-[#00275C] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              Activar
            </button>
            <button
              type="button"
              onClick={() => setDismissedPermissionPrompt(true)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer text-xs"
              title="Ocultar"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ──── BANNER FLOTANTE DE ALERTA DE NUEVO TICKET ──── */}
      {activeAlert && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-5 right-5 z-50 max-w-md w-[92vw] sm:w-[420px] bg-white border-2 border-[#003479] rounded-2xl shadow-2xl shadow-[#003479]/30 p-4 animate-bounce-subtle backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            {/* Ícono animado de campana / sonido */}
            <div className="w-11 h-11 rounded-xl bg-[#003479] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#003479]/30 animate-pulse">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#003479] bg-[#003479]/10 px-2 py-0.5 rounded-full">
                  ¡Nuevo Ticket Recibido!
                </span>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors"
                  title="Cerrar notificación"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <h4 className="text-sm font-bold text-zinc-900 mt-1 line-clamp-1">
                {activeAlert.title}
              </h4>

              <div className="text-xs text-zinc-600 mt-0.5 space-y-0.5">
                <p>
                  <span className="font-semibold text-[#003479]">Folio:</span> #{activeAlert.id}
                </p>
                <p className="line-clamp-1">
                  <span className="font-semibold">Solicitante:</span> {activeAlert.user} (
                  {activeAlert.departamento})
                </p>
                {activeAlert.asignadoA && (
                  <p className="line-clamp-1 text-[#003479] font-medium">
                    <span className="font-semibold">Dirigido a:</span> {activeAlert.asignadoA}
                  </p>
                )}
              </div>

              {/* Botones de acción */}
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-zinc-100">
                <Link
                  href="/admin"
                  onClick={handleDismiss}
                  className="flex-1 py-1.5 px-3 bg-[#003479] hover:bg-[#00275C] text-white text-xs font-semibold rounded-lg text-center shadow-xs transition-all active:scale-95"
                >
                  Ver en el Panel →
                </Link>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg transition-all"
                >
                  Silenciar
                </button>
              </div>

              {/* Aviso si el navegador bloqueó el autoplay */}
              {soundBlocked && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between gap-1">
                  <span>Haz clic para escuchar el audio</span>
                  <button
                    type="button"
                    onClick={handleForcePlay}
                    className="font-bold underline text-amber-900 cursor-pointer"
                  >
                    Reproducir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
