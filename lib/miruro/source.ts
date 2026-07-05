import { pipeRequest } from "./core";
import { makeProxyUrl } from "./proxy";

export async function getSources(episodeId: string, provider: string, anilistId: number, category: string) {
  const decoded = await pipeRequest({
    path: "sources",
    method: "GET",
    query: { episodeId, provider, category, anilistId },
    body: null,
  });

  const defaultReferer = typeof decoded.referer === "string" ? decoded.referer : null;

  if (Array.isArray(decoded.streams)) {
    decoded.streams = decoded.streams.map((s: any) => ({
      ...s,
      proxyUrl: makeProxyUrl(s.url, typeof s.referer === "string" ? s.referer : defaultReferer, {
        rotate: s.rotate === true,
        type: "m3u8",
      }),
    }));
  }

  if (Array.isArray(decoded.subtitles)) {
    decoded.subtitles = decoded.subtitles.map((s: any) => ({
      ...s,
      proxyUrl: makeProxyUrl(s.file, defaultReferer, { type: "vtt" }),
    }));
  }

  if (typeof decoded.download === "string") {
    decoded.downloadProxy = makeProxyUrl(decoded.download, defaultReferer, { type: "m3u8" });
  }

  return decoded;
}