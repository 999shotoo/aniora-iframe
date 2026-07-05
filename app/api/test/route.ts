import { NextRequest, NextResponse } from "next/server";
import { getAnimeSlug } from "@/lib/animex/getId";

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get("id");
    const ep_id = req.nextUrl.searchParams.get("ep_id");

    if (!id || !ep_id) {
        return NextResponse.json(
            { error: "Missing id" },
            { status: 400 }
        );
    }

    try {
        const animeId = await getAnimeSlug(id);

        const fetchservers = await fetch(`https://pp.animex.one/rest/api/servers?id=${animeId}&epNum=${ep_id}`)

        const serversData = await fetchservers.json();

        return NextResponse.json({
            id: animeId,
            servers: serversData
        });
    } catch (e) {
        return NextResponse.json(
            {
                error: e instanceof Error ? e.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}