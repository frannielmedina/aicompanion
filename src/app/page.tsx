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

const HIDE_DELAY = 3000;

export default function Home() {
  const { settings, chatPanelVisible } = useStore();
  const fontFamily = FONT_MAP[settings.font];

  const [uiVisible, setUiVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Prevent SSR/hydration mismatch — don't render dynamic content until client is ready
  useEffect(() => {
    setMounted(true);
  }, []);

  const showUI = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setUiVisible(false), HIDE_DELAY);
  }, []);

  useEffect(() => {
    hideTimer.current = setTimeout(() => setUiVisible(false), HIDE_DELAY);
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  const stageBg = settings.customBgDataUrl
    ? `url("${settings.customBgDataUrl}") center/cover no-repeat`
    : settings.greenScreenColor;

  // Render a simple loading shell until client is mounted
  // This prevents hydration mismatches from Zustand persist / localStorage
  if (!mounted) {
    return (
      <div className="flex flex-col h-screen bg-dark-900 text-white overflow-hidden items-center justify-center">
        <div className="text-4xl animate-bounce">🌸</div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen bg-dark-900 text-white overflow-hidden"
      style={{ fontFamily }}
      onMouseMove={showUI}
      onMouseEnter={showUI}
    >
      <TwitchInit />

      {/* TopBar — fixed overlay at top, slides up when inactive */}
      <div
        className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out"
        style={{ transform: uiVisible ? 'translateY(0)' : 'translateY(-100%)' }}
      >
        <TopBar uiVisible={uiVisible} />
      </div>

      {/* Full-screen content — no top padding, topbar overlays */}
      <div className="flex flex-1 h-full overflow-hidden">
        {settings.gaming.enabled ? (
          <GamingModeView />
        ) : (
          <>
            {/* VTuber Stage — always fills all available space */}
            <div className="relative flex-1 overflow-hidden" style={{ background: stageBg }}>
              <VTuberCanvas className="w-full h-full" />
              <CaptionDisplay />
              <TwitchChatOverlay />
              <EmoteWall />
            </div>

            {/* Chat Panel — slides in/out from right */}
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
