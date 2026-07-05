'use client';

import { useRef, useEffect } from 'react';
import Artplayer from 'artplayer';

interface VideoSource {
  resolution: string;
  url: string;
}

export default function VideoPlayer( { videoSources }: { videoSources: VideoSource[] }) {
  const playerRef = useRef<HTMLDivElement | null>(null);
  const artplayerRef = useRef<Artplayer | null>(null);

  console.log('VideoPlayer videoSources:', videoSources);

  useEffect(() => {
    if (!playerRef.current) return;

    const qualities = videoSources.map((source) => ({
      default: source.resolution === '1080p',
      html: source.resolution,
      name: source.resolution,
      url: source.url,
    }));

    const art = new Artplayer({
      container: playerRef.current,
      url: videoSources[0].url,
      type: 'video/mp4',
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      screenshot: false,
      setting: true,
      pip: true,
      hotkey: true,
      quality: qualities.length > 0 ? qualities : undefined,
      autoplay: false,
    });

    artplayerRef.current = art;

    art.on('quality', (data: any) => {
      const currentTime = art.currentTime;
      art.url = data.url;
      art.currentTime = currentTime;
    });

    return () => {
      if (artplayerRef.current) {
        artplayerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl">
      {/* Main Player */}
      <div
        ref={playerRef}
        className="w-full aspect-video bg-black"
        style={{ position: 'relative' }}
      />

      <style jsx global>{`
        .art-video {
          background: #000;
        }

        .artplayer {
          background: #000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .artplayer-control {
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.8),
            transparent
          );
          padding: 16px;
        }

        .artplayer-control-item {
          color: white;
          transition: all 0.3s ease;
        }

        .artplayer-control-item:hover {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
        }

        .artplayer-settings-panel-item {
          color: #e0e0e0;
          transition: all 0.2s ease;
        }

        .artplayer-settings-panel-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .artplayer-settings-panel-item[aria-selected='true'] {
          background: #ef4444;
          color: white;
          font-weight: 600;
        }

        .artplayer-progress {
          background: rgba(255, 255, 255, 0.3);
          height: 4px;
        }

        .artplayer-progress-buffer {
          background: rgba(255, 255, 255, 0.5);
          height: 4px;
        }

        .artplayer-progress-played {
          background: #ef4444;
          height: 4px;
        }

        .artplayer-progress-hover {
          background: #ef4444;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
        }

        .artplayer-play-btn {
          width: 80px;
          height: 80px;
          background: rgba(239, 68, 68, 0.9);
          border: none;
          border-radius: 50%;
          color: white;
          font-size: 32px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .artplayer-play-btn:hover {
          background: rgba(239, 68, 68, 1);
          transform: scale(1.1);
        }

        .artplayer-bottom-control {
          gap: 8px;
        }

        .artplayer-fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          border-radius: 0 !important;
          z-index: 9999;
        }

        .artplayer-tooltip {
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
        }

        .artplayer-time {
          color: white;
          font-size: 12px;
        }

        .artplayer-control-volume {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .artplayer-control-progress {
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }

        .artplayer-contextmenu {
          background: rgba(0, 0, 0, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          padding: 8px;
        }

        .artplayer-contextmenu-item {
          color: #e0e0e0;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .artplayer-contextmenu-item:hover {
          background: rgba(239, 68, 68, 0.8);
          color: white;
        }

        .artplayer-loading {
          color: white;
        }

        .artplayer-loading-icon {
          border-color: rgba(239, 68, 68, 0.3);
          border-top-color: #ef4444;
        }
      `}</style>
    </div>
  );
}
