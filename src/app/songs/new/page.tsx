import { redirect } from "next/navigation";
import { getSession } from "@/presentation/auth";
import { SongForm } from "./form";

export default async function NewSongPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  return (
    <section>
      <h1>New song</h1>
      <SongForm mode="create" />
    </section>
  );
}
