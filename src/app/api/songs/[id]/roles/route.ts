import { assignRoleSchema } from "@/core/application/schemas";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { errorResponse, persist, unauthorized } from "@/presentation/http";

interface RolesParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: Request,
  { params }: RolesParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { id } = await params;
    const container = await getContainer(await getRequestEnv());
    const { assignments } = await container.listSongRoles.execute({
      songId: id,
    });
    return Response.json({ assignments });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  req: Request,
  { params }: RolesParams,
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  try {
    const { id } = await params;
    const body: unknown = await req.json();
    const parsed = assignRoleSchema.safeParse({
      ...(body as Record<string, unknown>),
      songId: id,
    });
    if (!parsed.success) {
      return Response.json({ error: "Invalid role input" }, { status: 400 });
    }
    const container = await getContainer(await getRequestEnv());
    const { assignment } = await container.assignRole.execute({
      actor: session,
      ...parsed.data,
    });
    persist(container);
    return Response.json({ assignment }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
