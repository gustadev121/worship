import { redirect } from "next/navigation";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { UserAdmin } from "./client";

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  const container = await getContainer(await getRequestEnv());
  const { users } = await container.listUsers.execute({ actor: session });
  return (
    <section>
      <h1>Users</h1>
      <UserAdmin initial={users} />
    </section>
  );
}
