const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

export class GroqError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "GroqError";
    this.cause = cause;
  }
}

export async function isBackendConnected(): Promise<boolean> {
  return Boolean(API_KEY?.trim());
}

interface CompleteJsonArgs {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function completeJson<T>(args: CompleteJsonArgs): Promise<T> {
  if (!API_KEY?.trim()) {
    throw new GroqError("Groq API key is not configured. Add VITE_GROQ_API_KEY to .env.local.");
  }

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: args.model ?? DEFAULT_MODEL,
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.user },
        ],
        temperature: args.temperature ?? 0.2,
        max_tokens: args.maxTokens ?? 700,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new GroqError(`Groq API error ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      throw new GroqError("Groq returned an empty response");
    }

    try {
      return JSON.parse(content) as T;
    } catch (err) {
      throw new GroqError("Groq returned invalid JSON", err);
    }
  } catch (err) {
    if (err instanceof GroqError) throw err;
    throw new GroqError("Unable to reach Groq", err);
  }
}
