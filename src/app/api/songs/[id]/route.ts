import { updateSongSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse, unauthorized } from "@/presentation/http";

interface SongParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: Request,
  { params }: SongParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { id } = await params;
    const container = await getContainer(await getRequestEnv());
    const { song } = await container.getSong.execute({ id });
    return Response.json({ song });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: SongParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = updateSongSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Datos de canción inválidos" },
        { status: 400 },
      );
    }
    const container = await getContainer(await getRequestEnv());
    const { song } = await container.updateSong.execute({
      actor: session,
      id,
      patch: parsed.data,
    });
    return Response.json({ song });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: SongParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { id } = await params;
    const container = await getContainer(await getRequestEnv());
    await container.deleteSong.execute({ actor: session, id });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
