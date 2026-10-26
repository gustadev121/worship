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
    const q = (url.searchParams.get("q") ?? "").trim();
    if (q.length === 0) {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }
    const container = await getContainer(await getRequestEnv());
    const { results } = await container.searchYouTube.execute({ query: q });
    return Response.json({ results });
  } catch (err) {
    return errorResponse(err);
  }
}
