
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider, Poster, Track } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { parseUrl } from 'next/dist/shared/lib/router/utils/parse-url';


export default async function AnimePage({ params, searchParams }: { params: { provider: string; id: string }; searchParams: { ep?: string; mode?: 'sub' | 'dub'; thumbnail?: string } }) {
    const { provider, id } = await params;
    const { ep, mode, thumbnail } = await searchParams;

    const fetchsource = await fetch(`https://pp.animex.one/rest/api/sources?id=${id}&epNum=${ep}&type=${mode}&providerId=${provider}`);
    const response = await fetchsource.json();

    console.log('[ANIMEX] Fetching sources from:', response);
    return (
        <>
            <MediaPlayer title="" src={`https://m3u8-proxy-h66i.onrender.com/m3u8-proxy?url=${encodeURIComponent(response.sources[0]?.url)}&ref=${response.headers?.Referer}&origin=${response.headers?.Referer}`} autoplay>
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
                    {thumbnail &&
                        <Poster
                            className="vds-poster"
                            src="https://files.vidstack.io/sprite-fight/poster.webp"
                            alt="Girl walks into campfire with gnomes surrounding her friend ready for their next meal!"
                        />
                    };
                </MediaProvider>
                <DefaultVideoLayout icons={defaultLayoutIcons} />

            </MediaPlayer>
        </>
    );
}