import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth-token";
import { SESSION_COOKIE_NAME, canManageInventory } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = Boolean(session && session.user);

  // Proteger cualquier ruta dentro del panel administrativo (/admin)
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Solo Gerencia y Sistemas pueden ver la entrada de computadoras y teléfonos
    const isInventoryRoute =
      pathname.startsWith("/admin/computadoras") ||
      pathname.startsWith("/admin/telefonos");

    if (isInventoryRoute) {
      const dept = session?.user?.departamento;
      if (!canManageInventory(dept)) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  }

  // Si ya inició sesión y visita /login, enviar a /admin salvo que se solicite cambiar de departamento (?switch=true)
  if (pathname === "/login") {
    const isSwitch = request.nextUrl.searchParams.get("switch") === "true";
    if (isAuthenticated && !isSwitch) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/login",
  ],
};
