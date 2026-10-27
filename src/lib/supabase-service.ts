import { readDb, writeDb } from "@/lib/db";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  TicketRow,
  ComputadoraRow,
  TelefonoRow,
} from "@/lib/supabase";
import { normalizeDepartamento } from "@/lib/departamentos";

const TICKETS_FILE = "tickets.json";
const COMPUTADORAS_FILE = "computadoras.json";
const TELEFONOS_FILE = "telefonos.json";

export const INITIAL_TICKETS: TicketRow[] = [];

export const INITIAL_COMPUTADORAS: ComputadoraRow[] = [
  { id: "COMP-1", equipo: "LAPTOP", ns: "DYM26J4", marca: "DELL", modelo: "LDC15250", procesador: "INTEL CORE I5 1334", ram: "16GB", discoDuro: "SSD 512GB", estatus: "SIN ASIGNAR", usuario: "N/D", observaciones: "NUEVA LISTA PARA USAR" },
  { id: "COMP-2", equipo: "LAPTOP", ns: "1HK26J4", marca: "DELL", modelo: "LDC15250", procesador: "INTEL CORE I5 1334", ram: "16GB", discoDuro: "SSD 512GB", estatus: "SIN ASIGNAR", usuario: "N/D", observaciones: "NUEVA LISTA PARA USAR" },
  { id: "COMP-3", equipo: "LAPTOP", ns: "9J1DTH4", marca: "DELL", modelo: "LDC15250", procesador: "INTEL CORE I5 1334", ram: "16GB", discoDuro: "SSD 512GB", estatus: "ASIGNADA", usuario: "MAGALY CHAVEZ", observaciones: "NUEVA EN USO" },
  { id: "COMP-4", equipo: "LAPTOP", ns: "6MVD5J4", marca: "DELL", modelo: "LDC15250", procesador: "INTEL CORE I5H1334", ram: "16GB", discoDuro: "SSD 512GB", estatus: "SIN ASIGNAR", usuario: "N/D", observaciones: "NUEVA LISTA PARA USAR" },
  { id: "COMP-5", equipo: "LAPTOP", ns: "C5GFTH4", marca: "DELL", modelo: "LDC15250", procesador: "INTEL CORE I5 1334", ram: "16GB", discoDuro: "SSD 512GB", estatus: "SIN ASIGNAR", usuario: "N/D", observaciones: "NUEVA LISTA PARA USAR" },
  { id: "COMP-6", equipo: "LAPTOP", ns: "C2ZJXH4", marca: "DELL", modelo: "LDC15250", procesador: "INTEL CORE I5 1334", ram: "16GB", discoDuro: "SSD 512GB", estatus: "ASIGNADA", usuario: "OMAR RICARDO GARDEA G", observaciones: "NUEVA EN USO" },
  { id: "COMP-7", equipo: "LAPTOP", ns: "3CRCTH4", marca: "DELL", modelo: "LDC15250", procesador: "INTEL CORE I5 1334", ram: "16GB", discoDuro: "SSD 512GB", estatus: "ASIGNADA", usuario: "ADRIAN CANO", observaciones: "EN USO" },
  { id: "COMP-8", equipo: "LAPTOP", ns: "7M467M3", marca: "DELL", modelo: "LATITUDE 5420", procesador: "INTEL CORE I7 11TH", ram: "16GB", discoDuro: "SSD 512GB", estatus: "ASIGNADA", usuario: "KEVIN", observaciones: "NUEVA EN USO" },
  { id: "COMP-9", equipo: "LAPTOP", ns: "5TLS4M3", marca: "DELL", modelo: "LATITUDE 5420", procesador: "INTEL CORE I7 11TH", ram: "16GB", discoDuro: "SSD 512GB", estatus: "SIN ASIGNAR", usuario: "N/D", observaciones: "NUEVA EN USO" }
];

export const INITIAL_TELEFONOS: TelefonoRow[] = [
  { id: "TEL-1", usuario: "GARDEA GIRON OMAR RICARDO", departamento: "CHIHUAHUA ALMACEN", numero: "6143849069", marca: "SAMSUNG", modelo: "A57 5G", imei: "357443195292272", observaciones: "NUEVO" },
  { id: "TEL-2", usuario: "SOTO GARCIA CRUZ FRANCISCO", departamento: "ALMACEN", numero: "6142504774", marca: "SAMSUNG", modelo: "A57 5G", imei: "357443195286316", observaciones: "NUEVO" },
  { id: "TEL-3", usuario: "CONTRERAS NIDIA", departamento: "ABASTECIMIENTO- ALMACEN", numero: "6141635895", marca: "SAMSUNG", modelo: "A57 5G", imei: "357443195288973", observaciones: "NUEVO" },
  { id: "TEL-4", usuario: "BLANCO MUÑOZ CRISTINA LIZETH", departamento: "GESTORIA", numero: "6144545125", marca: "IPHONE", modelo: "11", imei: "353979106874991", observaciones: "USADO" },
  { id: "TEL-5", usuario: "CANO CORRAL HECTOR ADRIAN", departamento: "OPERACIONES", numero: "6143429806", marca: "SAMSUNG", modelo: "A57 5G", imei: "357443195291324", observaciones: "NUEVO" },
  { id: "TEL-6", usuario: "ESCALANTE JARAMILLO ANA KAREN", departamento: "GESTORIA", numero: "6145941097", marca: "SAMSUNG", modelo: "A10S", imei: "357079102388363", observaciones: "USADO" },
  { id: "TEL-7", usuario: "JAIME RUEL LUNA ESPINOZA", departamento: "OPERACIONES", numero: "6142781803", marca: "SAMSUNG", modelo: "A57 5G", imei: "337443195283602", observaciones: "NUEVO" },
  { id: "TEL-8", usuario: "SAUL ISMAEL BARRAZA LUYA", departamento: "OPERACIONES", numero: "6141568460", marca: "SAMSUNG", modelo: "A57 5G", imei: "357443195291274", observaciones: "NUEVO" },
  { id: "TEL-9", usuario: "EVA ALEJANDRA ESPINOZA", departamento: "FACTURACION", numero: "6141414198", marca: "OUKITEL", modelo: "G1", imei: "354964201551933", observaciones: "USADO" },
  { id: "TEL-10", usuario: "KENIA GUZMAN", departamento: "GESTORIA", numero: "6142567708", marca: "OUKITEL", modelo: "G1", imei: "354964201157939", observaciones: "USADO" },
  { id: "TEL-11", usuario: "SERGIO CARMONA LAGUNA", departamento: "OPERACIONES", numero: "6143499380", marca: "SAMSUNG", modelo: "A57 5G", imei: "357443195283487", observaciones: "USADO" },
  { id: "TEL-12", usuario: "JOSUE HERNANDEZ PRIETO", departamento: "OPERACIONES", numero: "6141918610", marca: "SAMSUNG", modelo: "A57 5G", imei: "357443195267258", observaciones: "NUEVO" }
];

// Normalizadores para tolerar campos camelCase / snake_case indistintamente
/* eslint-disable @typescript-eslint/no-explicit-any */
export function normalizeTicket(row: any): TicketRow {
  return {
    id: String(row.id || ""),
    title: String(row.title || ""),
    user: String(row.user || row.usuario || ""),
    status: (row.status || "open") as "open" | "progress" | "resolved",
    date: String(row.date || ""),
    priority: String(row.priority || "Media"),
    departamento: normalizeDepartamento(row.departamento || ""),
    sucursal: String(row.sucursal || "Chihuahua"),
    ip: String(row.ip || ""),
    detalles: String(row.detalles || ""),
    fechaInicio: row.fechaInicio ?? row.fecha_inicio ?? "",
    fechaEsperada: String(row.fechaEsperada ?? row.fecha_esperada ?? ""),
    respuesta: String(row.respuesta || ""),
    evidencias: Array.isArray(row.evidencias) ? row.evidencias : [],
    created_at: row.created_at,
  };
}

export function normalizeComputadora(row: any): ComputadoraRow {
  return {
    id: String(row.id || ""),
    equipo: String(row.equipo || ""),
    ns: String(row.ns || ""),
    marca: String(row.marca || ""),
    modelo: String(row.modelo || ""),
    procesador: String(row.procesador || ""),
    ram: String(row.ram || ""),
    discoDuro: String(row.discoDuro ?? row.disco_duro ?? row.discoduro ?? ""),
    estatus: (row.estatus || "SIN ASIGNAR") as ComputadoraRow["estatus"],
    usuario: String(row.usuario || "N/D"),
    observaciones: String(row.observaciones || ""),
    created_at: row.created_at,
  };
}

export function normalizeTelefono(row: any): TelefonoRow {
  return {
    id: String(row.id || ""),
    usuario: String(row.usuario || ""),
    departamento: String(row.departamento || ""),
    numero: String(row.numero || ""),
    marca: String(row.marca || ""),
    modelo: String(row.modelo || ""),
    imei: String(row.imei || ""),
    observaciones: String(row.observaciones || ""),
    created_at: row.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ============================================================================
// TICKETS SERVICE
// ============================================================================

export async function getTickets(): Promise<TicketRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { data, error } = await client
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(normalizeTicket);
      }
      console.warn("[Supabase] Falló lectura de tickets, usando fallback local:", error?.message);
    } catch (e) {
      console.warn("[Supabase] Excepción en lectura de tickets, usando fallback local:", e);
    }
  }

  const local = readDb<TicketRow[]>(TICKETS_FILE, INITIAL_TICKETS);
  return local.map(normalizeTicket);
}

export async function createTicket(ticket: Partial<TicketRow>): Promise<TicketRow> {
  const newTicket: TicketRow = {
    id: ticket.id || `T-${Date.now().toString().slice(-6)}`,
    title: ticket.title || "Sin título",
    user: ticket.user || "Anónimo",
    status: ticket.status || "open",
    date: ticket.date || "Hoy",
    priority: ticket.priority || "Media",
    departamento: normalizeDepartamento(ticket.departamento || "Sistemas"),
    sucursal: ticket.sucursal || "Chihuahua",
    ip: ticket.ip || "",
    detalles: ticket.detalles || "",
    fechaInicio: ticket.fechaInicio || new Date().toISOString().slice(0, 10),
    fechaEsperada: ticket.fechaEsperada || "",
    respuesta: ticket.respuesta || "",
    evidencias: ticket.evidencias || [],
    created_at: new Date().toISOString(),
  };


  try {
    const local = readDb<TicketRow[]>(TICKETS_FILE, INITIAL_TICKETS);
    writeDb(TICKETS_FILE, [newTicket, ...local]);
  } catch (err) {
    console.error("[LocalDB] Error al escribir ticket local:", err);
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { data, error } = await client
        .from("tickets")
        .insert([newTicket])
        .select()
        .single();

      if (!error && data) {
        return normalizeTicket(data);
      }
      console.warn("[Supabase] No se pudo insertar en Supabase, guardado localmente:", error?.message);
    } catch (e) {
      console.warn("[Supabase] Excepción al insertar ticket en Supabase:", e);
    }
  }

  return newTicket;
}

export async function updateTicket(patch: Partial<TicketRow> & { id: string }): Promise<boolean> {
  // Actualizar en local
  try {
    const local = readDb<TicketRow[]>(TICKETS_FILE, INITIAL_TICKETS);
    const updatedLocal = local.map((t) => (t.id === patch.id ? { ...t, ...patch } : t));
    writeDb(TICKETS_FILE, updatedLocal);
  } catch (err) {
    console.error("[LocalDB] Error al actualizar ticket local:", err);
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { error } = await client.from("tickets").update(patch).eq("id", patch.id);
      if (error) {
        console.warn("[Supabase] Falló actualización en Supabase:", error.message);
      }
    } catch (e) {
      console.warn("[Supabase] Excepción al actualizar ticket en Supabase:", e);
    }
  }

  return true;
}

export async function deleteTicket(id: string): Promise<boolean> {
  // Borrar de local
  try {
    const local = readDb<TicketRow[]>(TICKETS_FILE, INITIAL_TICKETS);
    const filtered = local.filter((t) => t.id !== id);
    writeDb(TICKETS_FILE, filtered);
  } catch (err) {
    console.error("[LocalDB] Error al eliminar ticket local:", err);
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { error } = await client.from("tickets").delete().eq("id", id);
      if (error) {
        console.warn("[Supabase] Falló eliminación en Supabase:", error.message);
      }
    } catch (e) {
      console.warn("[Supabase] Excepción al eliminar ticket en Supabase:", e);
    }
  }

  return true;
}

// ============================================================================
// COMPUTADORAS SERVICE
// ============================================================================

export async function getComputadoras(): Promise<ComputadoraRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { data, error } = await client
        .from("computadoras")
        .select("*")
        .order("id", { ascending: true });

      if (!error && Array.isArray(data)) {
        return data.map(normalizeComputadora);
      }
      console.warn("[Supabase] Falló lectura de computadoras, usando fallback local:", error?.message);
    } catch (e) {
      console.warn("[Supabase] Excepción en lectura de computadoras:", e);
    }
  }

  const local = readDb<ComputadoraRow[]>(COMPUTADORAS_FILE, INITIAL_COMPUTADORAS);
  return local.map(normalizeComputadora);
}

export async function createComputadora(item: Partial<ComputadoraRow>): Promise<ComputadoraRow> {
  const newComp: ComputadoraRow = {
    id: item.id || `COMP-${Date.now().toString().slice(-4)}`,
    equipo: item.equipo || "LAPTOP",
    ns: item.ns || "",
    marca: item.marca || "",
    modelo: item.modelo || "",
    procesador: item.procesador || "",
    ram: item.ram || "",
    discoDuro: item.discoDuro || "",
    estatus: item.estatus || "SIN ASIGNAR",
    usuario: item.usuario || "N/D",
    observaciones: item.observaciones || "",
    created_at: new Date().toISOString(),
  };

  try {
    const local = readDb<ComputadoraRow[]>(COMPUTADORAS_FILE, INITIAL_COMPUTADORAS);
    writeDb(COMPUTADORAS_FILE, [newComp, ...local]);
  } catch (err) {
    console.error("[LocalDB] Error al escribir computadora local:", err);
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { data, error } = await client
        .from("computadoras")
        .insert([newComp])
        .select()
        .single();

      if (!error && data) {
        return normalizeComputadora(data);
      }
      console.warn("[Supabase] No se pudo insertar computadora en Supabase:", error?.message);
    } catch (e) {
      console.warn("[Supabase] Excepción al registrar computadora:", e);
    }
  }

  return newComp;
}

export async function updateComputadora(patch: Partial<ComputadoraRow> & { id: string }): Promise<boolean> {
  try {
    const local = readDb<ComputadoraRow[]>(COMPUTADORAS_FILE, INITIAL_COMPUTADORAS);
    const updated = local.map((c) => (c.id === patch.id ? { ...c, ...patch } : c));
    writeDb(COMPUTADORAS_FILE, updated);
  } catch (err) {
    console.error("[LocalDB] Error al actualizar computadora local:", err);
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { error } = await client.from("computadoras").update(patch).eq("id", patch.id);
      if (error) {
        console.warn("[Supabase] Error al actualizar computadora en Supabase:", error.message);
      }
    } catch (e) {
      console.warn("[Supabase] Excepción al actualizar computadora:", e);
    }
  }

  return true;
}

export async function deleteComputadora(id: string): Promise<boolean> {
  try {
    const local = readDb<ComputadoraRow[]>(COMPUTADORAS_FILE, INITIAL_COMPUTADORAS);
    const updated = local.filter((c) => c.id !== id);
    writeDb(COMPUTADORAS_FILE, updated);
  } catch (err) {
    console.error("[LocalDB] Error al eliminar computadora local:", err);
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { error } = await client.from("computadoras").delete().eq("id", id);
      if (error) {
        console.warn("[Supabase] Error al eliminar computadora en Supabase:", error.message);
      }
    } catch (e) {
      console.warn("[Supabase] Excepción al eliminar computadora:", e);
    }
  }

  return true;
}

// ============================================================================
// TELEFONOS SERVICE
// ============================================================================

export async function getTelefonos(): Promise<TelefonoRow[]> {
  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { data, error } = await client
        .from("telefonos")
        .select("*")
        .order("id", { ascending: true });

      if (!error && Array.isArray(data)) {
        return data.map(normalizeTelefono);
      }
      console.warn("[Supabase] Falló lectura de teléfonos, usando fallback local:", error?.message);
    } catch (e) {
      console.warn("[Supabase] Excepción en lectura de teléfonos:", e);
    }
  }

  const local = readDb<TelefonoRow[]>(TELEFONOS_FILE, INITIAL_TELEFONOS);
  return local.map(normalizeTelefono);
}

export async function createTelefono(item: Partial<TelefonoRow>): Promise<TelefonoRow> {
  const newTel: TelefonoRow = {
    id: item.id || `TEL-${Date.now().toString().slice(-4)}`,
    usuario: item.usuario || "",
    departamento: item.departamento || "",
    numero: item.numero || "",
    marca: item.marca || "",
    modelo: item.modelo || "",
    imei: item.imei || "",
    observaciones: item.observaciones || "",
    created_at: new Date().toISOString(),
  };

  try {
    const local = readDb<TelefonoRow[]>(TELEFONOS_FILE, INITIAL_TELEFONOS);
    writeDb(TELEFONOS_FILE, [newTel, ...local]);
  } catch (err) {
    console.error("[LocalDB] Error al escribir teléfono local:", err);
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { data, error } = await client
        .from("telefonos")
        .insert([newTel])
        .select()
        .single();

      if (!error && data) {
        return normalizeTelefono(data);
      }
      console.warn("[Supabase] Error al insertar teléfono en Supabase:", error?.message);
    } catch (e) {
      console.warn("[Supabase] Excepción al registrar teléfono:", e);
    }
  }

  return newTel;
}

export async function updateTelefono(patch: Partial<TelefonoRow> & { id: string }): Promise<boolean> {
  try {
    const local = readDb<TelefonoRow[]>(TELEFONOS_FILE, INITIAL_TELEFONOS);
    const updated = local.map((t) => (t.id === patch.id ? { ...t, ...patch } : t));
    writeDb(TELEFONOS_FILE, updated);
  } catch (err) {
    console.error("[LocalDB] Error al actualizar teléfono local:", err);
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { error } = await client.from("telefonos").update(patch).eq("id", patch.id);
      if (error) {
        console.warn("[Supabase] Error al actualizar teléfono en Supabase:", error.message);
      }
    } catch (e) {
      console.warn("[Supabase] Excepción al actualizar teléfono:", e);
    }
  }

  return true;
}

export async function deleteTelefono(id: string): Promise<boolean> {
  try {
    const local = readDb<TelefonoRow[]>(TELEFONOS_FILE, INITIAL_TELEFONOS);
    const updated = local.filter((t) => t.id !== id);
    writeDb(TELEFONOS_FILE, updated);
  } catch (err) {
    console.error("[LocalDB] Error al eliminar teléfono local:", err);
  }

  if (isSupabaseConfigured()) {
    try {
      const client = getSupabaseAdmin();
      const { error } = await client.from("telefonos").delete().eq("id", id);
      if (error) {
        console.warn("[Supabase] Error al eliminar teléfono en Supabase:", error.message);
      }
    } catch (e) {
      console.warn("[Supabase] Excepción al eliminar teléfono:", e);
    }
  }

  return true;
}

// ============================================================================
// HEALTH & SYNC UTILS
// ============================================================================

export interface SupabaseHealth {
  configured: boolean;
  url: string | null;
  connected: boolean;
  latencyMs?: number;
  tables: {
    tickets: { exists: boolean; count: number; error?: string };
    computadoras: { exists: boolean; count: number; error?: string };
    telefonos: { exists: boolean; count: number; error?: string };
  };
  localCounts: {
    tickets: number;
    computadoras: number;
    telefonos: number;
  };
  message: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const configured = isSupabaseConfigured();
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;

  const localTickets = readDb<TicketRow[]>(TICKETS_FILE, INITIAL_TICKETS);
  const localComputadoras = readDb<ComputadoraRow[]>(COMPUTADORAS_FILE, INITIAL_COMPUTADORAS);
  const localTelefonos = readDb<TelefonoRow[]>(TELEFONOS_FILE, INITIAL_TELEFONOS);

  const result: SupabaseHealth = {
    configured,
    url: rawUrl,
    connected: false,
    tables: {
      tickets: { exists: false, count: 0 },
      computadoras: { exists: false, count: 0 },
      telefonos: { exists: false, count: 0 },
    },
    localCounts: {
      tickets: localTickets.length,
      computadoras: localComputadoras.length,
      telefonos: localTelefonos.length,
    },
    message: configured
      ? "Supabase está configurado pero no se pudo verificar conexión."
      : "Supabase no está configurado en .env.local. La aplicación está operando con almacenamiento local JSON.",
  };

  if (!configured) {
    return result;
  }

  const start = Date.now();
  try {
    const client = getSupabaseAdmin();

    // Comprobar tabla tickets
    const tRes = await client.from("tickets").select("id", { count: "exact", head: true });
    if (!tRes.error) {
      result.tables.tickets = { exists: true, count: tRes.count || 0 };
    } else {
      result.tables.tickets = { exists: false, count: 0, error: tRes.error.message };
    }

    // Comprobar tabla computadoras
    const cRes = await client.from("computadoras").select("id", { count: "exact", head: true });
    if (!cRes.error) {
      result.tables.computadoras = { exists: true, count: cRes.count || 0 };
    } else {
      result.tables.computadoras = { exists: false, count: 0, error: cRes.error.message };
    }

    // Comprobar tabla telefonos
    const telRes = await client.from("telefonos").select("id", { count: "exact", head: true });
    if (!telRes.error) {
      result.tables.telefonos = { exists: true, count: telRes.count || 0 };
    } else {
      result.tables.telefonos = { exists: false, count: 0, error: telRes.error.message };
    }

    result.latencyMs = Date.now() - start;
    result.connected =
      result.tables.tickets.exists ||
      result.tables.computadoras.exists ||
      result.tables.telefonos.exists;

    if (result.connected) {
      result.message = "Conexión a Supabase activa y funcionando correctamente.";
    } else {
      result.message =
        "Supabase respondió pero las tablas aún no existen. Ejecuta el script supabase/schema.sql en el SQL Editor de Supabase.";
    }
  } catch (err) {
    result.latencyMs = Date.now() - start;
    result.connected = false;
    result.message = `Error de red al conectar con Supabase: ${err instanceof Error ? err.message : String(err)}`;
  }

  return result;
}

/**
 * Migra los registros locales actuales (data/*.json) hacia Supabase
 */
export async function seedSupabaseFromLocal(): Promise<{
  success: boolean;
  inserted: { tickets: number; computadoras: number; telefonos: number };
  errors: string[];
}> {
  const errors: string[] = [];
  const inserted = { tickets: 0, computadoras: 0, telefonos: 0 };

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      inserted,
      errors: ["Supabase no está configurado en las variables de entorno."],
    };
  }

  const client = getSupabaseAdmin();

  // 1. Tickets
  try {
    const localTickets = readDb<TicketRow[]>(TICKETS_FILE, INITIAL_TICKETS);
    if (localTickets.length > 0) {
      const { error } = await client
        .from("tickets")
        .upsert(localTickets.map(normalizeTicket), { onConflict: "id" });
      if (error) {
        errors.push(`Tickets: ${error.message}`);
      } else {
        inserted.tickets = localTickets.length;
      }
    }
  } catch (e) {
    errors.push(`Tickets exception: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Computadoras
  try {
    const localComps = readDb<ComputadoraRow[]>(COMPUTADORAS_FILE, INITIAL_COMPUTADORAS);
    if (localComps.length > 0) {
      const { error } = await client
        .from("computadoras")
        .upsert(localComps.map(normalizeComputadora), { onConflict: "id" });
      if (error) {
        errors.push(`Computadoras: ${error.message}`);
      } else {
        inserted.computadoras = localComps.length;
      }
    }
  } catch (e) {
    errors.push(`Computadoras exception: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3. Telefonos
  try {
    const localTels = readDb<TelefonoRow[]>(TELEFONOS_FILE, INITIAL_TELEFONOS);
    if (localTels.length > 0) {
      const { error } = await client
        .from("telefonos")
        .upsert(localTels.map(normalizeTelefono), { onConflict: "id" });
      if (error) {
        errors.push(`Telefonos: ${error.message}`);
      } else {
        inserted.telefonos = localTels.length;
      }
    }
  } catch (e) {
    errors.push(`Telefonos exception: ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    success: errors.length === 0,
    inserted,
    errors,
  };
}
