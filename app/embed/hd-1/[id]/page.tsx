import { requestAllanimeEpisodeSources } from "@/lib/allanime";


export default async function Page({
    params, searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: { ep: string, mode: string }
}) {
    const { id } = await params
    const { ep, mode } = await searchParams

    const apiData = await requestAllanimeEpisodeSources(id, mode, ep);
    console.log("API Data:", apiData);
    return (
        <>
            <h1>hey {id}</h1>
            <p>Episode: {ep}</p>
            <p>Mode: {mode}</p>
        </>
    );
}