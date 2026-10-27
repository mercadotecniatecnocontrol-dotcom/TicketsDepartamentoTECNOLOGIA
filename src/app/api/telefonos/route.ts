import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, canManageInventory } from "@/lib/auth";
import { verifySessionToken } from "@/lib/auth-token";
import {
  getTelefonos,
  createTelefono,
  updateTelefono,
  deleteTelefono,
} from "@/lib/supabase-service";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  return canManageInventory(session?.user?.departamento);
}

export async function GET() {
  if (!await isAuthorized()) {
    return Response.json({ error: "Acceso denegado: solo Sistemas y Gerencia" }, { status: 403 });
  }
  try {
    const data = await getTelefonos();
    return Response.json(data);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error al consultar teléfonos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await isAuthorized()) {
    return Response.json({ error: "Acceso denegado: solo Sistemas y Gerencia" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const newTel = await createTelefono(body);
    return Response.json(newTel, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error al registrar teléfono" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!await isAuthorized()) {
    return Response.json({ error: "Acceso denegado: solo Sistemas y Gerencia" }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!body?.id) {
      return Response.json({ error: "ID requerido" }, { status: 400 });
    }
    await updateTelefono(body);
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error al actualizar teléfono" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!await isAuthorized()) {
    return Response.json({ error: "Acceso denegado: solo Sistemas y Gerencia" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "ID requerido" }, { status: 400 });
    await deleteTelefono(id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error al eliminar teléfono" }, { status: 500 });
  }
}

