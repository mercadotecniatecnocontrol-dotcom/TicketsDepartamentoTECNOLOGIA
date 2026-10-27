import { DEPARTAMENTOS, isDepartamento } from "@/lib/departamentos";
import {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
} from "@/lib/supabase-service";
import type { NextRequest } from "next/server";

export async function GET() {
  try {
    const tickets = await getTickets();
    return Response.json(tickets);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error al consultar los tickets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!isDepartamento(body.departamento)) {
      return Response.json(
        { error: `Departamento inválido. Opciones: ${DEPARTAMENTOS.join(", ")}` },
        { status: 400 }
      );
    }
    const newTicket = await createTicket(body);
    return Response.json(newTicket, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error al crear el ticket" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.id) {
      return Response.json({ error: "ID requerido" }, { status: 400 });
    }
    if (body.departamento !== undefined && !isDepartamento(body.departamento)) {
      return Response.json(
        { error: `Departamento inválido. Opciones: ${DEPARTAMENTOS.join(", ")}` },
        { status: 400 }
      );
    }
    await updateTicket(body);
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error al actualizar el ticket" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "ID requerido" }, { status: 400 });
    await deleteTicket(id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error al eliminar el ticket" }, { status: 500 });
  }
}

