import { updateUserSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse, unauthorized } from "@/presentation/http";

interface UserParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  req: Request,
  { params }: UserParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos de usuario inválidos" },
        { status: 400 },
      );
    }
    const container = await getContainer(await getRequestEnv());
    const { user } = await container.updateUser.execute({
      actor: session,
      id,
      ...parsed.data,
    });
    return Response.json({ user });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: UserParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { id } = await params;
    const container = await getContainer(await getRequestEnv());
    await container.deleteUser.execute({ actor: session, id });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
