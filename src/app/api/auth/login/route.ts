import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticateUser, SESSION_COOKIE_NAME } from "@/lib/auth";
import { createSessionToken } from "@/lib/auth-token";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { departamento, usuario, password, rememberMe } = body || {};

    const authResult = await authenticateUser(departamento, usuario, password);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Duración de la sesión (30 días con Recordar, 7 días estándar)
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
    const token = await createSessionToken(authResult.user, maxAge);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return NextResponse.json({
      success: true,
      user: authResult.user,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al iniciar sesión." },
      { status: 500 }
    );
  }
}
