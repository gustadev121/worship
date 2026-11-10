import { toggleVoteSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse, unauthorized } from "@/presentation/http";

interface CapabilityParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  req: Request,
  { params }: CapabilityParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = toggleVoteSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: parsed.error.issues[0]?.message ?? "Datos de voto inválidos",
        },
        { status: 400 },
      );
    }

    const container = await getContainer(await getRequestEnv());
    const result = await container.toggleCapabilityVote.execute({
      actor: session,
      capabilityId: id,
      input: parsed.data,
    });

    return Response.json(result, { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
