import { checkSupabaseHealth, seedSupabaseFromLocal } from "@/lib/supabase-service";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, canManageInventory } from "@/lib/auth";
import { verifySessionToken } from "@/lib/auth-token";
import type { NextRequest } from "next/server";

async function isAuthorizedAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  // Solo Sistemas o Gerencia pueden inspeccionar o sincronizar el estado técnico de Supabase
  return canManageInventory(session?.user?.departamento);
}

export async function GET() {
  try {
    const health = await checkSupabaseHealth();
    return Response.json(health);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Error al verificar el estado de Supabase", details: String(e) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!await isAuthorizedAdmin()) {
    return Response.json(
      { error: "Acceso denegado: solo personal autorizado (Sistemas o Gerencia)" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === "sync_local_to_supabase") {
      const result = await seedSupabaseFromLocal();
      return Response.json(result);
    }
    return Response.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Error al procesar la sincronización", details: String(e) },
      { status: 500 }
    );
  }
}
