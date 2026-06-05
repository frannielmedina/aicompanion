'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@/components/ui/TopBar';
import ChatPanel from '@/components/chat/ChatPanel';
import CaptionDisplay from '@/components/vtuber/CaptionDisplay';
import SettingsModal from '@/components/settings/SettingsModal';
import { TwitchChatOverlay, EmoteWall, useTwitchChat } from '@/components/twitch/TwitchChat';
import { useStore } from '@/store';
import { FONT_MAP } from '@/lib/fonts';

const VTuberCanvas = dynamic(() => import('@/components/vtuber/VTuberCanvas'), { ssr: false });
const GamingModeView = dynamic(() => import('@/components/ui/GamingMode'), { ssr: false });

function TwitchInit() { useTwitchChat(); return null; }

export default function Home() {
  const { settings } = useStore();
  const fontFamily = FONT_MAP[settings.font];

  return (
    <div className="flex flex-col h-screen bg-dark-900 text-white overflow-hidden" style={{ fontFamily }}>
      <TwitchInit />
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {settings.gaming.enabled ? (
          <GamingModeView />
        ) : (
          <>
            {/* VTuber Stage */}
            <div className="relative flex-1 overflow-hidden" style={{ background: settings.greenScreenColor }}>
              <VTuberCanvas className="w-full h-full" />
              <CaptionDisplay />
              <TwitchChatOverlay />
              <EmoteWall />

              {/* Provider badge */}
              <div className="absolute bottom-2 right-2 text-xs text-black/40 font-mono bg-black/10 px-2 py-0.5 rounded select-none">
                {settings.llm.provider} · {settings.tts.provider}
              </div>
            </div>

            {/* Chat Panel */}
            <div className="w-80 flex-shrink-0">
              <ChatPanel />
            </div>
          </>
        )}
      </div>

      <SettingsModal />
    </div>
  );
}
