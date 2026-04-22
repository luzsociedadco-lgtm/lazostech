import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

import type { AuthSessionPayload } from "@/app/lib/types";

const SESSION_COOKIE = "nudos_session";
const SESSION_SECRET =
  process.env.NUDOS_SESSION_SECRET || "nudos-dev-session-secret-change-me";

function toBase64Url(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64");
}

function signPayload(value: string) {
  return toBase64Url(createHmac("sha256", SESSION_SECRET).update(value).digest());
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, hashedPassword: string) {
  const [salt, existingHash] = hashedPassword.split(":");
  if (!salt || !existingHash) return false;

  const candidate = scryptSync(password, salt, 64);
  const existing = Buffer.from(existingHash, "hex");
  if (candidate.length !== existing.length) return false;

  return timingSafeEqual(candidate, existing);
}

export async function createSession(payload: AuthSessionPayload) {
  const serialized = JSON.stringify(payload);
  const encodedPayload = toBase64Url(serialized);
  const signature = signPayload(encodedPayload);
  const token = `${encodedPayload}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
  });
}

export async function readSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [payloadSegment, signatureSegment] = raw.split(".");
  if (!payloadSegment || !signatureSegment) return null;
  if (signPayload(payloadSegment) !== signatureSegment) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(payloadSegment).toString("utf8")) as AuthSessionPayload;
    return parsed;
  } catch {
    return null;
  }
}
