'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useStore } from '@/store';
import { callLLM } from '@/lib/llm';
import { synthesizeSpeech, playAudioBuffer } from '@/lib/tts';
import { translations } from '@/lib/i18n';
import { FONT_MAP } from '@/lib/fonts';
import { parseExpression, EXPRESSION_SYSTEM_PROMPT_ADDITION } from '@/lib/expression';

/** Strip <think>…</think> blocks (including partial/unclosed ones) from model output */
function stripThinkTags(text: string): string {
  let result = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  result = result.replace(/<think>[\s\S]*/gi, '');
  return result.trim();
}

export default function ChatPanel() {
  const {
    settings,
    chatHistory,
    addChat,
    clearChat,
    setIsSpeaking,
    setIsThinking,
    setCurrentCaption,
    setCurrentExpression,
  } = useStore();
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

    // Build augmented system prompt with expression instructions
    const augmentedSystemPrompt = settings.systemPrompt + EXPRESSION_SYSTEM_PROMPT_ADDITION;

    try {
      const raw = await callLLM(
        settings.llm,
        [...chatHistory, { role: 'user', content: msg }],
        augmentedSystemPrompt,
      );
      const stripped = stripThinkTags(raw);

      // Parse expression tag — cleanText has the tag removed
      const { expression, cleanText } = parseExpression(stripped);

      // Store history WITHOUT the expression tag (clean for display)
      addChat({ role: 'assistant', content: cleanText });
      setIsThinking(false);

      const hasTTS = settings.tts.apiKey || settings.tts.provider === 'voicevox' || settings.tts.provider === 'aivis' || settings.tts.email;

      if (hasTTS) {
        // Generate audio FIRST — caption/expression only appear once audio is ready
        try {
          const audio = await synthesizeSpeech(settings.tts, cleanText);
          if (audio) {
            // Audio is ready — now show caption and expression, then play
            setCurrentExpression(expression);
            setCurrentCaption(cleanText);
            setIsSpeaking(true);
            await playAudioBuffer(audio);
            setIsSpeaking(false);
          } else {
            // No audio returned — show caption anyway so text isn't lost
            setCurrentExpression(expression);
            setCurrentCaption(cleanText);
          }
        } catch (e) {
          console.error('TTS Error:', e);
          // On TTS failure — still show the caption so the response isn't invisible
          setCurrentExpression(expression);
          setCurrentCaption(cleanText);
        }
      } else {
        // No TTS configured — show caption immediately
        setCurrentExpression(expression);
        setCurrentCaption(cleanText);
      }

      // Reset expression to neutral after caption fades
      setTimeout(() => {
        setCurrentCaption('');
        setCurrentExpression('neutral');
      }, 8000);
    } catch (e: any) {
      const errMsg = `Error: ${e.message}`;
      addChat({ role: 'assistant', content: errMsg });
      setCurrentCaption(errMsg);
      setCurrentExpression('neutral');
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
              {/* content is already clean — no expression tag */}
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
