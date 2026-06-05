'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
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

const HIDE_DELAY = 3000; // ms of inactivity before UI hides

export default function Home() {
  const { settings, chatPanelVisible } = useStore();
  const fontFamily = FONT_MAP[settings.font];

  const [uiVisible, setUiVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showUI = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), HIDE_DELAY);
  }, []);

  // Start hide timer on mount
  useEffect(() => {
    hideTimer.current = setTimeout(() => setUiVisible(false), HIDE_DELAY);
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const stageBg = settings.customBgDataUrl
    ? `url("${settings.customBgDataUrl}") center/cover no-repeat`
    : settings.greenScreenColor;

  return (
    <div
      className="flex flex-col h-screen bg-dark-900 text-white overflow-hidden"
      style={{ fontFamily }}
      onMouseMove={showUI}
      onMouseEnter={showUI}
    >
      <TwitchInit />

      {/* TopBar — slides up when hidden */}
      <div
        className="flex-shrink-0 transition-transform duration-300 ease-in-out"
        style={{ transform: uiVisible ? 'translateY(0)' : 'translateY(-100%)' }}
      >
        <TopBar uiVisible={uiVisible} />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {settings.gaming.enabled ? (
          <GamingModeView />
        ) : (
          <>
            {/* VTuber Stage — always full area */}
            <div className="relative flex-1 overflow-hidden" style={{ background: stageBg }}>
              <VTuberCanvas className="w-full h-full" />
              <CaptionDisplay />
              <TwitchChatOverlay />
              <EmoteWall />
            </div>

            {/* Chat Panel — slides in from the right */}
            <div
              className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
              style={{ width: chatPanelVisible ? '320px' : '0px' }}
            >
              <div className="w-80 h-full">
                <ChatPanel />
              </div>
            </div>
          </>
        )}
      </div>

      <SettingsModal />
    </div>
  );
}
