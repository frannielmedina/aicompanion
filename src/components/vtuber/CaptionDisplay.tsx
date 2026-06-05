'use client';
import { useStore } from '@/store';
import { FONT_MAP } from '@/lib/fonts';

export default function CaptionDisplay() {
  const { currentCaption, isSpeaking, isThinking, settings } = useStore();

  if (!currentCaption && !isThinking) return null;

  const fontFamily = FONT_MAP[settings.font];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-30 pointer-events-none">
      <div className="bg-black/75 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 text-center shadow-2xl">
        {isThinking && !currentCaption ? (
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-accent-secondary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            <span className="text-gray-400 text-sm" style={{ fontFamily }}>Thinking...</span>
          </div>
        ) : (
          <p className="text-white text-base leading-relaxed" style={{ fontFamily, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {isSpeaking && <span className="inline-block w-2 h-4 bg-accent-secondary rounded-sm mr-2 animate-pulse align-middle" />}
            {currentCaption}
          </p>
        )}
      </div>
    </div>
  );
}
