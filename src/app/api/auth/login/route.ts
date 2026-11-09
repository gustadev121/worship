import { loginSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { buildSessionCookie } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse } from "@/presentation/http";

export async function POST(req: Request): Promise<Response> {
  try {
    const body: unknown = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos de acceso inválidos" },
        { status: 400 },
      );
    }
    const container = await getContainer(await getRequestEnv());
    const { user } = await container.loginUser.execute(parsed.data);
    const token = await container.tokens.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
    return Response.json(
      { user },
      { headers: { "Set-Cookie": buildSessionCookie(token) } },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
