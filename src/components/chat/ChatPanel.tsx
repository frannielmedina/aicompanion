'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useStore } from '@/store';
import { callLLM } from '@/lib/llm';
import { synthesizeSpeech, playAudioBuffer } from '@/lib/tts';
import { translations } from '@/lib/i18n';
import { FONT_MAP } from '@/lib/fonts';

/** Strip <think>…</think> blocks (including partial/unclosed ones) from model output */
function stripThinkTags(text: string): string {
  // Remove complete <think>...</think> blocks
  let result = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  // Remove unclosed <think> blocks (reasoning that bleeds to end of string)
  result = result.replace(/<think>[\s\S]*/gi, '');
  return result.trim();
}

export default function ChatPanel() {
  const { settings, chatHistory, addChat, clearChat, setIsSpeaking, setIsThinking, setCurrentCaption } = useStore();
  const t = translations[settings.language];
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fontFamily = FONT_MAP[settings.font];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);
    addChat({ role: 'user', content: msg });
    setIsThinking(true);
    setCurrentCaption('');

    try {
      const raw = await callLLM(settings.llm, [...chatHistory, { role: 'user', content: msg }], settings.systemPrompt);
      const response = stripThinkTags(raw);
      addChat({ role: 'assistant', content: response });
      setIsThinking(false);
      setCurrentCaption(response);

      if (settings.tts.apiKey || settings.tts.provider === 'voicevox' || settings.tts.provider === 'aivis' || settings.tts.email) {
        setIsSpeaking(true);
        try {
          const audio = await synthesizeSpeech(settings.tts, response);
          if (audio) await playAudioBuffer(audio);
        } catch (e) {
          console.error('TTS Error:', e);
        }
        setIsSpeaking(false);
      }

      setTimeout(() => setCurrentCaption(''), 8000);
    } catch (e: any) {
      const errMsg = `Error: ${e.message}`;
      addChat({ role: 'assistant', content: errMsg });
      setCurrentCaption(errMsg);
      setIsThinking(false);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-full bg-dark-800/95 border-l border-dark-500" style={{ fontFamily }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-500">
        <h3 className="text-sm font-bold text-white">💬 Chat</h3>
        <button onClick={clearChat} className="text-gray-500 hover:text-red-400 transition-colors" title={t.clearChat}>
          <Trash2 size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatHistory.length === 0 && (
          <div className="text-center text-gray-600 text-sm mt-8">
            <p className="text-3xl mb-2">👋</p>
            <p>Start chatting with {settings.vtuberName}!</p>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent-primary text-white rounded-br-sm'
                : 'bg-dark-600 text-gray-200 rounded-bl-sm border border-dark-500'
            }`}>
              {msg.role === 'assistant' && (
                <span className="text-xs text-accent-secondary font-bold block mb-1">{settings.vtuberName}</span>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-dark-600 border border-dark-500 rounded-2xl rounded-bl-sm px-4 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-accent-secondary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-dark-500">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-dark-600 border border-dark-500 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary transition-colors"
            placeholder={t.typeMessage}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={loading}
            style={{ fontFamily }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="bg-accent-primary hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-3 py-2 transition-all"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
