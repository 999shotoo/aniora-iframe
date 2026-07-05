import { decodeProviderId, getFilemoonLinks, getProviderLinks, parseSourceLines, requestAllanimeEpisodeSources } from "@/lib/allanime";


export default async function Page({
    params, searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: { ep: string, mode: string }
}) {
    const { id } = await params
    const { ep, mode } = await searchParams

    const apiData = await requestAllanimeEpisodeSources(id, mode, ep);
    const respLines = parseSourceLines(apiData);
    const providerDefs = [
        { name: 'Default', filemoon: false },
        { name: 'Mp4', filemoon: false },
        { name: 'Yt-mp4', filemoon: false },
        // { name: 'S-mp4',    filemoon: false },
        // { name: 'Fm-mp4',   filemoon: true  },
        // { name: 'Luf-Mp4',  filemoon: false },
    ];

    // Fetch all providers in parallel
    const allLinks = [];
    const allSubtitles = [];

    const providerResults = await Promise.all(
        providerDefs.map(async (prov) => {
            const entry = respLines.find((r) => r.sourceName === prov.name);
            if (!entry) return { links: [], subtitles: [] };

            const resolvedPath = entry.directUrl || (entry.hex ? decodeProviderId(entry.hex) : null);
            if (!resolvedPath) return { links: [], subtitles: [] };

            console.log(`[SOURCE] Fetching provider "${prov.name}" -> ${resolvedPath.substring(0, 80)}`);

            const links = prov.filemoon
                ? await getFilemoonLinks(resolvedPath)
                : await getProviderLinks(resolvedPath, prov.name);

            const subtitles = (links as any)?._subtitles ?? [];
            return { links, subtitles };
        })
    );

    for (const r of providerResults) {
        allLinks.push(...r.links);
        allSubtitles.push(...r.subtitles);
    }

    // Sort: non-referer first, then by resolution descending
    allLinks.sort((a, b) => {
        const aF = (a as { needsReferer?: boolean }).needsReferer ? 1 : 0;
        const bF = (b as { needsReferer?: boolean }).needsReferer ? 1 : 0;
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

    // Also expose raw provider list for consumers that want to pick themselves
    const providers = respLines.map((r) => ({
        name: r.sourceName,
        resolvedPath: r.directUrl || (r.hex ? decodeProviderId(r.hex) : null),
    }));

    const episodeString = apiData?.data?.episode?.episodeString || ep;

    console.log(sources)

    return (
        <>
            <h1>hey {id}</h1>
            <p>Episode: {ep}</p>
            <p>Mode: {mode}</p>
        </>
    );
}