import { isAIConfigured, enhanceWithAI } from "./ai";

export async function enhanceContent(
  content: string,
  teacherFields: Record<string, string>,
): Promise<string> {
  if (!isAIConfigured()) {
    return content;
  }

  try {
    const enhanced = await enhanceWithAI(content, teacherFields);
    return enhanced || content;
  } catch {
    return content;
  }
}

export async function suggestContinuation(content: string): Promise<string | null> {
  if (!isAIConfigured()) {
    return null;
  }

  try {
    const { chatWithAI } = await import("./ai");
    const result = await chatWithAI(
      `Quyidagi dokumentning davomini yozishni taklif qiling:\n\n${content}`,
      "Siz Zunoora AI yordamchisisiz. O'zbek tilida gaplashasiz.",
    );
    return result || null;
  } catch {
    return null;
  }
}
