import { redirect } from "next/navigation";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { getRequestEnv } from "@/presentation/get-request-env";
import { SongForm } from "../../new/form";

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  const { id } = await params;
  const container = await getContainer(await getRequestEnv());
  const { song } = await container.getSong
    .execute({ id })
    .catch(() => redirect("/"));
  return (
    <section>
      <h1>Edit {song.title}</h1>
      <SongForm
        mode="edit"
        songId={song.id}
        initial={{
          title: song.title,
          artist: song.artist,
          originalKey: song.originalKey,
          practiceKey: song.practiceKey ?? "",
          bpm:
            song.bpm === undefined || song.bpm === null ? "" : String(song.bpm),
          timeSignature: song.timeSignature ?? "",
          lyricsAndChords: song.lyricsAndChords ?? "",
          youtubeVideoId: song.youtubeVideoId ?? "",
        }}
      />
    </section>
  );
}
