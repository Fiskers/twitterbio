import Together from "together-ai";

const together = new Together();

if (!process.env.TOGETHER_API_KEY) throw new Error("Missing Together env var");

const ALLOWED_MODELS = new Set([
  "openai/gpt-oss-20b",
  "Qwen/Qwen3.5-9B",
]);
const MAX_PROMPT_LENGTH = 4000;

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { prompt, model } = body as Record<string, unknown>;

  if (typeof prompt !== "string" || prompt.length === 0 || prompt.length > MAX_PROMPT_LENGTH) {
    return Response.json(
      { error: `Prompt must be between 1 and ${MAX_PROMPT_LENGTH} characters` },
      { status: 400 },
    );
  }

  if (typeof model !== "string" || !ALLOWED_MODELS.has(model)) {
    return Response.json({ error: "Unsupported model" }, { status: 400 });
  }

  const isQwen = model === "Qwen/Qwen3.5-9B";

  const params = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: isQwen ? 200 : 2000,
    ...(isQwen && { chat_template_kwargs: { enable_thinking: false } }),
  } as Parameters<typeof together.chat.completions.stream>[0];

  const runner = together.chat.completions.stream(params);

  return new Response(runner.toReadableStream());
}

export const runtime = "edge";
