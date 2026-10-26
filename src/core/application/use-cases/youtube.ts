import { ValidationError } from "../../domain/errors";
import type { IYouTubeProviderPort, YouTubeResult } from "../ports";

export class SearchYouTube {
  constructor(private readonly provider: IYouTubeProviderPort) {}

  async execute(input: {
    query: string;
    maxResults?: number;
  }): Promise<{ results: YouTubeResult[] }> {
    if (typeof input.query !== "string" || input.query.trim().length === 0) {
      throw new ValidationError("Search query is required");
    }
    return {
      results: await this.provider.search(input.query.trim(), input.maxResults),
    };
  }
}
