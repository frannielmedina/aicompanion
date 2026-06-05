'use client';
import { useStore } from '@/store';
import { FONT_MAP } from '@/lib/fonts';

export default function CaptionDisplay() {
  const { currentCaption, isSpeaking, isThinking, settings } = useStore();

  // Only show when speaking or when there's a caption (not during "thinking")
  if (!currentCaption && !isSpeaking) return null;
  if (!currentCaption) return null;

  // Caption settings with fallbacks
  const captionFont = settings.caption?.font
    ? FONT_MAP[settings.caption.font as keyof typeof FONT_MAP] ?? FONT_MAP[settings.font]
    : FONT_MAP[settings.font];
  const captionColor = settings.caption?.color ?? '#ffffff';
  const captionSize = settings.caption?.size ?? 'base';

  const sizeMap: Record<string, string> = {
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
  };
  const fontSize = sizeMap[captionSize] ?? '1rem';

  const textShadow =
    '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, ' +
    '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, ' +
    '0 0 8px rgba(0,0,0,0.9)';

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-30 pointer-events-none">
      <div className="text-center">
        <p
          style={{
            fontFamily: captionFont,
            color: captionColor,
            fontSize,
            textShadow,
            lineHeight: 1.5,
            fontWeight: 700,
          }}
          className="leading-relaxed"
        >
          {isSpeaking && (
            <span
              className="inline-block w-2 h-4 rounded-sm mr-2 animate-pulse align-middle"
              style={{ background: captionColor }}
            />
          )}
          {currentCaption}
        </p>
      </div>
    </div>
  );
}
