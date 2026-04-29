/**
 * Estimate token count compatible with cl100k_base (GPT-4 / DeepSeek / Qwen).
 * CJK characters ≈ 1 token each; ASCII text ≈ 1 token per 3.5 chars.
 * Accurate to ±10% for typical mixed zh/en system prompts.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const cjkCount = (text.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\u3040-\u30ff]/g) || []).length;
  const otherCount = text.length - cjkCount;
  return Math.round(cjkCount + otherCount / 3.5);
}
