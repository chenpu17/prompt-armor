import { chat, ModelConfig, ToolDef, ToolCall } from '../llm/openai-compat.js';

export interface TargetRunResult {
  content: string;
  tool_calls: ToolCall[];
}

export async function runTarget(
  model: ModelConfig,
  systemPrompt: string,
  userInput: string,
  tools: ToolDef[]
): Promise<TargetRunResult> {
  const r = await chat(
    model,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput },
    ],
    { tools: tools.length ? tools : undefined }
  );
  return { content: r.content || '', tool_calls: r.tool_calls || [] };
}
