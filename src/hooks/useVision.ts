'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import { captureFrame, callVisionLLM } from '@/lib/vision';
import { callLLM } from '@/lib/llm';
import { synthesizeSpeech, playAudioBuffer } from '@/lib/tts';

interface VisionHookOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

function stripThinkTags(text: string): string {
  let result = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  result = result.replace(/<think>[\s\S]*/gi, '');
  return result.trim();
}

export function useVision({ videoRef, iframeRef }: VisionHookOptions) {
  const {
    settings,
    setLastVisionDescription,
    setIsSpeaking,
    setIsThinking,
    setCurrentCaption,
    addChat,
    chatHistory,
    isSpeaking,
    isThinking,
  } = useStore();

  const { vision, llm, tts, systemPrompt } = settings;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);

  const runVisionCycle = useCallback(async () => {
    if (busyRef.current || isSpeaking || isThinking) return;
    if (!vision.enabled || !vision.apiKey) return;

    busyRef.current = true;

    try {
      // 1. Capture frame
      const imageB64 = await captureFrame(
        videoRef.current ?? null,
        iframeRef.current ?? null,
      );
      if (!imageB64) {
        busyRef.current = false;
        return;
      }

      // 2. Vision LLM → short description
      const description = await callVisionLLM(vision, imageB64);
      if (!description.trim()) {
        busyRef.current = false;
        return;
      }

      setLastVisionDescription(description);

      // 3. Pass description to main LLM (if enabled)
      if (vision.passToMainLLM) {
        const visionContext = `[Game screen description: ${description}]`;
        const syntheticUserMsg = {
          role: 'user' as const,
          content: visionContext,
        };

        setIsThinking(true);
        setCurrentCaption('');

        const raw = await callLLM(
          llm,
          [...chatHistory, syntheticUserMsg],
          systemPrompt,
        );
        const response = stripThinkTags(raw);

        addChat({ role: 'user', content: visionContext });
        addChat({ role: 'assistant', content: response });
        setIsThinking(false);
        setCurrentCaption(response);

        // 4. TTS
        if (tts.apiKey || tts.provider === 'voicevox' || tts.provider === 'aivis' || tts.email) {
          setIsSpeaking(true);
          try {
            const audio = await synthesizeSpeech(tts, response);
            if (audio) await playAudioBuffer(audio);
          } catch (e) {
            console.error('Vision TTS error:', e);
          }
          setIsSpeaking(false);
        }

        setTimeout(() => setCurrentCaption(''), 8000);
      }
    } catch (e) {
      console.error('Vision cycle error:', e);
    }

    busyRef.current = false;
  }, [vision, llm, tts, systemPrompt, chatHistory, isSpeaking, isThinking]);

  useEffect(() => {
    if (!vision.enabled || !settings.gaming.enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = Math.max(5, vision.intervalSeconds) * 1000;
    timerRef.current = setInterval(runVisionCycle, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [vision.enabled, vision.intervalSeconds, settings.gaming.enabled, runVisionCycle]);
}
