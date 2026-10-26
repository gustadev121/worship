import { redirect } from "next/navigation";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { LabelAdmin } from "./client";

export default async function AdminLabelsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  const container = await getContainer(await getRequestEnv());
  const { labels } = await container.listLabels.execute();
  return (
    <section>
      <h1>Labels</h1>
      <LabelAdmin initial={labels} />
    </section>
  );
}
