import type {
  IYouTubeProviderPort,
  YouTubeResult,
} from "@/core/application/ports";

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function hashQuery(query: string): number {
  let hash = 2166136261;
  for (let i = 0; i < query.length; i += 1) {
    hash ^= query.charCodeAt(i) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function videoId(rand: () => number): string {
  let id = "";
  for (let i = 0; i < 11; i += 1) {
    id += ALPHABET[Math.floor(rand() * ALPHABET.length)] ?? "A";
  }
  return id;
}

export class MockYouTubeAdapter implements IYouTubeProviderPort {
  async search(query: string, maxResults = 10): Promise<YouTubeResult[]> {
    const count = Math.min(Math.max(maxResults, 1), 3);
    const rand = mulberry(hashQuery(query.trim().toLowerCase()));
    const results: YouTubeResult[] = [];
    for (let i = 0; i < count; i += 1) {
      const id = videoId(rand);
      results.push({
        videoId: id,
        title: `${query.trim()} — mock result ${i + 1}`,
        channelTitle: `Mock Channel ${i + 1}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      });
    }
    return results;
  }
}
