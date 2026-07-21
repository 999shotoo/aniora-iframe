import { mapByAniListId, mapByMalId, normalizeMode } from "@/lib/allanime";
import { getAnimeSlug } from "@/lib/animex/getId";
import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

function corsJson(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}


export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const ep_id = req.nextUrl.searchParams.get('ep_id');
    const type = req.nextUrl.searchParams.get('type');
    const mode = normalizeMode(req.nextUrl.searchParams.get('mode') || 'sub');

    if (!id || !ep_id) {
      return corsJson({ success: false, error: 'Missing id or ep_id' }, 400);
    }

    const animeId = await getAnimeSlug(id);

    const fetchservers = await fetch(`https://pp.animex.one/rest/api/servers?id=${animeId}&epNum=${ep_id}`)

    const serversData = await fetchservers.json();
    console.log('[API] Fetched servers data:', serversData);

    const subProviders = Array.isArray(serversData?.subProviders) ? serversData.subProviders : [];
    const dubProviders = Array.isArray(serversData?.dubProviders) ? serversData.dubProviders : [];

    const servers = {
      sub: [
        {
          "server": "megaplay",
          "url": `https://megaplay.buzz/stream/ani/${id}/${ep_id}/sub`,
        },
        ...subProviders.map((provider: { id: string; url: string }) => ({
          server: provider.id,
          url: `${process.env.SERVER_URL}/animex/${provider.id}/${animeId}?ep=${ep_id}&mode=sub`,
        })),
        {
          "server": "hd-1",
          "url": `${process.env.SERVER_URL}/embed/allanime/${id}?ep=${ep_id}&mode=sub`,
          "default": true
        },
      ],
      dub: [
        {
          "server": "megaplay",
          "url": `https://megaplay.buzz/stream/ani/${id}/${ep_id}/dub`,
        },
        ...dubProviders.map((provider: { id: string; url: string }) => ({
          server: provider.id,
          url: `${process.env.SERVER_URL}/animex/${provider.id}/${animeId}?ep=${ep_id}&mode=dub`,
        })),
        {
          "server": "hd-1",
          "url": `${process.env.SERVER_URL}/embed/allanime/${id}?ep=${ep_id}&mode=dub`,
          "default": true
        },
      ]
    };
    return corsJson({ success: true, servers });
  } catch (error) {
    return corsJson({ success: false, error: error || 'Failed to map input ID to AllAnime ID' }, 500);
  }
}
