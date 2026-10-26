import { describe, expect, test } from "bun:test";
import { SignJWT } from "jose";
import { UnauthorizedError } from "@/core/domain/errors";
import { JoseJwtTokenService } from "@/infrastructure/auth/JoseJwtTokenService";
import { WebCryptoPasswordHasher } from "@/infrastructure/auth/WebCryptoPasswordHasher";
import { MockYouTubeAdapter } from "@/infrastructure/youtube/MockYouTubeAdapter";

describe("auth", () => {
  test("PBKDF2 hash→verify round-trip", async () => {
    const hasher = new WebCryptoPasswordHasher();
    const { hash } = await hasher.hash("ChangeMe123!");
    expect(hash.startsWith("pbkdf2-sha256$100000$")).toBe(true);
    expect(await hasher.verify("ChangeMe123!", hash)).toBe(true);
  });

  test("wrong password returns false", async () => {
    const hasher = new WebCryptoPasswordHasher();
    const { hash } = await hasher.hash("ChangeMe123!");
    expect(await hasher.verify("WrongPassword1", hash)).toBe(false);
  });

  test("different hashes differ (random salt)", async () => {
    const hasher = new WebCryptoPasswordHasher();
    const a = await hasher.hash("same-password-1");
    const b = await hasher.hash("same-password-1");
    expect(a.hash).not.toBe(b.hash);
    expect(await hasher.verify("same-password-1", a.hash)).toBe(true);
    expect(await hasher.verify("same-password-1", b.hash)).toBe(true);
  });

  test("JWT sign→verify round-trip", async () => {
    const tokens = new JoseJwtTokenService("test-secret-1234567890");
    const token = await tokens.sign({
      sub: "u1",
      username: "admin",
      role: "ADMIN",
    });
    expect(await tokens.verify(token)).toEqual({
      sub: "u1",
      username: "admin",
      role: "ADMIN",
    });
  });

  test("tampered JWT rejected", async () => {
    const tokens = new JoseJwtTokenService("test-secret-1234567890");
    const token = await tokens.sign({
      sub: "u1",
      username: "admin",
      role: "ADMIN",
    });
    const tampered = `${token.slice(0, -2)}ab`;
    await expect(tokens.verify(tampered)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  test("wrong-secret JWT rejected", async () => {
    const signer = new JoseJwtTokenService("correct-secret-xyz");
    const verifier = new JoseJwtTokenService("wrong-secret-abc");
    const token = await signer.sign({
      sub: "u1",
      username: "admin",
      role: "ADMIN",
    });
    await expect(verifier.verify(token)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  test("expired JWT rejected", async () => {
    const tokens = new JoseJwtTokenService("test-secret-1234567890");
    const expired = await new SignJWT({ username: "admin", role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setIssuedAt()
      .setExpirationTime("1s")
      .sign(new TextEncoder().encode("test-secret-1234567890"));
    // Real clock wait: jose verifies exp against wall time; no injectable clock.
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 1500);
    await promise;
    await expect(tokens.verify(expired)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  test("mock youtube determinism, no network", async () => {
    const adapter = new MockYouTubeAdapter();
    const first = await adapter.search("amazing grace");
    const second = await adapter.search("amazing grace");
    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    const other = await adapter.search("holy holy");
    expect(other).not.toEqual(first);
    for (const result of first) {
      expect(result.videoId).toMatch(/^[A-Za-z0-9_-]{11}$/);
    }
  });
});
