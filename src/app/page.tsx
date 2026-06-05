'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MessageSquare, MessageSquareOff } from 'lucide-react';
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
  const { settings, chatPanelVisible, setChatPanelVisible } = useStore();
  const fontFamily = FONT_MAP[settings.font];

  // Determine the stage background: custom image takes priority, else solid color
  const stageBg = settings.customBgDataUrl
    ? `url("${settings.customBgDataUrl}") center/cover no-repeat`
    : settings.greenScreenColor;

  return (
    <div className="flex flex-col h-screen bg-dark-900 text-white overflow-hidden" style={{ fontFamily }}>
      <TwitchInit />
      <TopBar />

      <div className="flex flex-1 overflow-hidden relative">
        {settings.gaming.enabled ? (
          <GamingModeView />
        ) : (
          <>
            {/* VTuber Stage */}
            <div
              className="relative flex-1 overflow-hidden"
              style={{ background: stageBg }}
            >
              <VTuberCanvas className="w-full h-full" />
              <CaptionDisplay />
              <TwitchChatOverlay />
              <EmoteWall />

              {/* Chat toggle button — always visible on stage */}
              <button
                onClick={() => setChatPanelVisible(!chatPanelVisible)}
                title={chatPanelVisible ? 'Hide chat' : 'Show chat'}
                className="absolute top-3 right-3 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-800/80 hover:bg-dark-700 border border-dark-500 text-gray-300 hover:text-white backdrop-blur-sm transition-all shadow-lg"
              >
                {chatPanelVisible
                  ? <><MessageSquareOff size={13} /> Hide Chat</>
                  : <><MessageSquare size={13} /> Show Chat</>
                }
              </button>
            </div>

            {/* Chat Panel — collapsible */}
            {chatPanelVisible && (
              <div className="w-80 flex-shrink-0">
                <ChatPanel />
              </div>
            )}
          </>
        )}
      </div>

      <SettingsModal />
    </div>
  );
}
