import { mapByAniListId, mapByMalId, normalizeMode } from "@/lib/allanime";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const ep_id = req.nextUrl.searchParams.get('ep_id');
    const type = req.nextUrl.searchParams.get('type');
    const mode = normalizeMode(req.nextUrl.searchParams.get('mode') || 'sub');

    try {
      const servers = {
        sub: [
        {
          "server": "hd-1",
          "url": `${process.env.SERVER_URL}/embed/allanime/${id}?ep=${ep_id}&mode=sub`,
          "default": true
        },
        {
          "server": "megaplay",
          "url": `https://megaplay.buzz/stream/ani/${id}/${ep_id}/sub`,
        },
      ],
      dub: [
        {
          "server": "hd-1",
          "url": `${process.env.SERVER_URL}/embed/allanime/${id}?ep=${ep_id}&mode=dub`,
          "default": true
        },
        {
          "server": "megaplay",
          "url": `https://megaplay.buzz/stream/ani/${id}/${ep_id}/dub`,
        },
      ]
      };
      return NextResponse.json({ success: true, servers });
    } catch {
      return NextResponse.json({ success: true, ...(await mapByMalId(id, mode)) });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error || 'Failed to map input ID to AllAnime ID' }, { status: 500 });
  }
}