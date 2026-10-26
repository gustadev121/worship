import { jwtVerify, SignJWT } from "jose";
import type {
  ITokenServicePort,
  SessionPayload,
} from "@/core/application/ports";
import { UnauthorizedError } from "@/core/domain/errors";

export class JoseJwtTokenService implements ITokenServicePort {
  constructor(private readonly secret: string) {}

  private get key(): Uint8Array {
    return new TextEncoder().encode(this.secret);
  }

  async sign(payload: SessionPayload): Promise<string> {
    return new SignJWT({ username: payload.username, role: payload.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(payload.sub)
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(this.key);
  }

  async verify(token: string): Promise<SessionPayload> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: ["HS256"],
      });
      const sub = typeof payload.sub === "string" ? payload.sub : undefined;
      const username = payload.username;
      const role = payload.role;
      if (
        !sub ||
        typeof username !== "string" ||
        (role !== "ADMIN" && role !== "MEMBER")
      ) {
        throw new UnauthorizedError("Invalid session");
      }
      return { sub, username, role };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError("Invalid or expired session");
    }
  }
}
