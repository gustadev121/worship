import type {
  IYouTubeProviderPort,
  YouTubeResult,
} from "@/core/application/ports";

interface SearchListResponse {
  items?: {
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: { medium?: { url?: string } };
    };
  }[];
}

export class YouTubeApiAdapter implements IYouTubeProviderPort {
  constructor(private readonly apiKey: string) {}

  async search(query: string, maxResults = 10): Promise<YouTubeResult[]> {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      q: query,
      maxResults: String(Math.min(Math.max(maxResults, 1), 25)),
      key: this.apiKey,
    });
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
    );
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    const data = (await response.json()) as SearchListResponse;
    return (data.items ?? [])
      .filter((item) => typeof item.id?.videoId === "string")
      .map((item) => ({
        videoId: item.id?.videoId as string,
        title: item.snippet?.title ?? "Untitled",
        channelTitle: item.snippet?.channelTitle ?? "Unknown",
        thumbnailUrl:
          item.snippet?.thumbnails?.medium?.url ??
          `https://i.ytimg.com/vi/${item.id?.videoId}/mqdefault.jpg`,
      }));
  }
}
