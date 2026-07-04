export type AIProvider = "openrouter" | "groq" | "openai" | "anthropic";

export type AIProviderConfig = {
  provider: AIProvider;
  apiKey: string;
  model: string;
};

const PROVIDER_DEFAULTS: Record<AIProvider, { baseUrl: string; defaultModel: string }> = {
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "openai/gpt-4o-mini",
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
  },
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-3-haiku-20240307",
  },
};

const STORAGE_KEY = "zunoora_ai_config";

export function getStoredConfig(): AIProviderConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AIProviderConfig;
  } catch {
    return null;
  }
}

export function storeConfig(config: AIProviderConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isAIConfigured(): boolean {
  const config = getStoredConfig();
  return !!config && !!config.apiKey;
}

const FETCH_TIMEOUT = 30_000;

async function chatCompletion(
  messages: { role: string; content: string }[],
  configOverride?: AIProviderConfig,
): Promise<string> {
  const config = configOverride ?? getStoredConfig();
  if (!config || !config.apiKey) {
    throw new Error("AI kalit sozlanmagan. Iltimos, Sozlamalar > AI Provayder bo'limida kalitingizni o'rnating.");
  }

  const provider = PROVIDER_DEFAULTS[config.provider];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    };

    if (config.provider === "openrouter") {
      headers["HTTP-Referer"] = window.location.origin;
      headers["X-Title"] = "Zunoora";
    }

    const body: Record<string, unknown> = {
      model: config.model || provider.defaultModel,
      messages,
    };

    if (config.provider === "anthropic") {
      body.max_tokens = 4096;
    }

    const res = await fetch(provider.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${config.provider} API ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? data.content?.[0]?.text ?? "";
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function chatWithAI(prompt: string, context?: string): Promise<string> {
  try {
    const systemContext = `Siz Zunoora AI yordamchisisiz. O'zbek tilida gaplashasiz. Sizning vazifangiz o'qituvchilarga dokumentlar tayyorlashda yordam berish.

${context || ""}

Javoblaringizni qisqa va aniq bering. Agar foydalanuvchi biror dokument (ariza, hisobot, KTP va h.k.) so'rasa, unga qanday ma'lumot kerakligini aniqlang va shablon bo'yicha to'ldirish uchun savollar bering.`;

    return await chatCompletion([
      { role: "system", content: systemContext },
      { role: "user", content: prompt },
    ]);
  } catch (error) {
    console.error("AI API error:", error);
    const msg = error instanceof Error ? error.message : "Noma'lum xatolik";
    return `Kechirasiz, AI bilan bog'lanishda xatolik yuz berdi: ${msg}`;
  }
}

export async function detectShablonWithAI(prompt: string): Promise<string | null> {
  try {
    const types = [
      "ariza", "ish_tabeli", "ktp", "oum",
      "bsb_chb", "sillabus", "hisobot", "tushuntirish_xati",
    ];

    const instruction = `Quyidagi foydalanuvchi so'roviga qaysi shablon turi mos kelishini aniqlang.
Mavjud shablon turlari: ${types.join(", ")}.
Faqat shablon turini (bitta so'z) qaytaring. Agar mos kelmasa, "none" qaytaring.

Foydalanuvchi: "${prompt}"`;

    const text = await chatCompletion([{ role: "user", content: instruction }]);
    const result = text.trim().toLowerCase();
    if (types.includes(result)) return result;
    return null;
  } catch (error) {
    console.error("detectShablonWithAI error:", error);
    return null;
  }
}

export async function generateDocumentAI(
  shablonTemplate: string,
  teacher: Record<string, string>,
  extraFields: Record<string, string>,
): Promise<string> {
  try {
    const allFields = { ...teacher, ...extraFields };
    const fieldsStr = Object.entries(allFields)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const systemPrompt = `Sen Zunoora AI yordamchisisan. Vazifang - berilgan shablonni ma'lumotlar bilan to'ldirib, chiroyli, rasmiy va to'liq dokument tayyorlash.

QOIDALAR:
1. Faqat to'ldirilgan dokument matnini qaytar, hech qanday izohsiz
2. Joy nomlari, lavozimlar va shaxs ismlarini to'g'ri yoz
3. Rasmiy uslubda, imlo xatolarisiz yoz
4. Agar biror ma'lumot yetishmasa, o'rniga "______________" qo'y
5. Matnni chiroyli formatda, sarlavhalar va bo'limlar bilan tayyorla`;

    const prompt = `MA'LUMOTLAR:
${fieldsStr}

SHABLON:
${shablonTemplate}

Shablonni yuqoridagi ma'lumotlar bilan to'ldir va faqat tayyor dokumentni qaytar.`;

    return await chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ]);
  } catch (error) {
    console.error("generateDocumentAI error:", error);
    return basicFillTemplate(shablonTemplate, { ...teacher, ...extraFields });
  }
}

export async function enhanceWithAI(content: string, teacherFields: Record<string, string>): Promise<string> {
  try {
    const enhanced = await generateDocumentAI(content, teacherFields, {});
    return enhanced || content;
  } catch {
    return content;
  }
}

export async function suggestContinuation(content: string): Promise<string | null> {
  try {
    const result = await chatCompletion([
      { role: "system", content: "Siz Zunoora AI yordamchisisiz. O'zbek tilida gaplashasiz." },
      { role: "user", content: `Quyidagi dokumentning davomini yozishni taklif qiling:\n\n${content}` },
    ]);
    return result || null;
  } catch {
    return null;
  }
}

function basicFillTemplate(template: string, fields: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(fields)) {
    result = result.replaceAll(`{{${key}}}`, value || "______________");
  }
  result = result.replace(/\{\{.+?\}\}/g, "______________");
  return result;
}
