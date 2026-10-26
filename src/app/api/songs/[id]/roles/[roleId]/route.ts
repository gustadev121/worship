import { z } from "zod";
import { updateRoleAssignmentSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse, persist, unauthorized } from "@/presentation/http";

interface RoleItemParams {
  params: Promise<{ id: string; roleId: string }>;
}

const instrumentNameSchema = z.object({
  instrumentName: z.string().min(2).max(50).nullable(),
});

export async function PATCH(
  req: Request,
  { params }: RoleItemParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { roleId } = await params;
    const body: unknown = await req.json();
    const container = await getContainer(await getRequestEnv());
    if (typeof body === "object" && body !== null && "instrumentName" in body) {
      const parsed = instrumentNameSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "Invalid instrument name" },
          { status: 400 },
        );
      }
      const { assignment } = await container.updateInstrumentName.execute({
        actor: session,
        id: roleId,
        instrumentName: parsed.data.instrumentName,
      });
      persist(container);
      return Response.json({ assignment });
    }
    const parsed = updateRoleAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid role input" }, { status: 400 });
    }
    const { assignment } = await container.updateRoleAssignment.execute({
      actor: session,
      id: roleId,
      ...parsed.data,
    });
    persist(container);
    return Response.json({ assignment });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: RoleItemParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { roleId } = await params;
    const container = await getContainer(await getRequestEnv());
    await container.deleteRoleAssignment.execute({
      actor: session,
      id: roleId,
    });
    persist(container);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
