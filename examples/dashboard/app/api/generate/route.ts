import { streamText } from "ai";
import { buildSystemPrompt } from "@/lib/prompt";

export const maxDuration = 30;

const SYSTEM_PROMPT = buildSystemPrompt();

export async function POST(req: Request) {
  const { prompt, context } = await req.json();

  let fullPrompt = prompt;

  // Add data context
  if (context?.data) {
    fullPrompt += `\n\nAVAILABLE DATA:\n${JSON.stringify(context.data, null, 2)}`;
  }

  const result = streamText({
    model: "anthropic/claude-opus-4.5",
    system: SYSTEM_PROMPT,
    prompt: fullPrompt,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
