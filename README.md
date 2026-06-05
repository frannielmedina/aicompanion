# 🤖 AI Companion — VTuber Program

A full-featured AI VTuber application with 3D character, multi-provider LLM support, TTS, Twitch integration, and gaming mode.

## ✨ Features

- **3D Anime VTuber** — Custom Three.js character with idle animation, blinking, floating, and real-time lip sync
- **Green Screen** — Configurable background color for OBS/streaming
- **11+ LLM Providers** — Groq, xAI, Gemini, OpenAI, Fireworks AI, NovelAI, OpenRouter, Perplexity, Mistral, Local (Ollama), Custom API
- **9+ TTS Providers** — ElevenLabs, Fish Speech, NovelAI TTS, Azure TTS, Google Cloud TTS, Cartesia, VOICEVOX, Aivis Speech, Custom API
- **Twitch Integration** — Live chat overlay, emote wall, animated emote particles
- **Gaming Mode** — Screen share or VDO Ninja with character-in-corner overlay
- **i18n** — English & Spanish UI + captions
- **Font System** — Comic Sans MS (default), Arial, Montserrat, Verdana (applied to both UI and captions)
- **Dark Theme** — Full dark UI with purple accents
- **Persistent Settings** — Saved to localStorage

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## ⚙️ Setup

1. Click the **Settings** (⚙️) button in the top bar
2. **General** tab: Set VTuber name, system prompt, font, language, green screen color
3. **LLM** tab: Choose a provider, enter API key, set model, temperature, tokens
4. **TTS** tab: Choose a TTS provider and configure voice
5. **Twitch** tab (optional): Enable and enter channel name + OAuth token
6. **Gaming** tab (optional): Enable gaming mode, choose screen share or VDO Ninja
7. Click **Save**

## 🎙️ LLM Providers

| Provider | Notes |
|----------|-------|
| Groq | Fast inference, includes model dropdown + link to docs |
| xAI | Grok models |
| Google Gemini | gemini-1.5-flash, etc. |
| OpenAI | GPT-4o, o1, etc. |
| Fireworks AI | Open-source models |
| NovelAI | Kayra, Clio — uses email + password |
| OpenRouter | Any model — type model ID + link to full list |
| Perplexity | Sonar models with web search |
| Mistral | Mistral Large, etc. |
| Local (Ollama) | localhost:11434 |
| Custom API | Any OpenAI-compatible endpoint (ngrok, etc.) |

## 🔊 TTS Providers

| Provider | Notes |
|----------|-------|
| ElevenLabs | Monolingual, Flash 2.5, Turbo 2.5, Turbo 2.0, Multilingual v2, v3 |
| Fish Speech | Local or remote API |
| NovelAI TTS | Email + password |
| Azure TTS | Region-aware via `region\|VoiceName` format |
| Google Cloud TTS | Neural voices |
| Cartesia | Sonic-English |
| VOICEVOX | Local Japanese TTS |
| Aivis Speech | Local Japanese TTS |
| Custom | Works with Kaggle/Colab: Qwen3 TTS, Fish Speech S2 Pro, IndexTTS, GPT-SoVITS, etc. |

## 📺 Twitch

1. Get OAuth token: https://twitchtokengenerator.com
2. Enter channel name and token in Settings → Twitch
3. Chat messages appear top-left with username colors and emotes
4. Emotes float up the screen for 30 seconds

## 🎮 Gaming Mode

**Screen Share:**
- Enable gaming mode in settings
- Choose "Screen Share" and click the Share Screen button

**VDO Ninja:**
- Get a room code from https://vdo.ninja
- Enter the code in settings (URL auto-prefixed with `https://vdo.ninja/?view=`)
- Choose character corner position

## 🟩 Green Screen for OBS

Set the green screen color in Settings → General. In OBS:
1. Add Browser Source or Window Capture of the app
2. Add a **Chroma Key** filter matching your chosen color
3. The character floats over any background!

## 🌍 Translations

- English (default) and Spanish
- Changing language affects both UI and caption font
- Setting the font applies everywhere including captions

## 📦 Tech Stack

- **Next.js 14** + TypeScript
- **Three.js** + @react-three/fiber — 3D character
- **Tailwind CSS** — Styling
- **Zustand** — State management with localStorage persistence
- **Framer Motion** — Animations
- Vanilla WebSocket — Twitch IRC
