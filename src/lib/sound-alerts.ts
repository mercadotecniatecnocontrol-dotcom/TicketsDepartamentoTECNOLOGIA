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

    const baseUrl = getUserAudioUrl(userName);
    // Añadimos parámetro de tiempo para evitar que el navegador reproduzca audio antiguo en caché
    const audio = new Audio(`${baseUrl}?t=${Date.now()}`);
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
 * - Si el ticket va dirigido específicamente a un usuario -> ¡SOLO le suena su alarma a ese usuario!
 * - Si el ticket va dirigido a otro usuario en particular -> NO le suena a este usuario.
 * - Si el ticket no tiene destinatario específico (general o sin asignar):
 *   -> le suena únicamente a los usuarios del departamento correspondiente.
 */
export function shouldAlarmForUser(
  ticketDepartamento: string,
  userDepartamento?: string | null,
  userRole?: string | null,
  asignadoA?: string | null,
  currentUserName?: string | null
): boolean {
  if (!userRole) return false;

  const normalize = (str?: string | null) =>
    (str || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const cleanAsignado = normalize(asignadoA);
  const cleanCurrent = normalize(currentUserName);
  const cleanTicket = normalize(ticketDepartamento);
  const cleanUserDept = normalize(userDepartamento);

  // 1. Si el ticket está dirigido específicamente a alguien
  if (
    cleanAsignado &&
    cleanAsignado !== "todos" &&
    cleanAsignado !== "todo el equipo" &&
    cleanAsignado !== "general" &&
    cleanAsignado !== "sin asignar"
  ) {
    if (!cleanCurrent) return false;
    // ÚNICAMENTE suena si coincide con el usuario asignado
    return cleanAsignado.includes(cleanCurrent) || cleanCurrent.includes(cleanAsignado);
  }

  // 2. Si el ticket no tiene usuario específico (es para todo el departamento):
  // Solo le suena a los integrantes de ese departamento
  if (cleanTicket && cleanUserDept && cleanTicket === cleanUserDept) {
    return true;
  }

  return false;
}
