import type { IPasswordHasherPort } from "@/core/application/ports";

const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const PREFIX = "pbkdf2-sha256";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(encoded: string): Uint8Array {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i) ?? 0;
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

async function derive(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as BufferSource,
      iterations: ITERATIONS,
    },
    keyMaterial,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export class WebCryptoPasswordHasher implements IPasswordHasherPort {
  async hash(password: string): Promise<{ hash: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const key = await derive(password, salt);
    return {
      hash: `${PREFIX}$${ITERATIONS}$${toBase64(salt)}$${toBase64(key)}`,
    };
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const parts = stored.split("$");
    if (parts.length !== 4 || parts[0] !== PREFIX) {
      return false;
    }
    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations <= 0) {
      return false;
    }
    let salt: Uint8Array;
    let expected: Uint8Array;
    try {
      salt = fromBase64(parts[2] ?? "");
      expected = fromBase64(parts[3] ?? "");
    } catch {
      return false;
    }
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: salt as BufferSource,
        iterations,
      },
      keyMaterial,
      expected.length * 8,
    );
    return timingSafeEqual(new Uint8Array(bits), expected);
  }
}
