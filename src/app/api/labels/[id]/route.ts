import { updateLabelSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse, persist, unauthorized } from "@/presentation/http";

interface LabelParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  req: Request,
  { params }: LabelParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = updateLabelSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid label input" }, { status: 400 });
    }
    const container = await getContainer(await getRequestEnv());
    const { label } = await container.updateLabel.execute({
      actor: session,
      id,
      ...parsed.data,
    });
    persist(container);
    return Response.json({ label });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: LabelParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { id } = await params;
    const container = await getContainer(await getRequestEnv());
    await container.deleteLabel.execute({ actor: session, id });
    persist(container);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
