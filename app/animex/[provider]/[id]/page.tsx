
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider, Track } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { parseUrl } from 'next/dist/shared/lib/router/utils/parse-url';


export default async function AnimePage({ params, searchParams }: { params: { provider: string; id: string }; searchParams: { ep?: string; mode?: 'sub' | 'dub' } }) {
    const { provider, id } = await params;
    const { ep, mode } = await searchParams;

    const fetchsource = await fetch(`https://pp.animex.one/rest/api/sources?id=${id}&epNum=${ep}&type=${mode}&providerId=${provider}`);
    const response = await fetchsource.json();

    console.log('[ANIMEX] Fetching sources from:', response);
    return (
        <>
            <MediaPlayer title="" src={`https://v0-kwik-cx-referer.onrender.com/api/proxy?url=${response.sources[0]?.url}&ref=${response.headers?.Referer}&origin=${response.headers?.Referer}`} autoplay muted loop>
                <MediaProvider>
                    {response.tracks?.map((track: {
                        id: string;
                        url: string | undefined; src: string; kind: string; label: string; lang: string
                    }) => (
                        <Track
                            key={track.id}
                            src={track.url}
                            kind={track.kind as TextTrackKind}
                            label={track.label}
                            lang={track.lang}
                        />
                    ))}
                </MediaProvider>
                <DefaultVideoLayout  icons={defaultLayoutIcons} />

            </MediaPlayer>
        </>
    );
}