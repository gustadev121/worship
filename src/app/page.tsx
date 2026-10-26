import { redirect } from "next/navigation";
import type { SongFilter } from "@/core/application/ports";
import { getContainer } from "@/infrastructure/container";
import { getSession } from "@/presentation/auth";
import { SongCard } from "@/presentation/components/SongCard";
import { SongFilters } from "@/presentation/components/SongFilters";
import { getRequestEnv } from "@/presentation/get-request-env";

const KNOWN_ROLES = [
  "FIRST_VOICE",
  "SECOND_VOICE",
  "THIRD_VOICE",
  "BACKING_VOCAL",
  "INSTRUMENT",
] as const;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const sp = await searchParams;
  const container = await getContainer(await getRequestEnv());

  const filter: SongFilter = {};
  if (sp.q) {
    filter.query = sp.q;
  }
  const labelParam = sp.labels;
  const labelIds =
    labelParam === undefined
      ? []
      : labelParam
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
  if (labelIds.length > 0) {
    filter.labelIds = labelIds;
  }
  if (sp.practiceKey) {
    filter.practiceKey = sp.practiceKey;
  }
  if (sp.mine === "1") {
    filter.memberId = session.sub;
  }
  const roleType = sp.roleType;
  if (
    roleType !== undefined &&
    (KNOWN_ROLES as readonly string[]).includes(roleType)
  ) {
    filter.roleType = roleType as SongFilter["roleType"];
  }

  const [{ songs }, { labels }] = await Promise.all([
    container.listSongs.execute({ filter }),
    container.listLabels.execute(),
  ]);

  return (
    <section>
      <h1>Song catalog</h1>
      <SongFilters labels={labels} />
      {songs.map((song) => (
        <div key={song.id}>
          <SongCard song={song} />
        </div>
      ))}
      {songs.length === 0 ? <p>No songs found.</p> : null}
    </section>
  );
}
