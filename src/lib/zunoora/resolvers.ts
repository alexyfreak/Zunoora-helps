import type { Teacher, Shablon, Director } from "./database";
import { findDirectorBySchool, findPreviousDocument } from "./database";
import type { UserIntent } from "./intentParser";
import { FIELD_META } from "./shablons";

export type ResolutionContext = {
  teacher: Teacher;
  shablon: Shablon;
  intent: UserIntent;
  extraFields: Record<string, string>;
};

export type Resolver = {
  field: string;
  priority: number;
  label: string;
  resolve: (ctx: ResolutionContext) => Promise<string | null>;
};

export type ResolvedField = {
  key: string;
  value: string;
  source: "teacher" | "intent" | "director" | "school" | "runtime" | "history" | "user";
};

export type ResolutionResult = {
  resolved: ResolvedField[];
  missing: { key: string; label: string; question: string }[];
};

function formatUzbekDate(date: Date): string {
  const months = [
    "yanvar",
    "fevral",
    "mart",
    "aprel",
    "may",
    "iyun",
    "iyul",
    "avgust",
    "sentyabr",
    "oktyabr",
    "noyabr",
    "dekabr",
  ];
  return `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`;
}

const roleMap: Record<string, string> = {
  direktor: "Direktor",
  mudir: "Mudir",
  boshliq: "Bo'lim boshlig'i",
  dekan: "Dekan",
  rahbar: "Rahbar",
};

export const RESOLVERS: Resolver[] = [
  {
    field: "date",
    priority: 100,
    label: "Sana",
    resolve: async () => formatUzbekDate(new Date()),
  },
  {
    field: "academic_year",
    priority: 95,
    label: "O'quv yili",
    resolve: async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      if (month >= 8) {
        return `${year}-${year + 1}`;
      }
      return `${year - 1}-${year}`;
    },
  },
  {
    field: "sender_name",
    priority: 90,
    label: "Yuboruvchi F.I.Sh.",
    resolve: async (ctx) => ctx.teacher.full_name,
  },
  {
    field: "sender_position",
    priority: 90,
    label: "Yuboruvchi lavozimi",
    resolve: async (ctx) => ctx.teacher.position,
  },
  {
    field: "teacher_name",
    priority: 90,
    label: "O'qituvchi F.I.Sh.",
    resolve: async (ctx) => ctx.teacher.full_name,
  },
  {
    field: "school",
    priority: 90,
    label: "Maktab nomi",
    resolve: async (ctx) => ctx.teacher.school,
  },
  {
    field: "subject",
    priority: 90,
    label: "Fan nomi",
    resolve: async (ctx) => ctx.teacher.subject ?? ctx.intent.subject ?? null,
  },
  {
    field: "classes",
    priority: 85,
    label: "Sinf",
    resolve: async (ctx) => {
      if (ctx.teacher.classes.length > 0) {
        return ctx.teacher.classes.join(", ");
      }
      return null;
    },
  },
  {
    field: "class_name",
    priority: 85,
    label: "Sinf",
    resolve: async (ctx) => {
      if (ctx.intent.class) return ctx.intent.class;
      if (ctx.teacher.classes.length > 0) {
        return ctx.teacher.classes[0];
      }
      return null;
    },
  },
  {
    field: "recipient_title",
    priority: 80,
    label: "Qabul qiluvchi lavozimi",
    resolve: async (ctx) => {
      if (ctx.intent.recipient) {
        return roleMap[ctx.intent.recipient] ?? null;
      }
      return null;
    },
  },
  {
    field: "recipient_name",
    priority: 70,
    label: "Qabul qiluvchi F.I.Sh.",
    resolve: async (ctx) => {
      if (ctx.intent.recipientName) return ctx.intent.recipientName;

      if (ctx.intent.recipient === "direktor" && ctx.teacher.school) {
        const director = await findDirectorBySchool(ctx.teacher.school);
        return director?.full_name ?? null;
      }

      return null;
    },
  },
  {
    field: "period",
    priority: 60,
    label: "Davr",
    resolve: async (ctx) => {
      if (ctx.intent.timeframe) return ctx.intent.timeframe;
      return null;
    },
  },
  {
    field: "letter_topic",
    priority: 50,
    label: "Mavzu",
    resolve: async (ctx) => {
      if (ctx.intent.topic) return ctx.intent.topic;

      const prev = await findPreviousDocument(ctx.teacher.id, ctx.shablon.type);
      if (prev?.fields_used?.letter_topic) {
        return prev.fields_used.letter_topic;
      }

      return null;
    },
  },
  {
    field: "explanation",
    priority: 40,
    label: "Tushuntirish",
    resolve: async (ctx) => {
      if (ctx.intent.reason) return ctx.intent.reason;

      const prev = await findPreviousDocument(ctx.teacher.id, ctx.shablon.type);
      if (prev?.fields_used?.explanation) {
        return prev.fields_used.explanation;
      }

      return null;
    },
  },
  {
    field: "reason",
    priority: 40,
    label: "Sabab",
    resolve: async (ctx) => {
      if (ctx.intent.reason) return ctx.intent.reason;
      return null;
    },
  },
  {
    field: "goals",
    priority: 30,
    label: "Maqsad",
    resolve: async () => null,
  },
  {
    field: "week_start",
    priority: 80,
    label: "Hafta boshi",
    resolve: async () => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      return formatUzbekDate(monday);
    },
  },
  {
    field: "week_end",
    priority: 80,
    label: "Hafta oxiri",
    resolve: async () => {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const saturday = new Date(now.setDate(diff + 5));
      return formatUzbekDate(saturday);
    },
  },
];

export async function resolveFields(
  shablon: Shablon,
  teacher: Teacher,
  intent: UserIntent,
  userAnswers: Record<string, string> = {},
): Promise<ResolutionResult> {
  const ctx: ResolutionContext = { teacher, shablon, intent, extraFields: {} };
  const resolved: ResolvedField[] = [];

  const allFields = [...(shablon.schema.required ?? []), ...(shablon.schema.optional ?? [])];

  for (const field of allFields) {
    if (userAnswers[field]) {
      resolved.push({ key: field, value: userAnswers[field], source: "user" });
      ctx.extraFields[field] = userAnswers[field];
      continue;
    }

    const sortedResolvers = [...RESOLVERS]
      .filter((r) => r.field === field)
      .sort((a, b) => b.priority - a.priority);

    let resolvedValue: string | null = null;

    for (const resolver of sortedResolvers) {
      resolvedValue = await resolver.resolve(ctx);
      if (resolvedValue) {
        resolved.push({ key: field, value: resolvedValue, source: "runtime" });
        ctx.extraFields[field] = resolvedValue;
        break;
      }
    }

    if (!resolvedValue) {
      ctx.extraFields[field] = "";
    }
  }

  const missing: { key: string; label: string; question: string }[] = [];
  for (const field of shablon.schema.required ?? []) {
    if (!ctx.extraFields[field]) {
      const meta = FIELD_META[field];
      if (meta) {
        missing.push({ key: field, label: meta.label, question: meta.question });
      } else {
        missing.push({ key: field, label: field, question: `${field} ni kiriting:` });
      }
    }
  }

  return { resolved, missing };
}
