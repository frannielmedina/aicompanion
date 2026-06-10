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
      return callCustomTTS(customEndpoint || '', apiKey, voice, text, speed || 1.0);
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
  if (!res.ok) throw new Error(`ElevenLabs Error ${res.status}: ${await res.text()}`);
  return res.arrayBuffer();
}

async function callFishSpeech(apiKey: string, voice: string, text: string, endpoint?: string): Promise<ArrayBuffer> {
  const url = endpoint || 'https://api.fish.audio/v1/tts';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ text, reference_id: voice, format: 'mp3', mp3_bitrate: 128 }),
  });
  if (!res.ok) throw new Error(`Fish Speech Error ${res.status}: ${await res.text()}`);
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
  if (!res.ok) throw new Error(`Azure TTS Error ${res.status}: ${await res.text()}`);
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
  if (!res.ok) throw new Error(`Google TTS Error ${res.status}: ${await res.text()}`);
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
  if (!res.ok) throw new Error(`Cartesia Error ${res.status}: ${await res.text()}`);
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
  if (!res.ok) throw new Error(`NovelAI TTS Error ${res.status}: ${await res.text()}`);
  return res.arrayBuffer();
}

/**
 * Custom / Remote TTS — works with Kaggle/Colab servers:
 *
 *   Qwen3-TTS      → POST /tts  { text, speaker }
 *   GPT-SoVITS     → POST /tts  { text, language }
 *   Fish S2 Pro    → POST /tts  { text }
 *   IndexTTS       → POST /tts  { text }
 *   Chatterbox     → POST /tts  { text, auto_emotion, language? }
 *   Any OpenAI TTS → POST /tts  { text }
 *
 * The "Voice / Reference ID" settings field is sent as:
 *   - speaker name  if it looks like a name  (e.g. "Vivian", "speaker_0")
 *   - language code if it looks like one     (e.g. "en", "zh", "ja", "en-US")
 *
 * Paste your bare ngrok URL — /tts is appended automatically.
 */
async function callCustomTTS(
  endpoint: string,
  apiKey: string,
  voice: string,
  text: string,
  speed: number,
): Promise<ArrayBuffer> {
  if (!endpoint || !endpoint.trim()) {
    throw new Error('Custom TTS: no endpoint URL configured. Paste your ngrok URL in Settings → TTS → Custom Endpoint URL.');
  }

  const base = endpoint.trim().replace(/\/+$/, '');

  // Append /tts only if the URL has no path beyond the hostname
  let url: string;
  try {
    const parsed = new URL(base);
    url = (parsed.pathname === '/' || parsed.pathname === '')
      ? `${base}/tts`
      : base;
  } catch {
    url = `${base}/tts`;
  }

  // Determine whether the voice field is a language code or a speaker name.
  // Language codes: 2-3 alpha chars, optionally followed by -XX  (en, zh, ja, en-US, zh-CN)
  // Speaker names: anything else                                   (Vivian, speaker_0, …)
  const trimmedVoice = (voice || '').trim();
  const isLangCode = /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/.test(trimmedVoice);

  // Build a body compatible with the widest range of remote TTS servers.
  // We include BOTH speaker and language when possible — servers ignore what they don't use.
  const body: Record<string, unknown> = { text };

  if (trimmedVoice) {
    if (isLangCode) {
      body.language = trimmedVoice;
      // Chatterbox also accepts language this way
      body.auto_emotion = true;
    } else {
      // Qwen3-TTS uses "speaker"; GPT-SoVITS bridges often use "speaker" too
      body.speaker = trimmedVoice;
    }
  }

  // Only include speed if meaningful — most servers don't support it
  if (speed && speed !== 1.0) {
    body.speed = speed;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Bypass ngrok's browser-warning interstitial page
    'ngrok-skip-browser-warning': 'true',
    'User-Agent': 'Mozilla/5.0 (compatible; AI-Companion/1.0)',
  };

  // Only add Authorization when the user actually configured a key
  const trimmedKey = (apiKey || '').trim();
  if (trimmedKey && trimmedKey.toLowerCase() !== 'none') {
    headers['Authorization'] = `Bearer ${trimmedKey}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (networkErr: any) {
    throw new Error(
      `Custom TTS network error — could not reach ${url}.\n` +
      `Make sure the ngrok tunnel is running and the URL is correct.\n` +
      `Details: ${networkErr.message}`
    );
  }

  if (!res.ok) {
    let errBody = '';
    try { errBody = await res.text(); } catch {}
    throw new Error(
      `Custom TTS HTTP ${res.status} from ${url}` +
      (errBody ? `\n${errBody.slice(0, 400)}` : '')
    );
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const buffer = await res.arrayBuffer();

  if (buffer.byteLength === 0) {
    throw new Error(`Custom TTS: server at ${url} returned an empty response.`);
  }

  // If the server returned HTML (e.g. ngrok warning page leaked through despite the header),
  // surface a useful error instead of passing garbage to AudioContext.decodeAudioData.
  if (contentType.includes('text/html')) {
    const preview = new TextDecoder().decode(buffer.slice(0, 300));
    throw new Error(
      `Custom TTS: got an HTML page instead of audio from ${url}.\n` +
      `This usually means the ngrok-skip-browser-warning header was ignored.\n` +
      `Try opening the URL directly in a browser tab first.\n` +
      `Preview: ${preview}`
    );
  }

  return buffer;
}

export function playAudioBuffer(buffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
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
        (err) => {
          ctx.close();
          reject(new Error(
            `AudioContext failed to decode the audio buffer. ` +
            `The server may have returned a non-audio response. Details: ${err}`
          ));
        },
      );
    }).catch((err) => { ctx.close(); reject(err); });
  });
}

export const ELEVENLABS_MODELS = [
  { id: 'eleven_monolingual_v1', name: 'Monolingual v1' },
  { id: 'eleven_flash_v2_5',     name: 'Flash v2.5' },
  { id: 'eleven_turbo_v2_5',     name: 'Turbo v2.5' },
  { id: 'eleven_turbo_v2',       name: 'Turbo v2' },
  { id: 'eleven_multilingual_v2', name: 'Multilingual v2' },
  { id: 'eleven_v3',             name: 'Eleven v3' },
];
