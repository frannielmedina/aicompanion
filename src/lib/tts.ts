import type { TTSConfig } from '@/store';

export async function synthesizeSpeech(config: TTSConfig, text: string): Promise<ArrayBuffer | null> {
  const { provider, apiKey, voice, model, customEndpoint, email, password, speed } = config;

  switch (provider) {
    case 'elevenlabs':
      return callElevenLabs(apiKey, voice, model || 'eleven_flash_v2_5', text, speed || 1.0);
    case 'fish':
      return callFishSpeech(apiKey, voice, text, customEndpoint);
    case 'azure':
      return callAzureTTS(apiKey, voice, text);
    case 'google':
      return callGoogleTTS(apiKey, voice, text, speed || 1.0);
    case 'cartesia':
      return callCartesia(apiKey, voice, text, speed || 1.0);
    case 'voicevox':
      return callVoiceVox(voice, text, customEndpoint || 'http://localhost:50021');
    case 'aivis':
      return callAivisSpeech(voice, text, customEndpoint || 'http://localhost:10101');
    case 'novelai':
      return callNovelAITTS(email || '', password || '', voice, text);
    case 'custom':
      return callCustomTTS(customEndpoint || '', apiKey, voice, text);
    default:
      throw new Error(`Unknown TTS provider: ${provider}`);
  }
}

async function callElevenLabs(apiKey: string, voiceId: string, model: string, text: string, speed: number): Promise<ArrayBuffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text, model_id: model,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, speed },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs Error ${res.status}`);
  return res.arrayBuffer();
}

async function callFishSpeech(apiKey: string, voice: string, text: string, endpoint?: string): Promise<ArrayBuffer> {
  const url = endpoint || 'https://api.fish.audio/v1/tts';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ text, reference_id: voice, format: 'mp3', mp3_bitrate: 128 }),
  });
  if (!res.ok) throw new Error(`Fish Speech Error ${res.status}`);
  return res.arrayBuffer();
}

async function callAzureTTS(apiKey: string, voice: string, text: string): Promise<ArrayBuffer> {
  const region = voice.split('|')[0] || 'eastus';
  const voiceName = voice.split('|')[1] || voice;
  const ssml = `<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='${voiceName}'>${text}</voice></speak>`;
  const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`Azure TTS Error ${res.status}`);
  return res.arrayBuffer();
}

async function callGoogleTTS(apiKey: string, voice: string, text: string, speed: number): Promise<ArrayBuffer> {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'en-US', name: voice || 'en-US-Neural2-F' },
      audioConfig: { audioEncoding: 'MP3', speakingRate: speed },
    }),
  });
  if (!res.ok) throw new Error(`Google TTS Error ${res.status}`);
  const data = await res.json();
  const bin = atob(data.audioContent);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function callCartesia(apiKey: string, voice: string, text: string, speed: number): Promise<ArrayBuffer> {
  const res = await fetch('https://api.cartesia.ai/tts/bytes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'Cartesia-Version': '2024-06-10' },
    body: JSON.stringify({
      transcript: text,
      model_id: 'sonic-english',
      voice: { mode: 'id', id: voice },
      output_format: { container: 'mp3', encoding: 'mp3', sample_rate: 44100 },
      speed,
    }),
  });
  if (!res.ok) throw new Error(`Cartesia Error ${res.status}`);
  return res.arrayBuffer();
}

async function callVoiceVox(speaker: string, text: string, endpoint: string): Promise<ArrayBuffer> {
  const queryRes = await fetch(`${endpoint}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`, { method: 'POST' });
  if (!queryRes.ok) throw new Error('VoiceVox query failed');
  const query = await queryRes.json();
  const synthRes = await fetch(`${endpoint}/synthesis?speaker=${speaker}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!synthRes.ok) throw new Error('VoiceVox synthesis failed');
  return synthRes.arrayBuffer();
}

async function callAivisSpeech(speaker: string, text: string, endpoint: string): Promise<ArrayBuffer> {
  const queryRes = await fetch(`${endpoint}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`, { method: 'POST' });
  if (!queryRes.ok) throw new Error('Aivis query failed');
  const query = await queryRes.json();
  const synthRes = await fetch(`${endpoint}/synthesis?speaker=${speaker}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!synthRes.ok) throw new Error('Aivis synthesis failed');
  return synthRes.arrayBuffer();
}

async function callNovelAITTS(email: string, password: string, voice: string, text: string): Promise<ArrayBuffer> {
  const authRes = await fetch('https://api.novelai.net/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: password }),
  });
  if (!authRes.ok) throw new Error('NovelAI auth failed');
  const { accessToken } = await authRes.json();
  const res = await fetch('https://api.novelai.net/ai/generate-voice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({ text, voice: voice || 'Aini', seed: -1, opus: false, version: 'v2' }),
  });
  if (!res.ok) throw new Error(`NovelAI TTS Error ${res.status}`);
  return res.arrayBuffer();
}

/**
 * Custom TTS — supports the Chatterbox ngrok/Colab server format.
 *
 * The Chatterbox bridge server exposes:
 *   POST <base_url>/tts   { text, language?, exaggeration?, cfg_weight?, auto_emotion? }
 *   → raw WAV bytes (Content-Type: audio/wav)
 *
 * The user pastes the base ngrok URL (e.g. https://xxxx.ngrok-free.app) into the
 * "Custom Endpoint URL" field — we append /tts ourselves.
 *
 * The "Voice / Reference ID" field is ignored by Chatterbox (reference audio is
 * configured server-side), but we accept it as an optional language override
 * (e.g. "en", "es") so the user can control language from the UI.
 */
async function callCustomTTS(
  endpoint: string,
  apiKey: string,
  voice: string,
  text: string,
): Promise<ArrayBuffer> {
  // Strip trailing slash so we can reliably append /tts
  const base = endpoint.replace(/\/+$/, '');

  // Decide the target URL:
  // If the user already typed a full path ending in /tts (or /tts/), use as-is.
  // Otherwise append /tts — this handles the common case of pasting the bare ngrok URL.
  const url = /\/tts\/?$/.test(base) ? base : `${base}/tts`;

  // Build request body — Chatterbox format
  // "voice" field is re-used as language code if it looks like a BCP-47 tag (2-3 chars)
  const isLangCode = voice && /^[a-z]{2,3}(-[A-Z]{2})?$/.test(voice.trim());
  const body: Record<string, unknown> = {
    text,
    auto_emotion: true,
  };
  if (isLangCode) body.language = voice.trim();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // ngrok free tier requires this header to bypass the browser-warning page
    'ngrok-skip-browser-warning': 'true',
  };
  // Only add Authorization if an API key was actually provided
  if (apiKey && apiKey.trim() && apiKey.trim().toLowerCase() !== 'none') {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Custom TTS Error ${res.status}${errText ? ': ' + errText.slice(0, 200) : ''}`);
  }

  return res.arrayBuffer();
}

export function playAudioBuffer(buffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    // Guard against SSR and browsers where AudioContext is unavailable
    if (typeof window === 'undefined') { resolve(); return; }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      console.warn('AudioContext not available in this browser');
      resolve();
      return;
    }

    let ctx: AudioContext;
    try {
      ctx = new AudioCtx();
    } catch (e) {
      console.warn('Failed to create AudioContext:', e);
      resolve();
      return;
    }

    // Firefox requires a user-gesture to resume AudioContext
    const resume = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();

    resume.then(() => {
      ctx.decodeAudioData(
        buffer,
        (decoded) => {
          const source = ctx.createBufferSource();
          source.buffer = decoded;
          source.connect(ctx.destination);
          source.start(0);
          source.onended = () => { ctx.close(); resolve(); };
        },
        (err) => { ctx.close(); reject(err); },
      );
    }).catch((err) => { ctx.close(); reject(err); });
  });
}

export const ELEVENLABS_MODELS = [
  { id: 'eleven_monolingual_v1', name: 'Monolingual v1' },
  { id: 'eleven_flash_v2_5', name: 'Flash v2.5' },
  { id: 'eleven_turbo_v2_5', name: 'Turbo v2.5' },
  { id: 'eleven_turbo_v2', name: 'Turbo v2' },
  { id: 'eleven_multilingual_v2', name: 'Multilingual v2' },
  { id: 'eleven_v3', name: 'Eleven v3' },
];
