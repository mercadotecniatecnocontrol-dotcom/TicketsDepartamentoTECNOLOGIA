"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  playUserAlarm,
  stopAlarm,
  shouldAlarmForUser,
  getUserAudioUrl,
  getSoundSettings,
  saveSoundSettings,
} from "@/lib/sound-alerts";

interface IncomingTicketNotice {
  id: string;
  title: string;
  user: string;
  departamento: string;
  timestamp: number;
}

export default function TicketAlarmListener() {
  const { user, isAuthenticated } = useAuth();
  const [activeAlert, setActiveAlert] = useState<IncomingTicketNotice | null>(null);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const knownTicketIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDoneRef = useRef(false);

  // Solicitar permiso de notificaciones del navegador si el usuario lo desea
  const requestDesktopNotification = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch {}
      }
    }
  }, []);

  const triggerAlarm = useCallback(
    async (ticket: IncomingTicketNotice) => {
      setActiveAlert(ticket);
      setIsPlaying(true);

      // Reproducir sonido personalizado para el usuario actual
      const played = await playUserAlarm(user?.nombre);
      if (!played) {
        setSoundBlocked(true);
      } else {
        setSoundBlocked(false);
      }

      // Notificación nativa del sistema operativo/navegador
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("🔔 Nuevo Ticket en Tecnocontrol", {
            body: `#${ticket.id} (${ticket.departamento}) - ${ticket.title} por ${ticket.user}`,
            icon: "/logotecno.png",
          });
        } catch {}
      }
    },
    [user]
  );

  // Desbloquear audio con cualquier interacción del usuario
  useEffect(() => {
    const handleUserInteraction = () => {
      if (soundBlocked) {
        setSoundBlocked(false);
      }
    };
    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);
    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, [soundBlocked]);

  // Polling de tickets cada 7 segundos para detectar nuevas entradas en tiempo real
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let isMounted = true;

    const checkTickets = async () => {
      try {
        const res = await fetch("/api/tickets", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || !isMounted) return;

        // En la primera carga, solo registramos los IDs existentes sin sonar
        if (!initialFetchDoneRef.current) {
          const ids = new Set<string>(data.map((t) => String(t.id)));
          knownTicketIdsRef.current = ids;
          initialFetchDoneRef.current = true;
          return;
        }

        // Detectar tickets que no estaban en la lista conocida
        const newTickets = data.filter((t) => !knownTicketIdsRef.current.has(String(t.id)));

        if (newTickets.length > 0) {
          // Agregar nuevos IDs a la lista conocida para no repetir
          newTickets.forEach((t) => knownTicketIdsRef.current.add(String(t.id)));

          // Buscar el primer ticket nuevo que le competa al usuario
          for (const t of newTickets) {
            const matchesUser = shouldAlarmForUser(
              t.departamento || "",
              user.departamento,
              user.role
            );

            if (matchesUser) {
              triggerAlarm({
                id: String(t.id),
                title: String(t.title || "Sin título"),
                user: String(t.user || "Usuario"),
                departamento: String(t.departamento || ""),
                timestamp: Date.now(),
              });
              break; // Una alerta a la vez
            }
          }
        }
      } catch (err) {
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
    setIsPlaying(false);
    setActiveAlert(null);
    setSoundBlocked(false);
  };

  // Reintentar reproducción si el navegador la bloqueó inicialmente
  const handleForcePlay = async () => {
    const ok = await playUserAlarm(user?.nombre, true);
    if (ok) {
      setSoundBlocked(false);
      requestDesktopNotification();
    }
  };

  if (!isAuthenticated || !user) return null;

  return (
    <>
      {/* Banner flotante de Alerta de Nuevo Ticket */}
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
