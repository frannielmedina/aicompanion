'use client';
import { useEffect, useRef } from 'react';
import { useStore, type TwitchMessage, type EmoteParticle } from '@/store';

// Twitch chat via WebSocket without tmi.js (avoids SSR issues)
export function useTwitchChat() {
  const { settings, addTwitchMessage, addEmote, removeEmote } = useStore();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!settings.twitch.enabled || !settings.twitch.channelName) return;

    const channel = settings.twitch.channelName.toLowerCase().replace('#', '');
    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
      if (settings.twitch.accessToken) {
        ws.send(`PASS ${settings.twitch.accessToken}`);
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
        parseTwitchMessage(line, addTwitchMessage, addEmote, removeEmote);
      }
    };

    return () => { ws.close(); };
  }, [settings.twitch.enabled, settings.twitch.channelName, settings.twitch.accessToken]);
}

function parseTwitchMessage(
  line: string,
  addMsg: (m: TwitchMessage) => void,
  addEmote: (e: EmoteParticle) => void,
  removeEmote: (id: string) => void,
) {
  // Parse IRC tags
  const tagMatch = line.match(/^@([^ ]+)/);
  const tags: Record<string, string> = {};
  if (tagMatch) {
    tagMatch[1].split(';').forEach((tag) => {
      const [k, v] = tag.split('=');
      tags[k] = v || '';
    });
  }

  const privmsgMatch = line.match(/PRIVMSG #\w+ :(.+)$/);
  if (!privmsgMatch) return;

  const message = privmsgMatch[1];
  const username = tags['display-name'] || 'unknown';
  const color = tags['color'] || randomColor(username);
  const emoteTag = tags['emotes'] || '';

  // Parse emote URLs
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

  // Spawn emote particles
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
}

function randomColor(seed: string): string {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Chat overlay component
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

// Emote wall
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
