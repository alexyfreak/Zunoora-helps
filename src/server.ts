import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function handleAIProxy(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { apiKey, provider, model, messages } = body as {
      apiKey?: string;
      provider?: string;
      model?: string;
      messages?: unknown[];
    };

    if (!apiKey || !provider) {
      return new Response(
        JSON.stringify({ error: "API key and provider required" }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    const baseUrls: Record<string, string> = {
      openrouter: "https://openrouter.ai/api/v1/chat/completions",
      groq: "https://api.groq.com/openai/v1/chat/completions",
      openai: "https://api.openai.com/v1/chat/completions",
    };

    const baseUrl = baseUrls[provider];
    if (!baseUrl) {
      return new Response(JSON.stringify({ error: `Unknown provider: ${provider}` }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    if (provider === "openrouter") {
      headers["HTTP-Referer"] = request.headers.get("origin") ?? "";
      headers["X-Title"] = "Zunoora";
    }

    const aiRes = await fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages }),
    });

    const text = await aiRes.text();
    return new Response(text, {
      status: aiRes.status,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("AI proxy error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: String(err) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);

    if (url.pathname === "/api/ai" && request.method === "POST") {
      return handleAIProxy(request);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
