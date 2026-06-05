'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import dynamic from 'next/dynamic';
import { TwitchChatOverlay, EmoteWall } from '@/components/twitch/TwitchChat';
import { useVision } from '@/hooks/useVision';
import { useStore as useStoreGlobal } from '@/store';
import { FONT_MAP } from '@/lib/fonts';

const VTuberCanvas = dynamic(() => import('@/components/vtuber/VTuberCanvas'), { ssr: false });

// Caption overlay rendered at full-screen level, centered at bottom
function GamingCaptionDisplay() {
  const { currentCaption, isSpeaking, settings } = useStore();
  if (!currentCaption) return null;

  const captionFont = settings.caption?.font
    ? FONT_MAP[settings.caption.font as keyof typeof FONT_MAP] ?? FONT_MAP[settings.font]
    : FONT_MAP[settings.font];
  const captionColor = settings.caption?.color ?? '#ffffff';
  const captionSize = settings.caption?.size ?? 'base';
  const sizeMap: Record<string, string> = {
    sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem',
  };
  const fontSize = sizeMap[captionSize] ?? '1rem';
  const textShadow =
    '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, ' +
    '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, ' +
    '0 0 8px rgba(0,0,0,0.9)';

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-40 pointer-events-none">
      <div className="text-center">
        <p style={{ fontFamily: captionFont, color: captionColor, fontSize, textShadow, lineHeight: 1.5, fontWeight: 700 }}>
          {isSpeaking && (
            <span className="inline-block w-2 h-4 rounded-sm mr-2 animate-pulse align-middle" style={{ background: captionColor }} />
          )}
          {currentCaption}
        </p>
      </div>
    </div>
  );
}

export default function GamingModeView() {
  const { settings, lastVisionDescription } = useStore();
  const { gaming, vision } = settings;
  const [streamSrc, setStreamSrc] = useState<MediaStream | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  // Character size in px — controllable via mouse wheel
  const [charWidth, setCharWidth] = useState(320);
  const [charHeight, setCharHeight] = useState(520);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const charContainerRef = useRef<HTMLDivElement | null>(null);

  useVision({ videoRef, iframeRef });

  useEffect(() => {
    if (!gaming.enabled) return;
    if (gaming.mode === 'screen-share') {
      navigator.mediaDevices?.getDisplayMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false,
      }).then(setStreamSrc).catch(console.error);
    } else if (gaming.mode === 'vdo-ninja' && gaming.vdoCode) {
      setVideoUrl(`https://vdo.ninja/?view=${gaming.vdoCode}&transparent`);
    }
    return () => { streamSrc?.getTracks().forEach((t) => t.stop()); };
  }, [gaming.enabled, gaming.mode, gaming.vdoCode]);

  const handleVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamSrc) el.srcObject = streamSrc;
  };

  // Mouse wheel zoom on the character
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -20 : 20;
    setCharWidth((w) => Math.max(160, Math.min(700, w + delta)));
    setCharHeight((h) => Math.max(260, Math.min(900, h + Math.round(delta * 1.625))));
  }, []);

  useEffect(() => {
    const el = charContainerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Determine character corner position styles
  const posStyles: Record<string, React.CSSProperties> = {
    'bottom-right': { bottom: 0, right: 0 },
    'bottom-left': { bottom: 0, left: 0 },
    'top-right': { top: 48, right: 0 },   // 48px to clear the topbar
    'top-left': { top: 48, left: 0 },
  };
  const charPos = posStyles[gaming.characterPosition] ?? posStyles['bottom-right'];

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">

      {/* ── Game content background ─────────────────────────────────── */}
      {gaming.mode === 'screen-share' && streamSrc && (
        <video
          autoPlay muted playsInline
          className="absolute inset-0 w-full h-full object-contain"
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
            <p className="text-lg mb-4">Click to start screen share</p>
            <button
              onClick={() =>
                navigator.mediaDevices
                  ?.getDisplayMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
                    audio: false,
                  })
                  .then(setStreamSrc)
              }
              className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-violet-500 transition-colors"
            >
              Share Screen
            </button>
          </div>
        </div>
      )}

      {/* ── Twitch overlays ─────────────────────────────────────────── */}
      <TwitchChatOverlay />
      <EmoteWall />

      {/* ── VTuber character — large, anchored to chosen corner ─────── */}
      <div
        ref={charContainerRef}
        className="absolute z-30 cursor-ns-resize select-none"
        style={{
          ...charPos,
          width: charWidth,
          height: charHeight,
          filter: 'drop-shadow(0 8px 32px rgba(124,58,237,0.55))',
        }}
        title="Scroll to resize"
      >
        <VTuberCanvas className="w-full h-full" transparent />
      </div>

      {/* ── Caption centered at bottom of FULL screen ───────────────── */}
      <GamingCaptionDisplay />

      {/* ── Vision status badge ─────────────────────────────────────── */}
      {vision.enabled && (
        <div className="absolute top-16 right-4 z-40 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-violet-500/40 text-xs text-violet-300 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Vision Active
          {lastVisionDescription && (
            <span className="max-w-xs truncate text-gray-400 ml-1 hidden sm:inline">
              — {lastVisionDescription}
            </span>
          )}
        </div>
      )}

      {/* ── Scroll-to-resize hint ───────────────────────────────────── */}
      <div className="absolute bottom-2 right-2 z-50 text-xs text-white/30 pointer-events-none select-none">
        🖱 scroll over character to resize
      </div>
    </div>
  );
}
