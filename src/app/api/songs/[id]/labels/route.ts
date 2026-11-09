import { setSongLabelsSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse, unauthorized } from "@/presentation/http";

interface SongLabelParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: Request,
  { params }: SongLabelParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { id } = await params;
    const container = await getContainer(await getRequestEnv());
    const { labelIds } = await container.getSongLabels.execute({ songId: id });
    return Response.json({ labelIds });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(
  req: Request,
  { params }: SongLabelParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = setSongLabelsSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos de etiqueta inválidos" },
        { status: 400 },
      );
    }
    const container = await getContainer(await getRequestEnv());
    await container.setSongLabels.execute({
      actor: session,
      songId: id,
      labelIds: parsed.data.labelIds,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
