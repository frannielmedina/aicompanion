'use client';
import { Settings, Gamepad2, Monitor, Twitch, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import { useStore } from '@/store';
import { translations } from '@/lib/i18n';
import { FONT_MAP } from '@/lib/fonts';

export default function TopBar() {
  const { settings, settingsOpen, setSettingsOpen, isSpeaking, isThinking } = useStore();
  const t = translations[settings.language];
  const fontFamily = FONT_MAP[settings.font];

  const statusColor = isThinking ? 'text-yellow-400' : isSpeaking ? 'text-accent-secondary' : 'text-accent-green';
  const statusText = isThinking ? t.thinking : isSpeaking ? t.speaking : t.idle;

  return (
    <header className="h-12 bg-dark-800/95 backdrop-blur border-b border-dark-500 flex items-center justify-between px-4 z-40" style={{ fontFamily }}>
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <span className="font-bold text-white text-sm tracking-wide">{t.appName}</span>
        <span className="text-gray-600 text-xs">|</span>
        <span className="text-accent-secondary text-xs font-medium">{settings.vtuberName}</span>
      </div>

      {/* Center: Status */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 ${statusColor}`}>
          <div className={`w-2 h-2 rounded-full ${isThinking || isSpeaking ? 'animate-pulse' : ''}`} style={{ background: 'currentColor' }} />
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

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <div className="text-xs text-gray-500 mr-2 hidden sm:block">
          LLM: <span className="text-gray-400">{settings.llm.provider}</span>
          {' · '}TTS: <span className="text-gray-400">{settings.tts.provider}</span>
        </div>
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
