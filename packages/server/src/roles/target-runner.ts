import { chat, ModelConfig, ToolDef, ToolCall, ChatMessage } from '../llm/openai-compat.js';
import { db } from '../db/index.js';

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
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput },
  ];

  const r = await chat(model, messages, { tools: tools.length ? tools : undefined });
  const allToolCalls: ToolCall[] = r.tool_calls || [];

  // If model made tool calls, feed mock responses back for one round
  if (allToolCalls.length > 0) {
    // Build mock response map from DB
    const mockMap = new Map<string, string>();
    const rows = db.prepare('SELECT name, mock_response FROM tools').all() as { name: string; mock_response: string }[];
    for (const row of rows) mockMap.set(row.name, row.mock_response);

    messages.push({ role: 'assistant', content: r.content || null, tool_calls: allToolCalls });
    for (const tc of allToolCalls) {
      const toolName = tc.function?.name ?? '';
      const mockResp = mockMap.get(toolName) ?? `[MOCK] tool "${toolName}" returned no result`;
      messages.push({
        role: 'tool',
        content: mockResp,
        tool_call_id: tc.id,
        name: toolName,
      });
    }

    const r2 = await chat(model, messages, { tools: tools.length ? tools : undefined });
    return { content: r2.content || '', tool_calls: allToolCalls };
  }

  return { content: r.content || '', tool_calls: allToolCalls };
}
