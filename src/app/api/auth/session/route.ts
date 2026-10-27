import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { verifySessionToken } from "@/lib/auth-token";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const payload = await verifySessionToken(token);

    if (!payload || !payload.user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: payload.user,
      exp: payload.exp,
    });
  } catch (error) {
    console.error("Error validando sesión:", error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
