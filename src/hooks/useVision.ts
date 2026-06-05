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
  } = useStore();

  // Use refs for fast-changing state to avoid stale closures in the interval
  const busyRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isThinkingRef = useRef(false);
  const chatHistoryRef = useRef(useStore.getState().chatHistory);
  const settingsRef = useRef(settings);

  // Keep refs up to date
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    return useStore.subscribe((state) => {
      isSpeakingRef.current = state.isSpeaking;
      isThinkingRef.current = state.isThinking;
      chatHistoryRef.current = state.chatHistory;
    });
  }, []);

  const runVisionCycle = useCallback(async () => {
    if (busyRef.current) return;
    if (isSpeakingRef.current || isThinkingRef.current) return;

    const s = settingsRef.current;
    if (!s.vision.enabled || !s.gaming.enabled) return;
    if (!s.vision.apiKey) return;

    busyRef.current = true;

    try {
      // 1. Capture frame from video or iframe
      const imageB64 = await captureFrame(
        videoRef.current ?? null,
        iframeRef.current ?? null,
      );

      if (!imageB64) {
        busyRef.current = false;
        return;
      }

      // 2. Vision LLM → short description
      const description = await callVisionLLM(s.vision, imageB64);
      if (!description.trim()) {
        busyRef.current = false;
        return;
      }

      setLastVisionDescription(description);

      // 3. Pass description to main LLM (if enabled)
      if (s.vision.passToMainLLM) {
        const visionContext = `[Game screen description: ${description}]`;
        const syntheticUserMsg = { role: 'user' as const, content: visionContext };

        setIsThinking(true);
        setCurrentCaption('');

        const raw = await callLLM(
          s.llm,
          [...chatHistoryRef.current, syntheticUserMsg],
          s.systemPrompt,
        );
        const response = stripThinkTags(raw);

        addChat({ role: 'user', content: visionContext });
        addChat({ role: 'assistant', content: response });
        setIsThinking(false);
        setCurrentCaption(response);

        // 4. TTS
        if (s.tts.apiKey || s.tts.provider === 'voicevox' || s.tts.provider === 'aivis' || s.tts.email) {
          setIsSpeaking(true);
          try {
            const audio = await synthesizeSpeech(s.tts, response);
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
      setIsThinking(false);
      setIsSpeaking(false);
    }

    busyRef.current = false;
  }, [addChat, setIsSpeaking, setIsThinking, setCurrentCaption, setLastVisionDescription, videoRef, iframeRef]);

  useEffect(() => {
    const { vision, gaming } = settings;

    if (!vision.enabled || !gaming.enabled) {
      return;
    }

    const intervalMs = Math.max(5, vision.intervalSeconds) * 1000;

    // Run immediately on mount so we don't wait the full interval first
    const firstRun = setTimeout(() => { runVisionCycle(); }, 2000);
    const interval = setInterval(runVisionCycle, intervalMs);

    return () => {
      clearTimeout(firstRun);
      clearInterval(interval);
    };
  }, [settings.vision.enabled, settings.vision.intervalSeconds, settings.gaming.enabled, runVisionCycle]);
}
