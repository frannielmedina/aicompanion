'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useStore, type TwitchMessage, type EmoteParticle } from '@/store';
import { callLLM } from '@/lib/llm';
import { synthesizeSpeech, playAudioBuffer } from '@/lib/tts';
import { parseExpression, EXPRESSION_SYSTEM_PROMPT_ADDITION } from '@/lib/expression';

function stripThinkTags(text: string): string {
  let result = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  result = result.replace(/<think>[\s\S]*/gi, '');
  return result.trim();
}

export function useTwitchChat() {
  const {
    settings,
    addTwitchMessage,
    addEmote,
    removeEmote,
    addChat,
    setIsSpeaking,
    setIsThinking,
    setCurrentCaption,
    setCurrentExpression,
    chatHistory,
    isSpeaking,
    isThinking,
  } = useStore();

  const wsRef = useRef<WebSocket | null>(null);
  const busyRef = useRef(false);

  const stateRef = useRef({ isSpeaking, isThinking, chatHistory });
  useEffect(() => {
    stateRef.current = { isSpeaking, isThinking, chatHistory };
  }, [isSpeaking, isThinking, chatHistory]);

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const handleAIResponse = useCallback(async (twitchMsg: TwitchMessage) => {
    if (busyRef.current) return;
    if (stateRef.current.isSpeaking || stateRef.current.isThinking) return;

    const s = settingsRef.current;
    if (!s.llm.apiKey && s.llm.provider !== 'localllama') return;

    busyRef.current = true;

    const userContent = `[Twitch chat from ${twitchMsg.username}]: ${twitchMsg.message}`;
    const syntheticMsg = { role: 'user' as const, content: userContent };
    const augmentedSystemPrompt = s.systemPrompt + EXPRESSION_SYSTEM_PROMPT_ADDITION;

    try {
      setIsThinking(true);
      setCurrentCaption('');

      const raw = await callLLM(
        s.llm,
        [...stateRef.current.chatHistory, syntheticMsg],
        augmentedSystemPrompt,
      );
      const stripped = stripThinkTags(raw);
      const { expression, cleanText } = parseExpression(stripped);

      addChat({ role: 'user', content: userContent });
      addChat({ role: 'assistant', content: cleanText });
      setIsThinking(false);

      const hasTTS = s.tts.apiKey || s.tts.provider === 'voicevox' || s.tts.provider === 'aivis' || s.tts.email;

      if (hasTTS) {
        try {
          const audio = await synthesizeSpeech(s.tts, cleanText);
          if (audio) {
            // Audio ready — show caption/expression then play
            setCurrentExpression(expression);
            setCurrentCaption(cleanText);
            setIsSpeaking(true);
            await playAudioBuffer(audio);
            setIsSpeaking(false);
          } else {
            setCurrentExpression(expression);
            setCurrentCaption(cleanText);
          }
        } catch (e) {
          console.error('Twitch TTS error:', e);
          setCurrentExpression(expression);
          setCurrentCaption(cleanText);
        }
      } else {
        setCurrentExpression(expression);
        setCurrentCaption(cleanText);
      }

      setTimeout(() => {
        setCurrentCaption('');
        setCurrentExpression('neutral');
      }, 8000);
    } catch (e) {
      console.error('Twitch AI response error:', e);
      setIsThinking(false);
    }

    busyRef.current = false;
  }, [addChat, setIsSpeaking, setIsThinking, setCurrentCaption, setCurrentExpression]);

  useEffect(() => {
    if (!settings.twitch.enabled || !settings.twitch.channelName) return;

    const channel = settings.twitch.channelName.toLowerCase().replace('#', '');
    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
      if (settings.twitch.accessToken && settings.twitch.accessToken.trim()) {
        const token = settings.twitch.accessToken.trim();
        const oauthToken = token.startsWith('oauth:') ? token : `oauth:${token}`;
        ws.send(`PASS ${oauthToken}`);
        ws.send(`NICK ${channel}`);
      } else {
        ws.send('PASS SCHMOOPIIE');
        ws.send('NICK justinfan' + Math.floor(Math.random() * 100000));
      }
      ws.send(`JOIN #${channel}`);
    };

    ws.onmessage = (event) => {
      const raw = event.data as string;
      if (raw.startsWith('PING')) { ws.send('PONG :tmi.twitch.tv'); return; }

      const lines = raw.split('\r\n').filter(Boolean);
      for (const line of lines) {
        const msg = parseTwitchMessage(line, addTwitchMessage, addEmote, removeEmote);
        if (msg && settings.twitch.aiRespondsToChat) {
          handleAIResponse(msg);
        }
      }
    };

    ws.onerror = (e) => console.error('Twitch WS error:', e);

    return () => { ws.close(); };
  }, [
    settings.twitch.enabled,
    settings.twitch.channelName,
    settings.twitch.accessToken,
    settings.twitch.aiRespondsToChat,
    addTwitchMessage,
    addEmote,
    removeEmote,
    handleAIResponse,
  ]);
}

function parseTwitchMessage(
  line: string,
  addMsg: (m: TwitchMessage) => void,
  addEmote: (e: EmoteParticle) => void,
  removeEmote: (id: string) => void,
): TwitchMessage | null {
  const tagMatch = line.match(/^@([^ ]+)/);
  const tags: Record<string, string> = {};
  if (tagMatch) {
    tagMatch[1].split(';').forEach((tag) => {
      const [k, v] = tag.split('=');
      tags[k] = v || '';
    });
  }

  const privmsgMatch = line.match(/PRIVMSG #\w+ :(.+)$/);
  if (!privmsgMatch) return null;

  const message = privmsgMatch[1];
  const username = tags['display-name'] || 'unknown';
  const color = tags['color'] || randomColor(username);
  const emoteTag = tags['emotes'] || '';

  const emoteUrls: string[] = [];
  if (emoteTag) {
    emoteTag.split('/').forEach((e) => {
      const [id] = e.split(':');
      if (id) emoteUrls.push(`https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`);
    });
  }

  const msg: TwitchMessage = {
    id: Date.now().toString() + Math.random(),
    username,
    color,
    message,
    emotes: emoteUrls,
    timestamp: Date.now(),
  };
  addMsg(msg);

  emoteUrls.forEach((url) => {
    const id = Date.now().toString() + Math.random();
    const particle: EmoteParticle = {
      id, url,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      driftX: (Math.random() - 0.5) * 200,
    };
    addEmote(particle);
    setTimeout(() => removeEmote(id), 30000);
  });

  return msg;
}

function randomColor(seed: string): string {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function TwitchChatOverlay() {
  const { settings, twitchMessages } = useStore();
  if (!settings.twitch.enabled || !settings.twitch.showOverlay) return null;

  const recent = twitchMessages.slice(-8);

  return (
    <div className="absolute top-4 left-4 z-20 w-72 space-y-1.5 pointer-events-none">
      {recent.map((msg) => (
        <div key={msg.id} className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 animate-slide-in border border-white/10">
          <span className="font-bold text-sm" style={{ color: msg.color }}>{msg.username}</span>
          <span className="text-white/60 text-sm mx-1">:</span>
          <span className="text-white text-sm break-words">{msg.message}</span>
          {msg.emotes.map((url, i) => (
            <img key={i} src={url} alt="" className="inline-block w-6 h-6 ml-1 align-middle" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmoteWall() {
  const { settings, emoteWall } = useStore();
  if (!settings.twitch.enabled || !settings.twitch.showEmoteWall) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {emoteWall.map((emote) => (
        <img
          key={emote.id}
          src={emote.url}
          alt=""
          className="absolute w-12 h-12"
          style={{
            left: `${emote.x}%`,
            top: `${emote.y}%`,
            '--drift-x': `${emote.driftX}px`,
            animation: 'emoteDrift 6s ease-in-out forwards',
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
