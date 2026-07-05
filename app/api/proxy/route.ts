import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

function buildHeaders(req: NextRequest, referer: string | null) {
  const headers = new Headers();
  const accept = req.headers.get("accept");
  const range = req.headers.get("range");

  if (accept) headers.set("accept", accept);
  if (range) headers.set("range", range);
  if (referer) headers.set("referer", referer);

  return headers;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");
  const referer = searchParams.get("referer");
  const rotate = searchParams.get("rotate") === "1";

  if (!targetUrl) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      headers: buildHeaders(req, referer),
      cache: rotate ? "no-store" : "default",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch proxied resource", detail: (err as Error).message },
      { status: 502 }
    );
  }

  const headers = new Headers(response.headers);
  headers.set("cache-control", rotate ? "no-store" : headers.get("cache-control") ?? "no-store");
  headers.set("access-control-allow-origin", "*");

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
}
