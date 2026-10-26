import Link from "next/link";
import { redirect } from "next/navigation";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { LabelBadge } from "@/presentation/components/LabelBadge";
import { RoleMatrix } from "@/presentation/components/RoleMatrix";
import { getRequestEnv } from "@/presentation/get-request-env";

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const { id } = await params;
  const container = await getContainer(await getRequestEnv());
  const { song } = await container.getSong
    .execute({ id })
    .catch(() => redirect("/"));
  const [{ assignments }, { labelIds }, { labels }, { users }] =
    await Promise.all([
      container.listSongRoles.execute({ songId: id }),
      container.getSongLabels.execute({ songId: id }),
      container.listLabels.execute(),
      container.listUsers
        .execute({ actor: session })
        .catch(() => ({ users: [] })),
    ]);
  const songLabels = labels.filter((l) => labelIds.includes(l.id));

  return (
    <section>
      <h1>
        {song.title} — {song.artist}
      </h1>
      <p>
        Key {song.originalKey}
        {song.practiceKey ? ` → ${song.practiceKey}` : ""}
        {song.bpm ? ` · ${song.bpm} bpm` : ""}
        {song.timeSignature ? ` · ${song.timeSignature}` : ""}
      </p>
      <div>
        {songLabels.map((l) => (
          <LabelBadge key={l.id} name={l.name} colorHex={l.colorHex} />
        ))}
      </div>
      {session.role === "ADMIN" ? (
        <p>
          <Link href={`/songs/${song.id}/edit`}>Edit</Link> ·{" "}
          <Link href={`/songs/${song.id}/practice`}>Practice</Link>
        </p>
      ) : (
        <p>
          <Link href={`/songs/${song.id}/practice`}>Practice</Link>
        </p>
      )}
      <RoleMatrix
        songId={song.id}
        roles={assignments}
        members={users}
        isAdmin={session.role === "ADMIN"}
      />
    </section>
  );
}
