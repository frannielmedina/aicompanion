import type { VisionConfig } from '@/store';

/**
 * Capture a frame from a video element or iframe (via canvas) and return base64 JPEG.
 * For iframes (VDO Ninja) we can only capture if same-origin; otherwise we fall back
 * to a blank signal. Screen-share MediaStream works perfectly via <video>.
 */
export async function captureFrame(
  videoEl: HTMLVideoElement | null,
  iframeEl: HTMLIFrameElement | null,
  width = 640,
  height = 360,
): Promise<string | null> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (videoEl && videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
    ctx.drawImage(videoEl, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
  }

  if (iframeEl) {
    // Try to grab the iframe's video element (works when same-origin or
    // when the browser allows it; VDO Ninja is cross-origin so this is
    // best-effort; we draw a placeholder so the LLM at least sees *something*)
    try {
      const iframeDoc = iframeEl.contentDocument || iframeEl.contentWindow?.document;
      const vid = iframeDoc?.querySelector('video') as HTMLVideoElement | null;
      if (vid && vid.readyState >= 2 && vid.videoWidth > 0) {
        ctx.drawImage(vid, 0, 0, width, height);
        return canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      }
    } catch {
      // cross-origin — silently fail
    }
    // Fallback: draw a dark rect so we don't send null; the LLM prompt will
    // handle the "no image" case gracefully.
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#555';
    ctx.font = '16px sans-serif';
    ctx.fillText('VDO Ninja stream (cross-origin)', 20, height / 2);
    return canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
  }

  return null;
}

/** Call a vision-capable LLM with a base64 image and return its text description. */
export async function callVisionLLM(
  config: VisionConfig,
  imageBase64: string,
): Promise<string> {
  const { provider, model, apiKey, customEndpoint, systemPrompt } = config;

  const userMessage = {
    role: 'user' as const,
    content: [
      {
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
      },
      { type: 'text', text: 'Describe what you see on this game stream screenshot.' },
    ],
  };

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      userMessage,
    ],
    max_tokens: 200,
    temperature: 0.4,
  };

  let url: string;
  let headers: Record<string, string> = { 'Content-Type': 'application/json' };

  switch (provider) {
    case 'groq':
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      break;
    case 'openai':
      url = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      break;
    case 'openrouter':
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      break;
    case 'gemini': {
      // Gemini uses a different format — translate
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiBody = {
        contents: [
          {
            role: 'user',
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
              { text: 'Describe what you see on this game stream screenshot.' },
            ],
          },
        ],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 200, temperature: 0.4 },
      };
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      });
      if (!res.ok) throw new Error(`Gemini vision error ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }
    case 'custom':
      url = (customEndpoint || 'http://localhost:8000') + '/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey || 'none'}`;
      break;
    default:
      // fallback to openai-compat
      url = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Vision LLM ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export const VISION_GROQ_MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
];

export const VISION_OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
];

export const VISION_OPENROUTER_MODELS = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'anthropic/claude-3-5-sonnet',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-4-scout:free',
  'qwen/qwen2.5-vl-72b-instruct:free',
];
