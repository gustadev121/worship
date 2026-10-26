import { redirect } from "next/navigation";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { PracticeStatusToggle } from "@/presentation/components/PracticeStatusToggle";
import { RehearsalPlayer } from "@/presentation/components/RehearsalPlayer";
import { getRequestEnv } from "@/presentation/get-request-env";

export default async function PracticePage({
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
  const { assignments } = await container.listSongRoles.execute({ songId: id });
  const mine = assignments.filter((a) => a.userId === session.sub);

  return (
    <section>
      <h1>
        Practice: {song.title} — {song.artist}
      </h1>
      <RehearsalPlayer
        youtubeVideoId={song.youtubeVideoId}
        sections={song.sectionTimestamps}
        lyricsAndChords={song.lyricsAndChords}
        practiceKey={song.practiceKey}
        viewerRole={
          mine[0]
            ? {
                roleType: mine[0].roleType,
                harmonyOrPartNotes: mine[0].harmonyOrPartNotes,
              }
            : null
        }
      />
      {mine.map((a) => (
        <PracticeStatusToggle
          key={a.id}
          songId={song.id}
          roleId={a.id}
          initial={a.practiceStatus}
        />
      ))}
      {mine.length === 0 ? <p>No assigned part for you on this song.</p> : null}
    </section>
  );
}
