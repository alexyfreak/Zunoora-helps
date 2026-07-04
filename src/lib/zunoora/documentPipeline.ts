import { fillTemplate } from "./shablons";
import {
  fetchShablonByType,
  fetchTeacherByEmail,
  saveDocument,
  type Teacher,
  type Shablon,
} from "./database";
import { parseIntent } from "./intentParser";
import { resolveFields } from "./resolvers";
import {
  buildQuestionFlow,
  getCurrentQuestion,
  answerQuestion,
  isFlowComplete,
  extractAnswers,
  type QuestionFlow,
} from "./questionEngine";

export type PipelineEvent = {
  type: "assistant_reply" | "question" | "document_chunk" | "document_ready";
  content: string;
};

export type PipelineCallback = (event: PipelineEvent) => void;

export type OnQuestionCallback = (
  question: string,
  field: string,
  flow: QuestionFlow,
  shablon: Shablon,
  teacher: Teacher,
) => void;

/**
 * Main document generation pipeline:
 * 1. Parse intent from prompt
 * 2. Fetch shablon template + teacher data
 * 3. Resolve fields using smart resolvers (DB, intent, runtime)
 * 4. If missing → ask conversational questions one at a time
 * 5. Fill template (NO AI)
 */
export async function runPipeline(
  prompt: string,
  teacherEmail: string,
  onEvent: PipelineCallback,
  onQuestion?: OnQuestionCallback,
): Promise<void> {
  try {
    onEvent({ type: "assistant_reply", content: "So'rovingizni tahlil qilmoqdaman..." });

    const intent = parseIntent(prompt);

    if (!intent.shablonType) {
      onEvent({
        type: "assistant_reply",
        content:
          "Qanday dokument kerakligini aniqlay olmadim. Iltimos, quyidagilardan birini tanlang: Ariza, Ish Tabeli, KTP, O'UM, BSB/CHB, Sillabus, Hisobot, Tushuntirish Xati.",
      });
      return;
    }

    onEvent({
      type: "assistant_reply",
      content: `"${intent.shablonType}" shablonini yuklayapman...`,
    });

    const [shablon, teacher] = await Promise.all([
      fetchShablonByType(intent.shablonType),
      fetchTeacherByEmail(teacherEmail),
    ]);

    if (!shablon) {
      onEvent({
        type: "assistant_reply",
        content: `Kechirasiz, "${intent.shablonType}" shabloni topilmadi.`,
      });
      return;
    }

    if (!teacher) {
      onEvent({
        type: "assistant_reply",
        content: "Foydalanuvchi ma'lumotlari topilmadi. Iltimos, profilingizni tekshiring.",
      });
      return;
    }

    const resolution = await resolveFields(shablon, teacher, intent);

    if (resolution.missing.length > 0) {
      const flow = buildQuestionFlow(resolution, intent);
      const question = getCurrentQuestion(flow);
      if (question) {
        onQuestion?.(question.text, question.field, flow, shablon, teacher);
      }
      return;
    }

    await generateAndDisplay(shablon, teacher, resolution, onEvent);
  } catch (error) {
    console.error("Pipeline error:", error);
    onEvent({
      type: "assistant_reply",
      content: "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
    });
  }
}

export async function continuePipeline(
  answer: string,
  flow: QuestionFlow,
  shablon: Shablon,
  teacher: Teacher,
  onEvent: PipelineCallback,
  onQuestion?: OnQuestionCallback,
): Promise<void> {
  const updatedFlow = answerQuestion(flow, answer);

  if (!isFlowComplete(updatedFlow)) {
    const question = getCurrentQuestion(updatedFlow);
    if (question) {
      onQuestion?.(question.text, question.field, updatedFlow, shablon, teacher);
    }
    return;
  }

  const userAnswers = extractAnswers(updatedFlow);
  const resolution = await resolveFields(
    shablon,
    teacher,
    { shablonType: shablon.type },
    userAnswers,
  );

  await generateAndDisplay(shablon, teacher, resolution, onEvent);
}

async function generateAndDisplay(
  shablon: Shablon,
  teacher: Teacher,
  resolution: {
    extraFields?: Record<string, string>;
    resolved?: { key: string; value: string; source: string }[];
  },
  onEvent: PipelineCallback,
): Promise<void> {
  onEvent({ type: "assistant_reply", content: "Dokument tayyorlanmoqda..." });

  const fields: Record<string, string> = {
    sender_name: teacher.full_name,
    sender_position: teacher.position || "",
    school: teacher.school || "",
    subject: teacher.subject || "",
    teacher_name: teacher.full_name,
    classes: teacher.classes.join(", "),
    ...(resolution.extraFields ?? {}),
  };

  const document = fillTemplate(shablon.template, fields);

  const chunkSize = 50;
  let streamed = "";
  const words = document.split(/(\s+)/);

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join("");
    streamed += chunk;
    onEvent({ type: "document_chunk", content: streamed });
    await new Promise((r) => setTimeout(r, 20));
  }

  try {
    await saveDocument({
      teacher_id: teacher.id,
      shablon_id: shablon.id,
      title: shablon.label,
      content: streamed,
      fields_used: fields,
    });
  } catch {
    // Silently fail - document history saving is non-critical
  }

  onEvent({
    type: "document_ready",
    content: streamed,
  });
}
