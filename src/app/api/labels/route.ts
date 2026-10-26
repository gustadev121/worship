import { createLabelSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse, persist, unauthorized } from "@/presentation/http";

export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const container = await getContainer(await getRequestEnv());
    const { labels } = await container.listLabels.execute();
    return Response.json({ labels });
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
    const parsed = createLabelSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid label input" }, { status: 400 });
    }
    const container = await getContainer(await getRequestEnv());
    const { label } = await container.createLabel.execute({
      actor: session,
      ...parsed.data,
    });
    persist(container);
    return Response.json({ label }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
