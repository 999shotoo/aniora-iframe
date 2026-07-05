import VideoPlayer from "@/components/allanime/videoplayer";
import { decodeProviderId, getFilemoonLinks, getProviderLinks, mapByAniListId, parseSourceLines, requestAllanimeEpisodeSources } from "@/lib/allanime";

function sourceNameKey(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default async function Page({
    params, searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ ep: string, mode: string, thumbnail?: string }>
}) {
    const { id } = await params
    const { ep, mode, thumbnail } = await searchParams
    const getallanimeId = await mapByAniListId(id, mode)
    const allanimeId = getallanimeId?.data?.allanimeId

   

    const apiData = await requestAllanimeEpisodeSources(allanimeId, mode, ep);
    console.log('[SOURCE] Raw API response keys:', Object.keys(apiData || {}));

    // Check for API-level errors (e.g. NEED_CAPTCHA)
    if (apiData?.errors?.length > 0) {
      const msg = apiData.errors.map((e: { message: any }) => e.message).join(', ');
      console.log('[SOURCE] API errors:', msg);
      console.error('[SOURCE] API errors:', msg);
    }

    // Parse source lines using the robust multi-blob parser
    const respLines = parseSourceLines(apiData);
    console.log('[SOURCE] Parsed source lines:', respLines.length, respLines.map((r) => r.sourceName));

    // Also expose raw provider list for consumers that want to pick themselves
    const providers = respLines.map((r) => ({
      name: r.sourceName,
      resolvedPath: r.directUrl || (r.hex ? decodeProviderId(r.hex) : null),
      filemoon: r.sourceName?.toLowerCase().includes('filemoon'),
    }));


    // Fetch all providers in parallel
    const allLinks = [];
    const allSubtitles = [];

    const providerResults = await Promise.all(
      providers.map(async (prov) => {
        const entry = respLines.find((r) => sourceNameKey(r.sourceName) === sourceNameKey(prov.name));
        if (!entry) return { links: [], subtitles: [] };

        const resolvedPath = entry.directUrl || (entry.hex ? decodeProviderId(entry.hex) : null);
        if (!resolvedPath) return { links: [], subtitles: [] };

        console.log(`[SOURCE] Fetching provider "${prov.name}" -> ${resolvedPath.substring(0, 80)}`);

        const links = prov.filemoon
          ? await getFilemoonLinks(resolvedPath)
          : await getProviderLinks(resolvedPath, prov.name);

        // links may be a plain array or an array with an attached _subtitles property.
        // Use a safe any-cast to access _subtitles without TypeScript error.
        return { links, subtitles: ((links as any)?._subtitles) || [] };
      })
    );

    for (const r of providerResults) {
      allLinks.push(...r.links);
      allSubtitles.push(...r.subtitles);
    }

    // Sort: non-referer first, then by resolution descending
    allLinks.sort((a, b) => {
      const aF = a.needsReferer ? 1 : 0;
      const bF = b.needsReferer ? 1 : 0;
      if (aF !== bF) return aF - bF;
      return (parseInt(b.resolution) || 0) - (parseInt(a.resolution) || 0);
    });

    // Dedup
    const seen = new Set();
    const sources = allLinks.filter((item) => {
      const key = `${item.provider}|${item.resolution}|${item.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const episodeString = apiData?.data?.episode?.episodeString || String(ep);

    console.log({
      success: true,
      data: {
        allanimeId: allanimeId,
        mode,
        episode: episodeString,
        providers,
        sources,
        subtitles: allSubtitles,
      },
    });

    return (
        <>
            <VideoPlayer videoSources={sources} poster={thumbnail} />
        </>
    );
}