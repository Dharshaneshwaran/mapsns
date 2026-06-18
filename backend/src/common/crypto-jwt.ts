import crypto from "node:crypto";

import type { AuthTokenPayload } from "./types";

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64");
}

function sign(data: string, secret: string): string {
  return base64UrlEncode(
    crypto.createHmac("sha256", secret).update(data).digest(),
  );
}

export function createToken(
  payload: AuthTokenPayload,
  secret: string,
  expiresInSeconds = 60 * 60 * 24,
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken<T extends AuthTokenPayload>(
  token: string,
  secret: string,
): T {
  const [headerPart, payloadPart, signaturePart] = token.split(".");
  if (!headerPart || !payloadPart || !signaturePart) {
    throw new Error("Malformed token");
  }

  const expectedSignature = sign(`${headerPart}.${payloadPart}`, secret);
  if (
    signaturePart.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signaturePart),
      Buffer.from(expectedSignature),
    )
  ) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(base64UrlDecode(payloadPart).toString("utf8")) as T & {
    exp?: number;
  };

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 120_000, 64, "sha512").toString("hex");
}

export function comparePassword(
  password: string,
  salt: string,
  expectedHash: string,
): boolean {
  const actual = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expectedHash));
}

