// Expression tags that the LLM can prepend to responses
export type VTuberExpression = 'happy' | 'angry' | 'sad' | 'relaxed' | 'neutral';

const EXPRESSION_TAGS: Record<string, VTuberExpression> = {
  '[happy]': 'happy',
  '[angry]': 'angry',
  '[sad]': 'sad',
  '[relaxed]': 'relaxed',
  '[neutral]': 'neutral',
};

/**
 * Parse expression tag from the start of an LLM response.
 * Returns the detected expression and the cleaned text (tag removed).
 */
export function parseExpression(text: string): {
  expression: VTuberExpression;
  cleanText: string;
} {
  const match = text.match(/^\[(happy|angry|sad|relaxed|neutral)\]\s*/i);
  if (match) {
    const tag = `[${match[1].toLowerCase()}]` as keyof typeof EXPRESSION_TAGS;
    return {
      expression: EXPRESSION_TAGS[tag] ?? 'neutral',
      cleanText: text.slice(match[0].length),
    };
  }
  return { expression: 'neutral', cleanText: text };
}

/**
 * System prompt addition instructing the LLM to prefix responses with an emotion tag.
 */
export const EXPRESSION_SYSTEM_PROMPT_ADDITION = `

At the very start of EVERY response, prepend exactly one emotion tag that matches your mood or tone. Choose from: [happy] [angry] [sad] [relaxed] [neutral]. The tag must be the very first thing in your response, followed by a space, then your reply. Example: "[happy] Hello there!" or "[sad] That makes me a little upset..."`;
