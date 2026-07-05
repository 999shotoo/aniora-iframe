import { NextRequest, NextResponse } from "next/server";
import { fetchRawEpisodes } from "@/lib/miruro/episodes";

export const runtime = "edge";

interface ServerEntry {
  provider: string;
  category: "sub" | "dub";
  episodeId: string;
  number: number;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");
  const epParam = searchParams.get("ep_id") ?? searchParams.get("ep");

  if (!idParam || !epParam) {
    return NextResponse.json({ error: "id and ep_id are required" }, { status: 400 });
  }

  const anilistId = Number(idParam);
  const episodeNumber = Number(epParam);
  if (Number.isNaN(anilistId) || Number.isNaN(episodeNumber)) {
    return NextResponse.json({ error: "id and ep_id must be numbers" }, { status: 400 });
  }

  let data: Record<string, unknown>;
  try {
    data = await fetchRawEpisodes(anilistId);
  } catch (err) {
    const message = (err as Error).message;
    console.error(`[/api/servers] scrape failed for anilistId=${anilistId}:`, message);
    return NextResponse.json(
      { error: "Failed to scrape episodes from Miruro", detail: message },
      { status: 502 }
    );
  }

  const providers = (data.providers ?? {}) as Record<string, unknown>;
  const sub: ServerEntry[] = [];
  const dub: ServerEntry[] = [];

  for (const [providerName, providerData] of Object.entries<any>(providers)) {
    let episodes = providerData?.episodes;
    if (Array.isArray(episodes)) episodes = { sub: episodes };
    if (!episodes || typeof episodes !== "object") continue;

    for (const [category, list] of Object.entries<any>(episodes)) {
      if (!Array.isArray(list)) continue;
      const match = list.find((e: any) => Number(e?.number) === episodeNumber);
      if (!match || typeof match.id !== "string") continue;

      const entry: ServerEntry = {
        provider: providerName,
        category: category === "dub" ? "dub" : "sub",
        episodeId: match.id,
        number: match.number,
      };
      (entry.category === "dub" ? dub : sub).push(entry);
    }
  }

  if (sub.length === 0 && dub.length === 0) {
    return NextResponse.json(
      { error: `Episode ${episodeNumber} not found for anilistId ${anilistId}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    anilistId,
    episode: episodeNumber,
    sub,
    ...(dub.length > 0 ? { dub } : {}),
  });
}