'use client';
import { Settings, Gamepad2, Twitch, MessageSquare, MessageSquareOff } from 'lucide-react';
import { useStore } from '@/store';
import { translations } from '@/lib/i18n';
import { FONT_MAP } from '@/lib/fonts';

interface TopBarProps {
  uiVisible?: boolean;
}

export default function TopBar({ uiVisible }: TopBarProps) {
  const { settings, settingsOpen, setSettingsOpen, isSpeaking, chatPanelVisible, setChatPanelVisible } = useStore();
  const t = translations[settings.language];
  const fontFamily = FONT_MAP[settings.font];

  const statusColor = isSpeaking ? 'text-accent-secondary' : 'text-accent-green';
  const statusText = isSpeaking ? t.speaking : t.idle;

  return (
    <header
      className="h-12 bg-dark-800/95 backdrop-blur border-b border-dark-500 flex items-center justify-between px-4 z-40"
      style={{ fontFamily }}
    >
      {/* Left: Name only — no robot icon */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-white text-sm tracking-wide">{t.appName}</span>
        <span className="text-gray-600 text-xs">|</span>
        <span className="text-accent-secondary text-xs font-medium">{settings.vtuberName}</span>
      </div>

      {/* Center: Status */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 ${statusColor}`}>
          <div
            className={`w-2 h-2 rounded-full ${isSpeaking ? 'animate-pulse' : ''}`}
            style={{ background: 'currentColor' }}
          />
          <span className="text-xs font-medium">{statusText}</span>
        </div>
        {settings.twitch.enabled && (
          <div className="flex items-center gap-1 text-purple-400 ml-3">
            <Twitch size={12} />
            <span className="text-xs">{settings.twitch.channelName}</span>
          </div>
        )}
        {settings.gaming.enabled && (
          <div className="flex items-center gap-1 text-accent-green ml-2">
            <Gamepad2 size={12} />
            <span className="text-xs">Gaming</span>
          </div>
        )}
      </div>

      {/* Right: Chat toggle + Settings */}
      <div className="flex items-center gap-1">
        {/* Chat panel toggle */}
        <button
          onClick={() => setChatPanelVisible(!chatPanelVisible)}
          title={chatPanelVisible ? 'Hide chat' : 'Show chat'}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 transition-all flex items-center gap-1"
        >
          {chatPanelVisible
            ? <MessageSquareOff size={16} />
            : <MessageSquare size={16} />
          }
        </button>

        {/* Settings */}
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 transition-all"
          title={t.settings}
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
