import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontOption = 'comic' | 'arial' | 'montserrat' | 'verdana';
export type Language = 'en' | 'es';

export interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
  customEndpoint?: string;
  email?: string;
  password?: string;
}

export interface TTSConfig {
  provider: string;
  apiKey: string;
  voice: string;
  model?: string;
  email?: string;
  password?: string;
  customEndpoint?: string;
  language?: string;
  speed?: number;
}

export interface TwitchConfig {
  enabled: boolean;
  channelName: string;
  accessToken?: string;
  showOverlay: boolean;
  showEmoteWall: boolean;
}

export interface GamingModeConfig {
  enabled: boolean;
  mode: 'screen-share' | 'vdo-ninja';
  vdoCode: string;
  characterPosition: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export interface CaptionConfig {
  color: string;
  font: FontOption;
  size: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
}

export interface Settings {
  font: FontOption;
  language: Language;
  darkTheme: boolean;
  llm: LLMConfig;
  tts: TTSConfig;
  twitch: TwitchConfig;
  gaming: GamingModeConfig;
  vtuberName: string;
  systemPrompt: string;
  greenScreenColor: string;
  customVrmUrl?: string;
  customVrmName?: string;
  caption?: CaptionConfig;
  customBgDataUrl?: string;
}

interface AppState {
  settings: Settings;
  settingsOpen: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  currentCaption: string;
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
  twitchMessages: TwitchMessage[];
  emoteWall: EmoteParticle[];
  chatPanelVisible: boolean;
  setSettings: (s: Partial<Settings>) => void;
  setSettingsOpen: (v: boolean) => void;
  setIsSpeaking: (v: boolean) => void;
  setIsThinking: (v: boolean) => void;
  setCurrentCaption: (v: string) => void;
  addChat: (msg: { role: 'user' | 'assistant'; content: string }) => void;
  clearChat: () => void;
  addTwitchMessage: (msg: TwitchMessage) => void;
  addEmote: (e: EmoteParticle) => void;
  removeEmote: (id: string) => void;
  setChatPanelVisible: (v: boolean) => void;
}

export interface TwitchMessage {
  id: string;
  username: string;
  color: string;
  message: string;
  emotes: string[];
  timestamp: number;
}

export interface EmoteParticle {
  id: string;
  url: string;
  x: number;
  y: number;
  driftX: number;
}

const defaultSettings: Settings = {
  font: 'comic',
  language: 'en',
  darkTheme: true,
  vtuberName: 'Ai-Chan',
  systemPrompt: 'You are Ai-Chan, a friendly and cheerful AI VTuber. Be energetic, fun, and engaging!',
  greenScreenColor: '#00ff00',
  customVrmUrl: '',
  customVrmName: '',
  customBgDataUrl: '',
  caption: {
    color: '#ffffff',
    font: 'comic',
    size: 'base',
  },
  llm: {
    provider: 'groq',
    model: 'llama3-70b-8192',
    apiKey: '',
    temperature: 0.8,
    maxTokens: 512,
  },
  tts: {
    provider: 'elevenlabs',
    apiKey: '',
    voice: 'EXAVITQu4vr4xnSDxMaL',
    model: 'eleven_flash_v2_5',
    speed: 1.0,
  },
  twitch: {
    enabled: false,
    channelName: '',
    showOverlay: true,
    showEmoteWall: true,
  },
  gaming: {
    enabled: false,
    mode: 'screen-share',
    vdoCode: '',
    characterPosition: 'bottom-right',
  },
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      settingsOpen: false,
      isSpeaking: false,
      isThinking: false,
      currentCaption: '',
      chatHistory: [],
      twitchMessages: [],
      emoteWall: [],
      chatPanelVisible: true,
      setSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),
      setSettingsOpen: (v) => set({ settingsOpen: v }),
      setIsSpeaking: (v) => set({ isSpeaking: v }),
      setIsThinking: (v) => set({ isThinking: v }),
      setCurrentCaption: (v) => set({ currentCaption: v }),
      addChat: (msg) => set((state) => ({ chatHistory: [...state.chatHistory.slice(-50), msg] })),
      clearChat: () => set({ chatHistory: [] }),
      addTwitchMessage: (msg) => set((state) => ({
        twitchMessages: [...state.twitchMessages.slice(-50), msg],
      })),
      addEmote: (e) => set((state) => ({ emoteWall: [...state.emoteWall, e] })),
      removeEmote: (id) => set((state) => ({ emoteWall: state.emoteWall.filter((e) => e.id !== id) })),
      setChatPanelVisible: (v) => set({ chatPanelVisible: v }),
    }),
    { name: 'ai-companion-settings', partialize: (s) => ({ settings: s.settings }) }
  )
);
