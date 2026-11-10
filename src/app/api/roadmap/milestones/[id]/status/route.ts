import { updateMilestoneStatusSchema } from "@/core/application/schemas";
import { ValidationError } from "@/core/domain/errors";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse, unauthorized } from "@/presentation/http";

interface MilestoneParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  req: Request,
  { params }: MilestoneParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = updateMilestoneStatusSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: parsed.error.issues[0]?.message ?? "Datos de estado inválidos",
        },
        { status: 400 },
      );
    }

    const container = await getContainer(await getRequestEnv());
    const result = await container.updateMilestoneStatus.execute({
      actor: session,
      milestoneId: id,
      input: parsed.data,
    });

    return Response.json(result, { status: 200 });
  } catch (err) {
    if (
      err instanceof ValidationError &&
      err.unmetPrerequisiteIds &&
      err.unmetPrerequisiteIds.length > 0
    ) {
      return Response.json(
        {
          error: {
            code: "PREREQUISITE_NOT_SATISFIED",
            message: err.message,
            unmetPrerequisites: err.unmetPrerequisiteIds,
          },
        },
        { status: 400 },
      );
    }
    return errorResponse(err);
  }
}
