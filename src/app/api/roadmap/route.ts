import { roadmapFilterSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse, unauthorized } from "@/presentation/http";

export async function GET(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const url = new URL(req.url);
    const rawTrack = url.searchParams.get("track");
    const rawPriority = url.searchParams.get("priority");
    const rawPhase = url.searchParams.get("phase");

    const queryInput: Record<string, unknown> = {};
    if (rawTrack !== null) queryInput.track = rawTrack;
    if (rawPriority !== null) queryInput.priority = rawPriority;
    if (rawPhase !== null) queryInput.phase = rawPhase;

    const parsed = roadmapFilterSchema.safeParse(queryInput);
    if (!parsed.success) {
      return Response.json(
        { error: "Parámetros de consulta de roadmap inválidos" },
        { status: 400 },
      );
    }

    const container = await getContainer(await getRequestEnv());
    const roadmap = await container.getRoadmap.execute({
      actor: session,
      query: parsed.data,
    });

    return Response.json(roadmap, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
