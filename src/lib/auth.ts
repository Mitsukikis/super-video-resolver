import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const cookieName = "svr_session";

function secret() {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

export function signSession(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function makeSessionToken() {
  const value = `logged-in:${Date.now()}`;
  return `${value}.${signSession(value)}`;
}

export async function isLoggedIn() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator < 1) return false;

  const value = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = signSession(value);
  if (signature.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

