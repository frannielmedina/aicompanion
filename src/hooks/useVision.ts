'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import { captureFrame, callVisionLLM } from '@/lib/vision';
import { callLLM } from '@/lib/llm';
import { synthesizeSpeech, playAudioBuffer } from '@/lib/tts';
import { parseExpression, EXPRESSION_SYSTEM_PROMPT_ADDITION } from '@/lib/expression';

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
    setCurrentExpression,
    addChat,
  } = useStore();

  const busyRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isThinkingRef = useRef(false);
  const chatHistoryRef = useRef(useStore.getState().chatHistory);
  const settingsRef = useRef(settings);

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
      const imageB64 = await captureFrame(
        videoRef.current ?? null,
        iframeRef.current ?? null,
      );

      if (!imageB64) {
        busyRef.current = false;
        return;
      }

      const description = await callVisionLLM(s.vision, imageB64);
      if (!description.trim()) {
        busyRef.current = false;
        return;
      }

      setLastVisionDescription(description);

      if (s.vision.passToMainLLM) {
        const visionContext = `[Game screen description: ${description}]`;
        const syntheticUserMsg = { role: 'user' as const, content: visionContext };
        const augmentedSystemPrompt = s.systemPrompt + EXPRESSION_SYSTEM_PROMPT_ADDITION;

        setIsThinking(true);
        setCurrentCaption('');

        const raw = await callLLM(
          s.llm,
          [...chatHistoryRef.current, syntheticUserMsg],
          augmentedSystemPrompt,
        );
        const stripped = stripThinkTags(raw);
        const { expression, cleanText } = parseExpression(stripped);

        addChat({ role: 'user', content: visionContext });
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
            console.error('Vision TTS error:', e);
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
      }
    } catch (e) {
      console.error('Vision cycle error:', e);
      setIsThinking(false);
      setIsSpeaking(false);
    }

    busyRef.current = false;
  }, [addChat, setIsSpeaking, setIsThinking, setCurrentCaption, setCurrentExpression, setLastVisionDescription, videoRef, iframeRef]);

  useEffect(() => {
    const { vision, gaming } = settings;

    if (!vision.enabled || !gaming.enabled) {
      return;
    }

    const intervalMs = Math.max(5, vision.intervalSeconds) * 1000;

    const firstRun = setTimeout(() => { runVisionCycle(); }, 2000);
    const interval = setInterval(runVisionCycle, intervalMs);

    return () => {
      clearTimeout(firstRun);
      clearInterval(interval);
    };
  }, [settings.vision.enabled, settings.vision.intervalSeconds, settings.gaming.enabled, runVisionCycle]);
}
