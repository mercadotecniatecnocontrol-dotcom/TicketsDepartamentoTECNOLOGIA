import type { Departamento } from "@/lib/departamentos";

export interface SessionUser {
  id: string;
  departamento: Departamento;
  nombre: string;
  email: string;
  role: "admin" | "departamento";
}

export interface SessionTokenPayload {
  user: SessionUser;
  exp: number; // Expiración en segundos Unix
  iat: number; // Emitido en segundos Unix
}

const DEFAULT_SECRET = "tecnocontrol_tickets_auth_secret_2025_secure_key";

function getSecret(): string {
  return process.env.SESSION_SECRET || DEFAULT_SECRET;
}

// Codificación Base64URL segura y universal (Node.js, Edge Runtime y Browser)
export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function fromBase64Url(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    stringToBytes(secret) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Crea un token firmado HMAC-SHA256
 */
export async function createSessionToken(
  user: SessionUser,
  expiresInSeconds: number = 60 * 60 * 24 * 7 // 7 días por defecto
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionTokenPayload = {
    user,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = toBase64Url(stringToBytes(JSON.stringify(header)));
  const encodedPayload = toBase64Url(stringToBytes(JSON.stringify(payload)));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(getSecret());
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    stringToBytes(dataToSign) as unknown as BufferSource
  );
  const encodedSignature = toBase64Url(new Uint8Array(signatureBuffer));

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verifica un token y regresa el payload si es válido y no ha expirado
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionTokenPayload | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await getCryptoKey(getSecret());
    const sigBytes = fromBase64Url(encodedSignature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      stringToBytes(dataToSign) as unknown as BufferSource
    );

    if (!isValid) return null;

    const payloadJson = bytesToString(fromBase64Url(encodedPayload));
    const payload: SessionTokenPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Token expirado
    }

    return payload;
  } catch {
    return null;
  }
}
