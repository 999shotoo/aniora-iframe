import { NextRequest, NextResponse } from "next/server";
import { getAnimeSlug } from "@/lib/animex/getId";

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
    const id = req.nextUrl.searchParams.get("id");
    const ep_id = req.nextUrl.searchParams.get("ep_id");

    if (!id || !ep_id) {
        return corsJson(
            { error: "Missing id" },
            400
        );
    }

    try {
        const animeId = await getAnimeSlug(id);

        const fetchservers = await fetch(`https://pp.animex.one/rest/api/servers?id=${animeId}&epNum=${ep_id}`)

        const serversData = await fetchservers.json();

        return corsJson({
            id: animeId,
            servers: serversData
        });
    } catch (e) {
        return corsJson(
            {
                error: e instanceof Error ? e.message : "Unknown error",
            },
            500
        );
    }
}