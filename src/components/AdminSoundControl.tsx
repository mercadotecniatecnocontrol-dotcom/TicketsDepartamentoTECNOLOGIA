"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getUserAudioUrl,
  playUserAlarm,
  stopAlarm,
  getSoundSettings,
  saveSoundSettings,
} from "@/lib/sound-alerts";

export default function AdminSoundControl() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = getSoundSettings();
    setEnabled(s.enabled);
    setVolume(s.volume);

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleSound = () => {
    const nextVal = !enabled;
    setEnabled(nextVal);
    saveSoundSettings(nextVal, volume);
    if (!nextVal) {
      stopAlarm();
      setIsPlayingTest(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVol = parseFloat(e.target.value);
    setVolume(nextVol);
    saveSoundSettings(enabled, nextVol);
  };

  const handleTestAudio = async () => {
    if (isPlayingTest) {
      stopAlarm();
      setIsPlayingTest(false);
      return;
    }

    setIsPlayingTest(true);
    await playUserAlarm(user?.nombre, true);
    setTimeout(() => {
      setIsPlayingTest(false);
    }, 4000);
  };

  const handleRequestNotifications = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === "granted") {
          try {
            new Notification("🔔 Notificaciones activadas", {
              body: `Las notificaciones de escritorio están funcionando para ${user?.nombre || "tu usuario"}.`,
              icon: "/logotecno.png",
            });
          } catch {}
        }
      } catch (err) {
        console.warn("Error solicitando permisos:", err);
      }
    }
  };

  const handleTestNotification = () => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("🔔 Prueba de Notificación Tecnocontrol", {
          body: `Hola ${user?.nombre || "Usuario"}, tu equipo recibirá avisos en segundo plano.`,
          icon: "/logotecno.png",
        });
      } catch {}
    }
  };

  const audioUrl = getUserAudioUrl(user?.nombre);
  const audioFileName = audioUrl.split("/").pop();

  return (
    <div className="relative" ref={popoverRef}>
      {/* Botón de acceso directo en la barra superior */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
          enabled
            ? "border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/70"
            : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
        }`}
        title={`Alarma sonora personalizada: ${user?.nombre || "Usuario"} (${audioFileName})`}
      >
        {enabled ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span className="hidden lg:inline text-[11px] font-semibold">Alarma: {user?.nombre || "Activa"}</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
            <span className="hidden lg:inline text-[11px]">Silenciada</span>
          </>
        )}
      </button>

      {/* Popover desplegable con controles */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-zinc-200/80 p-4 z-50 animate-fade-in-up text-left">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-xs font-bold text-[#003479] uppercase tracking-wider">
                Alarma de Tickets
              </h3>
              <p className="text-[11px] text-zinc-500">
                Audio asignado a <span className="font-semibold text-zinc-800">{user?.nombre || "tu usuario"}</span>
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#003479]/10 text-[#003479]">
              {audioFileName}
            </span>
          </div>

          <div className="py-3 space-y-3">
            {/* Botón de prueba rápida de audio */}
            <button
              type="button"
              onClick={handleTestAudio}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isPlayingTest
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs animate-pulse"
                  : "bg-[#003479] hover:bg-[#00275C] text-white shadow-xs"
              }`}
            >
              {isPlayingTest ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Detener sonido</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Probar mi audio ({user?.nombre})</span>
                </>
              )}
            </button>

            {/* Switch Activar/Desactivar */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-zinc-700">Sonido de alarma</span>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enabled ? "bg-[#003479]" : "bg-zinc-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Slider de volumen */}
            {enabled && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-zinc-600">
                  <span>Volumen</span>
                  <span className="font-semibold">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#003479]"
                />
              </div>
            )}

            {/* Notificaciones de escritorio */}
            <div className="pt-2 border-t border-zinc-100">
              {notificationPermission === "granted" ? (
                <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-emerald-800 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Avisos de escritorio activos
                  </span>
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="text-[10px] font-bold text-[#003479] hover:underline cursor-pointer"
                  >
                    Probar
                  </button>
                </div>
              ) : notificationPermission === "denied" ? (
                <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-[10px] text-red-700 leading-tight">
                  <p className="font-bold">⚠️ Avisos bloqueados en el navegador</p>
                  <p className="mt-0.5 text-zinc-600">
                    Haz clic en el candado 🔒 junto a la URL y cambia &quot;Notificaciones&quot; a Permitir.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  className="w-full text-left p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-[11px] text-zinc-700 flex items-center justify-between gap-1 transition-colors cursor-pointer"
                >
                  <span>Activar avisos de escritorio</span>
                  <span className="font-bold text-[#003479]">Permitir</span>
                </button>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 text-[10px] text-zinc-400 text-center">
            Suena automáticamente al recibir tickets nuevos
          </div>
        </div>
      )}
    </div>
  );
}
