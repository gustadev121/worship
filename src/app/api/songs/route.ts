import type { SongFilter } from "@/core/application/ports";
import {
  createSongSchema,
  songFilterQuerySchema,
} from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse, persist, unauthorized } from "@/presentation/http";

export async function GET(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const url = new URL(req.url);
    const parsed = songFilterQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      labels: url.searchParams.get("labels") ?? undefined,
      practiceKey: url.searchParams.get("practiceKey") ?? undefined,
      memberId: url.searchParams.get("memberId") ?? undefined,
      roleType: url.searchParams.get("roleType") ?? undefined,
    });
    if (!parsed.success) {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }
    const filter: SongFilter = {};
    if (parsed.data.q !== undefined) {
      filter.query = parsed.data.q;
    }
    if (parsed.data.labels !== undefined && parsed.data.labels.length > 0) {
      filter.labelIds = parsed.data.labels
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    if (parsed.data.practiceKey !== undefined) {
      filter.practiceKey = parsed.data.practiceKey;
    }
    if (parsed.data.memberId !== undefined) {
      filter.memberId = parsed.data.memberId;
    }
    if (parsed.data.roleType !== undefined) {
      filter.roleType = parsed.data.roleType as SongFilter["roleType"];
    }
    const container = await getContainer(await getRequestEnv());
    const { songs } = await container.listSongs.execute({ filter });
    return Response.json({ songs });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const body: unknown = await req.json();
    const parsed = createSongSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid song input" }, { status: 400 });
    }
    const container = await getContainer(await getRequestEnv());
    const { song } = await container.createSong.execute({
      actor: session,
      ...parsed.data,
    });
    persist(container);
    return Response.json({ song }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
