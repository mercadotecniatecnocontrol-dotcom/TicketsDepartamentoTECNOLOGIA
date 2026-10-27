"use client";

// Mapeo del nombre del usuario a su archivo MP3 dentro de /public/sounds/
export const USER_AUDIO_MAP: Record<string, { file: string; label: string }> = {
  alan: { file: "/sounds/alan.mp3", label: "Tono Alan (Sistemas)" },
  kevin: { file: "/sounds/kevin.mp3", label: "Tono Kevin (Sistemas)" },
  glen: { file: "/sounds/glen.mp3", label: "Tono Glen" },
  aldo: { file: "/sounds/aldo.mp3", label: "Tono Aldo (Arquitectura)" },
  erika: { file: "/sounds/erika.mp3", label: "Tono Erika (Marketing)" },
};

/**
 * Obtiene la ruta del archivo de audio asignado para un usuario.
 */
export function getUserAudioUrl(userName?: string | null): string {
  if (!userName) return "/sounds/alan.mp3";
  const clean = userName.trim().toLowerCase();
  for (const [key, val] of Object.entries(USER_AUDIO_MAP)) {
    if (clean.includes(key)) {
      return val.file;
    }
  }
  return "/sounds/alan.mp3";
}

/**
 * Lee la configuración de sonido desde localStorage (activado/desactivado y volumen).
 */
export function getSoundSettings(): { enabled: boolean; volume: number } {
  if (typeof window === "undefined") {
    return { enabled: true, volume: 1.0 };
  }
  try {
    const enabledVal = localStorage.getItem("tc_ticket_sound_enabled");
    const volumeVal = localStorage.getItem("tc_ticket_sound_volume");
    return {
      enabled: enabledVal !== "false",
      volume: volumeVal !== null ? Math.max(0, Math.min(1, parseFloat(volumeVal))) : 1.0,
    };
  } catch {
    return { enabled: true, volume: 1.0 };
  }
}

/**
 * Guarda la configuración de sonido en localStorage.
 */
export function saveSoundSettings(enabled: boolean, volume: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("tc_ticket_sound_enabled", String(enabled));
    localStorage.setItem("tc_ticket_sound_volume", String(volume));
  } catch {}
}

let activeAudioInstance: HTMLAudioElement | null = null;

/**
 * Reproduce la alarma asignada al usuario.
 * Retorna una promesa con booleano indicando si se reprodujo con éxito.
 */
export async function playUserAlarm(userName?: string | null, forcePlay = false): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const { enabled, volume } = getSoundSettings();
  if (!enabled && !forcePlay) {
    return false;
  }

  const audioUrl = getUserAudioUrl(userName);

  try {
    // Si había un audio sonando, detenerlo
    if (activeAudioInstance) {
      activeAudioInstance.pause();
      activeAudioInstance.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    audio.volume = Math.max(0, Math.min(1, volume));
    activeAudioInstance = audio;

    await audio.play();
    return true;
  } catch (err) {
    console.warn("No se pudo reproducir la alarma (requiere interacción previa):", err);
    return false;
  }
}

/**
 * Detiene cualquier sonido de alarma activo actualmente.
 */
export function stopAlarm(): void {
  if (activeAudioInstance) {
    try {
      activeAudioInstance.pause();
      activeAudioInstance.currentTime = 0;
    } catch {}
    activeAudioInstance = null;
  }
}

/**
 * Determina si debe sonar la alarma para el usuario actual ante un ticket entrante.
 * Regla:
 * - Si el usuario es 'admin' (Alan, Kevin, Glen Gerencia), le suena cualquier ticket.
 * - Si es usuario de departamento (Aldo, Erika, Glen Marketing), solo si el departamento coincide.
 */
export function shouldAlarmForUser(
  ticketDepartamento: string,
  userDepartamento?: string | null,
  userRole?: string | null
): boolean {
  if (!userRole) return false;
  if (userRole === "admin") return true;

  if (!userDepartamento || !ticketDepartamento) return false;

  const cleanTicket = ticketDepartamento.trim().toLowerCase();
  const cleanUser = userDepartamento.trim().toLowerCase();

  return cleanTicket === cleanUser;
}
