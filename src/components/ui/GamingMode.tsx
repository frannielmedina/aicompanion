'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store';
import dynamic from 'next/dynamic';
import CaptionDisplay from '@/components/vtuber/CaptionDisplay';
import { TwitchChatOverlay, EmoteWall } from '@/components/twitch/TwitchChat';
import { useVision } from '@/hooks/useVision';

const VTuberCanvas = dynamic(() => import('@/components/vtuber/VTuberCanvas'), { ssr: false });

const POSITION_CLASS: Record<string, string> = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-16 right-4',
  'top-left': 'top-16 left-4',
};

export default function GamingModeView() {
  const { settings, lastVisionDescription } = useStore();
  const { gaming, vision } = settings;
  const [streamSrc, setStreamSrc] = useState<MediaStream | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  // Refs passed to the vision hook for frame capture
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Wire up vision
  useVision({ videoRef, iframeRef });

  useEffect(() => {
    if (!gaming.enabled) return;
    if (gaming.mode === 'screen-share') {
      navigator.mediaDevices?.getDisplayMedia({
        video: {
          // Ask for a high-quality capture so vision LLM gets usable frames
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      }).then(setStreamSrc).catch(console.error);
    } else if (gaming.mode === 'vdo-ninja' && gaming.vdoCode) {
      setVideoUrl(`https://vdo.ninja/?view=${gaming.vdoCode}&transparent`);
    }
    return () => { streamSrc?.getTracks().forEach((t) => t.stop()); };
  }, [gaming.enabled, gaming.mode, gaming.vdoCode]);

  // Keep video element's srcObject in sync
  const handleVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamSrc) el.srcObject = streamSrc;
  };

  const posClass = POSITION_CLASS[gaming.characterPosition] || POSITION_CLASS['bottom-right'];

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background: screen share or VDO ninja */}
      {gaming.mode === 'screen-share' && streamSrc && (
        <video
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          ref={handleVideoRef}
        />
      )}
      {gaming.mode === 'vdo-ninja' && videoUrl && (
        <iframe
          ref={iframeRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full border-0"
          allow="camera; microphone; display-capture"
        />
      )}
      {!streamSrc && gaming.mode === 'screen-share' && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-900">
          <div className="text-center text-gray-500">
            <p className="text-5xl mb-4">🖥️</p>
            <p className="text-lg">Click to start screen share</p>
            <button
              onClick={() =>
                navigator.mediaDevices
                  ?.getDisplayMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
                    audio: false,
                  })
                  .then(setStreamSrc)
              }
              className="mt-4 px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-violet-500 transition-colors"
            >
              Share Screen
            </button>
          </div>
        </div>
      )}

      {/* Vision status badge */}
      {vision.enabled && (
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-violet-500/40 text-xs text-violet-300 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Vision Active
          {lastVisionDescription && (
            <span className="max-w-xs truncate text-gray-400 ml-1 hidden sm:inline">
              — {lastVisionDescription}
            </span>
          )}
        </div>
      )}

      {/* Twitch overlays */}
      <TwitchChatOverlay />
      <EmoteWall />

      {/* VTuber character in corner */}
      <div
        className={`absolute ${posClass} z-30 w-52 h-72`}
        style={{ filter: 'drop-shadow(0 4px 20px rgba(124,58,237,0.5))' }}
      >
        <VTuberCanvas className="w-full h-full rounded-xl overflow-hidden" />
        <CaptionDisplay />
      </div>
    </div>
  );
}
