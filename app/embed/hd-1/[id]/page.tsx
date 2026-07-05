import { decodeProviderId, getProviderLinks, parseSourceLines, requestAllanimeEpisodeSources } from "@/lib/allanime";


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
    const providerNames = ['Default', 'Mp4', 'Yt-mp4'];
    let links: string | any[] = [];
    for (const name of providerNames) {
        const entry = respLines.find((r) => r.sourceName === name);
        if (!entry) continue;
        const resolvedPath = entry.directUrl || (entry.hex ? decodeProviderId(entry.hex) : null);
        if (!resolvedPath) continue;

        links = await getProviderLinks(resolvedPath, name);
        if (links.length > 0) break;
    }

    // Best link: prefer no-referer, then highest resolution
    const best = [...links].sort((a, b) => {
        const aF = a.needsReferer ? 1 : 0;
        const bF = b.needsReferer ? 1 : 0;
        if (aF !== bF) return aF - bF;
        return (parseInt(b.resolution) || 0) - (parseInt(a.resolution) || 0);
    })[0];

    console.log(best.url)
    return (
        <>
            <h1>hey {id}</h1>
            <p>Episode: {ep}</p>
            <p>Mode: {mode}</p>
        </>
    );
}