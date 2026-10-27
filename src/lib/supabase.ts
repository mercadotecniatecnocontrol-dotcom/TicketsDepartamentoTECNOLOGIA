import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type TicketRow = {
  id: string;
  title: string;
  user: string;
  status: "open" | "progress" | "resolved";
  date: string;
  priority: string;
  departamento: string;
  sucursal: string;
  ip: string;
  detalles: string;
  fechaInicio?: string;
  fechaEsperada: string;
  respuesta?: string;
  evidencias?: string[];
  asignadoA?: string;
  created_at?: string;
};

export type ComputadoraRow = {
  id: string;
  equipo: string;
  ns: string;
  marca: string;
  modelo: string;
  procesador: string;
  ram: string;
  discoDuro: string;
  estatus: "SIN ASIGNAR" | "ASIGNADA" | "EN REPARACIÓN" | "BAJA";
  usuario: string;
  observaciones: string;
  created_at?: string;
};

export type TelefonoRow = {
  id: string;
  usuario: string;
  departamento: string;
  numero: string;
  marca: string;
  modelo: string;
  imei: string;
  observaciones: string;
  created_at?: string;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tickets: {
        Row: TicketRow;

        Insert: Partial<TicketRow>;
        Update: Partial<TicketRow>;
        Relationships: [];
      };
      computadoras: {
        Row: ComputadoraRow;
        Insert: Partial<ComputadoraRow>;
        Update: Partial<ComputadoraRow>;
        Relationships: [];
      };
      telefonos: {
        Row: TelefonoRow;
        Insert: Partial<TelefonoRow>;
        Update: Partial<TelefonoRow>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}


/**
 * Verifica si las variables de entorno de Supabase están configuradas y no son valores de plantilla.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) return false;
  if (url.includes("your-project.supabase.co") || key.includes("your-anon-key")) {
    return false;
  }
  return url.startsWith("https://") && key.length > 20;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

/**
 * Cliente público de Supabase para operaciones del frontend o API con clave anónima.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Cliente de administración de Supabase para operaciones del servidor / Route Handlers.
 * Utiliza SUPABASE_SERVICE_ROLE_KEY si está disponible para omitir RLS.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
