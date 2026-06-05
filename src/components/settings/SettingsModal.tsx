'use client';
import { useState, useEffect } from 'react';
import { X, Save, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/store';
import { translations } from '@/lib/i18n';
import { GROQ_MODELS, GROQ_MODELS_URL, OPENROUTER_MODELS_URL } from '@/lib/llm';
import { ELEVENLABS_MODELS } from '@/lib/tts';

const TABS = ['general', 'llm', 'tts', 'twitch', 'gaming'] as const;
type Tab = typeof TABS[number];

const LLM_PROVIDERS = [
  { id: 'groq', name: 'Groq', hasKey: true },
  { id: 'xai', name: 'xAI (Grok)', hasKey: true },
  { id: 'gemini', name: 'Google Gemini / AI Studio', hasKey: true },
  { id: 'openai', name: 'OpenAI', hasKey: true },
  { id: 'fireworks', name: 'Fireworks AI', hasKey: true },
  { id: 'novelai', name: 'NovelAI (Kayra, Clio…)', hasKey: false, hasAuth: true },
  { id: 'openrouter', name: 'OpenRouter', hasKey: true },
  { id: 'perplexity', name: 'Perplexity AI', hasKey: true },
  { id: 'mistral', name: 'Mistral AI', hasKey: true },
  { id: 'localllama', name: 'Local (Ollama / LM Studio)', hasKey: false },
  { id: 'custom', name: 'Custom / ngrok API', hasKey: true, hasEndpoint: true },
];

const TTS_PROVIDERS = [
  { id: 'elevenlabs', name: 'ElevenLabs', hasKey: true },
  { id: 'fish', name: 'Fish Speech API', hasKey: true, hasEndpoint: true },
  { id: 'novelai', name: 'NovelAI TTS', hasKey: false, hasAuth: true },
  { id: 'azure', name: 'Azure TTS', hasKey: true },
  { id: 'google', name: 'Google Cloud TTS', hasKey: true },
  { id: 'cartesia', name: 'Cartesia', hasKey: true },
  { id: 'voicevox', name: 'VOICEVOX (Local)', hasKey: false, hasEndpoint: true },
  { id: 'aivis', name: 'Aivis Speech (Local)', hasKey: false, hasEndpoint: true },
  { id: 'custom', name: 'Custom API / ngrok / Colab', hasKey: true, hasEndpoint: true },
];

const NOVELAI_MODELS = ['kayra-v1', 'clio-v1', 'euterpe-v2', 'krake-v2'];
const NOVELAI_VOICES = ['Aini', 'Orea', 'Claea', 'Lim', 'Aurae', 'Naia', 'Ligeia', 'Thalia', 'Euphe'];

export default function SettingsModal() {
  const { settings, setSettings, settingsOpen, setSettingsOpen } = useStore();
  const t = translations[settings.language];
  const [tab, setTab] = useState<Tab>('general');
  const [local, setLocal] = useState(settings);
  const [showKey, setShowKey] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (settingsOpen) setLocal(settings); }, [settingsOpen]);

  if (!settingsOpen) return null;

  const save = () => { setSettings(local); setSettingsOpen(false); };
  const upd = (key: string, val: any) => setLocal((p: any) => ({ ...p, [key]: val }));
  const updLLM = (key: string, val: any) => setLocal((p: any) => ({ ...p, llm: { ...p.llm, [key]: val } }));
  const updTTS = (key: string, val: any) => setLocal((p: any) => ({ ...p, tts: { ...p.tts, [key]: val } }));
  const updTwitch = (key: string, val: any) => setLocal((p: any) => ({ ...p, twitch: { ...p.twitch, [key]: val } }));
  const updGaming = (key: string, val: any) => setLocal((p: any) => ({ ...p, gaming: { ...p.gaming, [key]: val } }));

  const llmProvider = LLM_PROVIDERS.find((p) => p.id === local.llm.provider);
  const ttsProvider = TTS_PROVIDERS.find((p) => p.id === local.tts.provider);

  const inputCls = 'w-full bg-dark-600 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-primary transition-colors';
  const labelCls = 'block text-xs text-gray-400 mb-1 uppercase tracking-wider';
  const sectionCls = 'space-y-3';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-slide-in">
      <div className="bg-dark-800 border border-dark-500 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-accent-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-500">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
            ⚙️ {t.settings}
          </h2>
          <button onClick={() => setSettingsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 overflow-x-auto">
          {TABS.map((tb) => (
            <button key={tb} onClick={() => setTab(tb)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${tab === tb ? 'bg-accent-primary text-white' : 'text-gray-400 hover:text-white hover:bg-dark-600'}`}>
              {t[tb as keyof typeof t] as string}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* GENERAL */}
          {tab === 'general' && (
            <div className={sectionCls}>
              <div>
                <label className={labelCls}>{t.vtuberName}</label>
                <input className={inputCls} value={local.vtuberName} onChange={(e) => upd('vtuberName', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>{t.systemPrompt}</label>
                <textarea className={inputCls + ' h-24 resize-none'} value={local.systemPrompt} onChange={(e) => upd('systemPrompt', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>{t.font}</label>
                <select className={inputCls} value={local.font} onChange={(e) => upd('font', e.target.value)}>
                  <option value="comic">Comic Sans MS (Default)</option>
                  <option value="arial">Arial</option>
                  <option value="montserrat">Montserrat</option>
                  <option value="verdana">Verdana</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>{t.language}</label>
                <select className={inputCls} value={local.language} onChange={(e) => upd('language', e.target.value)}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>{t.greenScreen}</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={local.greenScreenColor} onChange={(e) => upd('greenScreenColor', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                  <input className={inputCls} value={local.greenScreenColor} onChange={(e) => upd('greenScreenColor', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* LLM */}
          {tab === 'llm' && (
            <div className={sectionCls}>
              <div>
                <label className={labelCls}>{t.provider}</label>
                <select className={inputCls} value={local.llm.provider} onChange={(e) => updLLM('provider', e.target.value)}>
                  {LLM_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {llmProvider?.hasAuth && (
                <>
                  <div>
                    <label className={labelCls}>{t.email}</label>
                    <input className={inputCls} type="email" value={local.llm.email || ''} onChange={(e) => updLLM('email', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>{t.password}</label>
                    <div className="relative">
                      <input className={inputCls + ' pr-10'} type={showPass ? 'text' : 'password'} value={local.llm.password || ''} onChange={(e) => updLLM('password', e.target.value)} />
                      <button onClick={() => setShowPass((p) => !p)} className="absolute right-2 top-2 text-gray-400">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                  {local.llm.provider === 'novelai' && (
                    <div>
                      <label className={labelCls}>{t.model}</label>
                      <select className={inputCls} value={local.llm.model} onChange={(e) => updLLM('model', e.target.value)}>
                        {NOVELAI_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              {llmProvider?.hasKey && (
                <div>
                  <label className={labelCls}>{t.apiKey}</label>
                  <div className="relative">
                    <input className={inputCls + ' pr-10'} type={showKey ? 'text' : 'password'} value={local.llm.apiKey} onChange={(e) => updLLM('apiKey', e.target.value)} placeholder="sk-..." />
                    <button onClick={() => setShowKey((p) => !p)} className="absolute right-2 top-2 text-gray-400">{showKey ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
              )}

              {llmProvider?.hasEndpoint && (
                <div>
                  <label className={labelCls}>{t.customEndpoint}</label>
                  <input className={inputCls} placeholder="https://your-ngrok-url.ngrok.io" value={local.llm.customEndpoint || ''} onChange={(e) => updLLM('customEndpoint', e.target.value)} />
                </div>
              )}

              {!llmProvider?.hasAuth && local.llm.provider !== 'novelai' && (
                <div>
                  <label className={labelCls}>
                    {t.model}
                    {local.llm.provider === 'groq' && (
                      <a href={GROQ_MODELS_URL} target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> {t.browseModels}
                      </a>
                    )}
                    {local.llm.provider === 'openrouter' && (
                      <a href={OPENROUTER_MODELS_URL} target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> {t.browseModels}
                      </a>
                    )}
                    {local.llm.provider === 'gemini' && (
                      <a href="https://ai.google.dev/gemini-api/docs/models/gemini" target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> {t.browseModels}
                      </a>
                    )}
                    {local.llm.provider === 'openai' && (
                      <a href="https://platform.openai.com/docs/models" target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> {t.browseModels}
                      </a>
                    )}
                    {local.llm.provider === 'fireworks' && (
                      <a href="https://fireworks.ai/models" target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> {t.browseModels}
                      </a>
                    )}
                    {local.llm.provider === 'perplexity' && (
                      <a href="https://docs.perplexity.ai/guides/model-cards" target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> {t.browseModels}
                      </a>
                    )}
                    {local.llm.provider === 'mistral' && (
                      <a href="https://docs.mistral.ai/getting-started/models/models_overview/" target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> {t.browseModels}
                      </a>
                    )}
                    {local.llm.provider === 'xai' && (
                      <a href="https://docs.x.ai/docs/models" target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> {t.browseModels}
                      </a>
                    )}
                  </label>
                  {local.llm.provider === 'groq' ? (
                    <div className="space-y-1">
                      <input list="groq-models" className={inputCls} value={local.llm.model} onChange={(e) => updLLM('model', e.target.value)} placeholder="Type or select model..." />
                      <datalist id="groq-models">
                        {GROQ_MODELS.map((m) => <option key={m} value={m} />)}
                      </datalist>
                    </div>
                  ) : (
                    <input className={inputCls} value={local.llm.model} onChange={(e) => updLLM('model', e.target.value)} placeholder="e.g. gpt-4o, claude-3-opus..." />
                  )}
                </div>
              )}

              <div>
                <label className={labelCls}>{t.temperature}: {local.llm.temperature.toFixed(1)}</label>
                <input type="range" min="0" max="2" step="0.1" value={local.llm.temperature} onChange={(e) => updLLM('temperature', parseFloat(e.target.value))}
                  className="w-full accent-violet-500" />
              </div>
              <div>
                <label className={labelCls}>{t.maxTokens}</label>
                <input type="number" className={inputCls} value={local.llm.maxTokens} min={64} max={8192} onChange={(e) => updLLM('maxTokens', parseInt(e.target.value))} />
              </div>
            </div>
          )}

          {/* TTS */}
          {tab === 'tts' && (
            <div className={sectionCls}>
              <div>
                <label className={labelCls}>{t.provider}</label>
                <select className={inputCls} value={local.tts.provider} onChange={(e) => updTTS('provider', e.target.value)}>
                  {TTS_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {ttsProvider?.hasAuth && (
                <>
                  <div>
                    <label className={labelCls}>{t.email}</label>
                    <input className={inputCls} type="email" value={local.tts.email || ''} onChange={(e) => updTTS('email', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>{t.password}</label>
                    <input className={inputCls} type="password" value={local.tts.password || ''} onChange={(e) => updTTS('password', e.target.value)} />
                  </div>
                  {local.tts.provider === 'novelai' && (
                    <div>
                      <label className={labelCls}>{t.voice}</label>
                      <select className={inputCls} value={local.tts.voice} onChange={(e) => updTTS('voice', e.target.value)}>
                        {NOVELAI_VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              {ttsProvider?.hasKey && (
                <div>
                  <label className={labelCls}>{t.apiKey}</label>
                  <input className={inputCls} type="password" value={local.tts.apiKey} onChange={(e) => updTTS('apiKey', e.target.value)} />
                </div>
              )}

              {ttsProvider?.hasEndpoint && (
                <div>
                  <label className={labelCls}>{t.customEndpoint}</label>
                  <input className={inputCls} placeholder="http://localhost:50021" value={local.tts.customEndpoint || ''} onChange={(e) => updTTS('customEndpoint', e.target.value)} />
                </div>
              )}

              {local.tts.provider === 'elevenlabs' && (
                <>
                  <div>
                    <label className={labelCls}>
                      Model
                      <a href="https://elevenlabs.io/docs/api-reference/text-to-speech" target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> Docs
                      </a>
                    </label>
                    <select className={inputCls} value={local.tts.model} onChange={(e) => updTTS('model', e.target.value)}>
                      {ELEVENLABS_MODELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>
                      Voice ID
                      <a href="https://elevenlabs.io/voice-library" target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> Voice Library
                      </a>
                    </label>
                    <input className={inputCls} value={local.tts.voice} onChange={(e) => updTTS('voice', e.target.value)} placeholder="Voice ID..." />
                  </div>
                </>
              )}

              {(local.tts.provider === 'google' || local.tts.provider === 'azure') && (
                <div>
                  <label className={labelCls}>
                    {t.voice}
                    {local.tts.provider === 'google' && (
                      <a href="https://cloud.google.com/text-to-speech/docs/voices" target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> {t.browseModels}
                      </a>
                    )}
                    {local.tts.provider === 'azure' && (
                      <a href="https://speech.microsoft.com/portal" target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                        <ExternalLink size={12} /> Azure Portal
                      </a>
                    )}
                  </label>
                  <input className={inputCls} value={local.tts.voice} onChange={(e) => updTTS('voice', e.target.value)} />
                </div>
              )}

              {['fish', 'cartesia', 'custom'].includes(local.tts.provider) && (
                <div>
                  <label className={labelCls}>{t.voice} / Reference ID</label>
                  <input className={inputCls} value={local.tts.voice} onChange={(e) => updTTS('voice', e.target.value)} />
                </div>
              )}

              {['voicevox', 'aivis'].includes(local.tts.provider) && (
                <div>
                  <label className={labelCls}>Speaker ID (number)</label>
                  <input className={inputCls} value={local.tts.voice} onChange={(e) => updTTS('voice', e.target.value)} placeholder="0" />
                </div>
              )}

              <div>
                <label className={labelCls}>{t.speed}: {(local.tts.speed || 1).toFixed(1)}x</label>
                <input type="range" min="0.5" max="2" step="0.1" value={local.tts.speed || 1} onChange={(e) => updTTS('speed', parseFloat(e.target.value))}
                  className="w-full accent-violet-500" />
              </div>
            </div>
          )}

          {/* TWITCH */}
          {tab === 'twitch' && (
            <div className={sectionCls}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-violet-500" checked={local.twitch.enabled} onChange={(e) => updTwitch('enabled', e.target.checked)} />
                <span className="text-sm text-white">{t.enableTwitch}</span>
              </label>
              <div>
                <label className={labelCls}>{t.twitchChannel}</label>
                <input className={inputCls} value={local.twitch.channelName} onChange={(e) => updTwitch('channelName', e.target.value)} placeholder="your_channel" />
              </div>
              <div>
                <label className={labelCls}>
                  {t.twitchToken}
                  <a href="https://twitchtokengenerator.com" target="_blank" rel="noreferrer" className="ml-2 text-accent-secondary hover:underline inline-flex items-center gap-1">
                    <ExternalLink size={12} /> Get Token
                  </a>
                </label>
                <input className={inputCls} type="password" value={local.twitch.accessToken || ''} onChange={(e) => updTwitch('accessToken', e.target.value)} placeholder="oauth:..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-violet-500" checked={local.twitch.showOverlay} onChange={(e) => updTwitch('showOverlay', e.target.checked)} />
                <span className="text-sm text-white">{t.showOverlay}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-violet-500" checked={local.twitch.showEmoteWall} onChange={(e) => updTwitch('showEmoteWall', e.target.checked)} />
                <span className="text-sm text-white">{t.showEmoteWall}</span>
              </label>
            </div>
          )}

          {/* GAMING */}
          {tab === 'gaming' && (
            <div className={sectionCls}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-violet-500" checked={local.gaming.enabled} onChange={(e) => updGaming('enabled', e.target.checked)} />
                <span className="text-sm text-white">{t.enableGaming}</span>
              </label>
              <div>
                <label className={labelCls}>Source Mode</label>
                <div className="flex gap-2">
                  {(['screen-share', 'vdo-ninja'] as const).map((m) => (
                    <button key={m} onClick={() => updGaming('mode', m)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${local.gaming.mode === m ? 'bg-accent-primary text-white' : 'bg-dark-600 text-gray-400'}`}>
                      {m === 'screen-share' ? '🖥 ' + t.screenShare : '🎥 ' + t.vdoNinja}
                    </button>
                  ))}
                </div>
              </div>
              {local.gaming.mode === 'vdo-ninja' && (
                <div>
                  <label className={labelCls}>{t.vdoCode}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">https://vdo.ninja/?view=</span>
                    <input className={inputCls} value={local.gaming.vdoCode} onChange={(e) => updGaming('vdoCode', e.target.value)} placeholder="your-room-code" />
                  </div>
                  {local.gaming.vdoCode && (
                    <a href={`https://vdo.ninja/?view=${local.gaming.vdoCode}`} target="_blank" rel="noreferrer" className="text-xs text-accent-secondary hover:underline mt-1 flex items-center gap-1">
                      <ExternalLink size={10} /> Open VDO Ninja
                    </a>
                  )}
                </div>
              )}
              <div>
                <label className={labelCls}>{t.characterPos}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const).map((pos) => (
                    <button key={pos} onClick={() => updGaming('characterPosition', pos)}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${local.gaming.characterPosition === pos ? 'bg-accent-primary text-white' : 'bg-dark-600 text-gray-400'}`}>
                      {pos.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-500">
          <button onClick={() => setSettingsOpen(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
            {t.close}
          </button>
          <button onClick={save} className="px-6 py-2 rounded-lg text-sm bg-accent-primary hover:bg-violet-500 text-white font-medium transition-all flex items-center gap-2">
            <Save size={14} /> {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
