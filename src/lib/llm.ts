import type { LLMConfig } from '@/store';

interface Message { role: 'user' | 'assistant' | 'system'; content: string; }

export async function callLLM(config: LLMConfig, messages: Message[], systemPrompt: string): Promise<string> {
  const { provider, model, apiKey, temperature, maxTokens, customEndpoint, email, password } = config;
  const msgs = [{ role: 'system' as const, content: systemPrompt }, ...messages];

  switch (provider) {
    case 'groq':
      return callOpenAICompat('https://api.groq.com/openai/v1/chat/completions', apiKey, model, msgs, temperature, maxTokens);
    case 'xai':
      return callOpenAICompat('https://api.x.ai/v1/chat/completions', apiKey, model || 'grok-beta', msgs, temperature, maxTokens);
    case 'openai':
      return callOpenAICompat('https://api.openai.com/v1/chat/completions', apiKey, model || 'gpt-4o', msgs, temperature, maxTokens);
    case 'fireworks':
      return callOpenAICompat('https://api.fireworks.ai/inference/v1/chat/completions', apiKey, model, msgs, temperature, maxTokens);
    case 'openrouter':
      return callOpenAICompat('https://openrouter.ai/api/v1/chat/completions', apiKey, model, msgs, temperature, maxTokens);
    case 'perplexity':
      return callOpenAICompat('https://api.perplexity.ai/chat/completions', apiKey, model || 'llama-3.1-sonar-large-128k-online', msgs, temperature, maxTokens);
    case 'mistral':
      return callOpenAICompat('https://api.mistral.ai/v1/chat/completions', apiKey, model || 'mistral-large-latest', msgs, temperature, maxTokens);
    case 'gemini':
      return callGemini(apiKey, model || 'gemini-1.5-flash', msgs, temperature, maxTokens);
    case 'novelai':
      return callNovelAI(email || '', password || '', model || 'kayra-v1', messages[messages.length - 1]?.content || '', temperature, maxTokens);
    case 'localllama':
      return callOpenAICompat('http://localhost:11434/v1/chat/completions', 'ollama', model || 'llama3', msgs, temperature, maxTokens);
    case 'custom':
      return callOpenAICompat(customEndpoint || 'http://localhost:8000/v1/chat/completions', apiKey || 'none', model, msgs, temperature, maxTokens);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

async function callOpenAICompat(url: string, apiKey: string, model: string, messages: Message[], temperature: number, maxTokens: number): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM Error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(apiKey: string, model: string, messages: Message[], temperature: number, maxTokens: number): Promise<string> {
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const systemMsg = messages.find((m) => m.role === 'system');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) throw new Error(`Gemini Error ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callNovelAI(email: string, password: string, model: string, prompt: string, temperature: number, maxTokens: number): Promise<string> {
  // Get token first
  const authRes = await fetch('https://api.novelai.net/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: password }), // NAI uses access key
  });
  if (!authRes.ok) throw new Error('NovelAI auth failed');
  const { accessToken } = await authRes.json();

  const res = await fetch('https://api.novelai.net/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({ input: prompt, model, parameters: { max_new_tokens: maxTokens, temperature } }),
  });
  if (!res.ok) throw new Error(`NovelAI Error ${res.status}`);
  const data = await res.json();
  return data.output || '';
}

// Model lists for quick reference
export const GROQ_MODELS = [
  'llama3-70b-8192', 'llama3-8b-8192', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant',
  'mixtral-8x7b-32768', 'gemma2-9b-it', 'gemma-7b-it', 'llama-3.3-70b-versatile',
  'deepseek-r1-distill-llama-70b', 'qwen-qwq-32b', 'meta-llama/llama-4-scout-17b-16e-instruct',
];
export const OPENROUTER_MODELS_URL = 'https://openrouter.ai/models';
export const GROQ_MODELS_URL = 'https://console.groq.com/docs/models';
