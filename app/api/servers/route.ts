import { mapByAniListId, mapByMalId, normalizeMode } from "@/lib/allanime";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const ep_id = req.nextUrl.searchParams.get('ep_id');
    const type = req.nextUrl.searchParams.get('type');
    const mode = normalizeMode(req.nextUrl.searchParams.get('mode') || 'sub');

    if (type === 'anilist') return NextResponse.json({ success: true, ...(await mapByAniListId(id, mode)) });
    if (type === 'mal') return NextResponse.json({ success: true, ...(await mapByMalId(id, mode)) });

    try {
      const fetchid = await mapByAniListId(id, mode)
      const animeall_id = fetchid?.data?.allanimeId;
      const servers = {
        sub: [
        {
          "server": "hd-1",
          "url": `${process.env.SERVER_URL}/embed/hd-1/${animeall_id}?ep=${ep_id}&mode=sub`,
          "default": true
        },
        {
          "server": "hd-2",
          "url": `${process.env.SERVER_URL}/embed/hd-2/${animeall_id}?ep=${ep_id}&mode=sub`,
        },
      ],
      dub: [
        {
          "server": "hd-1",
          "url": `${process.env.SERVER_URL}/embed/hd-1/${animeall_id}?ep=${ep_id}&mode=dub`,
          "default": true
        },
        {
          "server": "hd-2",
          "url": `${process.env.SERVER_URL}/embed/hd-2/${animeall_id}?ep=${ep_id}&mode=dub`,
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