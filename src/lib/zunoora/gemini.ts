const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = "llama-3.3-70b-versatile";

// Use server-side proxy in browser to avoid CORS issues
const BASE_URL =
  typeof window !== "undefined" ? "/api/groq" : "https://api.groq.com/openai/v1/chat/completions";

export function isGeminiAvailable(): boolean {
  return !!apiKey;
}

export type GeminiResponse = {
  text: string;
};

const FETCH_TIMEOUT = 30_000;

async function groqChat(messages: { role: string; content: string }[]): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const body: Record<string, unknown> = { model: MODEL, messages };

    // When calling Groq directly (SSR), pass the API key
    // When using the proxy (browser), the server handles auth
    if (BASE_URL.startsWith("https://")) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const res = await fetch(BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq API ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function chatWithGemini(prompt: string, context?: string): Promise<GeminiResponse> {
  try {
    const systemContext = `Siz Zunoora AI yordamchisisiz. O'zbek tilida gaplashasiz. Sizning vazifangiz o'qituvchilarga dokumentlar tayyorlashda yordam berish.

${context || ""}

Javoblaringizni qisqa va aniq bering. Agar foydalanuvchi biror dokument (ariza, hisobot, KTP va h.k.) so'rasa, unga qanday ma'lumot kerakligini aniqlang va shablon bo'yicha to'ldirish uchun savollar bering.`;

    const text = await groqChat([
      { role: "system", content: systemContext },
      { role: "user", content: prompt },
    ]);
    return { text };
  } catch (error) {
    console.error("Groq API error:", error);
    return {
      text: "Kechirasiz, AI bilan bog'lanishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
    };
  }
}

export async function detectShablonWithAI(prompt: string): Promise<string | null> {
  try {
    const types = [
      "ariza",
      "ish_tabeli",
      "ktp",
      "oum",
      "bsb_chb",
      "sillabus",
      "hisobot",
      "tushuntirish_xati",
    ];

    const instruction = `Quyidagi foydalanuvchi so'roviga qaysi shablon turi mos kelishini aniqlang.
Mavjud shablon turlari: ${types.join(", ")}.
Faqat shablon turini (bitta so'z) qaytaring. Agar mos kelmasa, "none" qaytaring.

Foydalanuvchi: "${prompt}"`;

    const text = await groqChat([{ role: "user", content: instruction }]);
    const result = text.trim().toLowerCase();
    if (types.includes(result)) return result;
    return null;
  } catch (error) {
    console.error("detectShablonWithAI error:", error);
    return null;
  }
}

export async function generateDocument(
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

    return await groqChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ]);
  } catch (error) {
    console.error("generateDocument error:", error);
    return basicFillTemplate(shablonTemplate, { ...teacher, ...extraFields });
  }
}

export async function generateMissingFieldQuestions(
  missingFields: { key: string; label: string; question: string }[],
): Promise<string> {
  if (missingFields.length === 0) {
    return "Barcha ma'lumotlar mavjud. Dokument tayyor.";
  }

  try {
    const questions = missingFields.map((f, i) => `${i + 1}. ${f.question}`).join("\n");

    const prompt = `Siz Zunoora AI yordamchisisiz. Quyidagi ma'lumotlar yetishmayapti. Foydalanuvchidan ularni so'rang. Har bir savolni alohida qatorda bering.

Yetishmayotgan ma'lumotlar va savollar:
${questions}

Iltimos, foydalanuvchiga birinchi savolni bering.`;

    return await groqChat([{ role: "user", content: prompt }]);
  } catch (error) {
    console.error("generateMissingFieldQuestions error:", error);
    return missingFields[0]?.question ?? "";
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
