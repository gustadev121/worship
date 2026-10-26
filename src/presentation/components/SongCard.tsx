import Link from "next/link";

export interface SongCardSong {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  practiceKey: string | null;
  bpm?: number | null;
}

export function SongCard({ song }: { song: SongCardSong }) {
  return (
    <article>
      <h3>
        <Link href={`/songs/${song.id}`}>{song.title}</Link>
      </h3>
      <p>
        {song.artist} · {song.originalKey}
        {song.practiceKey ? ` → ${song.practiceKey}` : ""}
        {song.bpm ? ` · ${song.bpm} bpm` : ""}
      </p>
    </article>
  );
}
