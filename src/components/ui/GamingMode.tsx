'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import dynamic from 'next/dynamic';
import CaptionDisplay from '@/components/vtuber/CaptionDisplay';
import { TwitchChatOverlay, EmoteWall } from '@/components/twitch/TwitchChat';

const VTuberCanvas = dynamic(() => import('@/components/vtuber/VTuberCanvas'), { ssr: false });

const POSITION_CLASS: Record<string, string> = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-16 right-4',
  'top-left': 'top-16 left-4',
};

export default function GamingModeView() {
  const { settings } = useStore();
  const { gaming } = settings;
  const [streamSrc, setStreamSrc] = useState<MediaStream | null>(null);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (!gaming.enabled) return;
    if (gaming.mode === 'screen-share') {
      navigator.mediaDevices?.getDisplayMedia({ video: true }).then(setStreamSrc).catch(console.error);
    } else if (gaming.mode === 'vdo-ninja' && gaming.vdoCode) {
      setVideoUrl(`https://vdo.ninja/?view=${gaming.vdoCode}&transparent`);
    }
    return () => { streamSrc?.getTracks().forEach((t) => t.stop()); };
  }, [gaming.enabled, gaming.mode, gaming.vdoCode]);

  const posClass = POSITION_CLASS[gaming.characterPosition] || POSITION_CLASS['bottom-right'];

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Background: screen share or VDO ninja */}
      {gaming.mode === 'screen-share' && streamSrc && (
        <video
          autoPlay muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
          ref={(v) => { if (v) v.srcObject = streamSrc; }}
        />
      )}
      {gaming.mode === 'vdo-ninja' && videoUrl && (
        <iframe src={videoUrl} className="absolute inset-0 w-full h-full border-0" allow="camera; microphone; display-capture" />
      )}
      {!streamSrc && gaming.mode === 'screen-share' && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-900">
          <div className="text-center text-gray-500">
            <p className="text-5xl mb-4">🖥️</p>
            <p className="text-lg">Click to start screen share</p>
            <button
              onClick={() => navigator.mediaDevices?.getDisplayMedia({ video: true }).then(setStreamSrc)}
              className="mt-4 px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-violet-500 transition-colors"
            >
              Share Screen
            </button>
          </div>
        </div>
      )}

      {/* Twitch overlays */}
      <TwitchChatOverlay />
      <EmoteWall />

      {/* VTuber character in corner */}
      <div className={`absolute ${posClass} z-30 w-52 h-72`} style={{ filter: 'drop-shadow(0 4px 20px rgba(124,58,237,0.5))' }}>
        <VTuberCanvas className="w-full h-full rounded-xl overflow-hidden" />
        <CaptionDisplay />
      </div>
    </div>
  );
}
