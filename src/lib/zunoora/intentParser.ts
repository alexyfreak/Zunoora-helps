import { SHABLON_KEYWORDS } from "./shablons";

export type UserIntent = {
  shablonType: string | null;
  recipient?: string;
  recipientName?: string;
  subject?: string;
  class?: string;
  timeframe?: string;
  topic?: string;
  reason?: string;
};

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Matematika: ["matematika", "math", "algebra", "geometriya"],
  "Ona tili va adabiyot": ["ona tili", "adabiyot", "tili", "til"],
  Fizika: ["fizika", "physics"],
  Kimyo: ["kimyo", "chemistry"],
  Biologiya: ["biologiya", "biology"],
  Tarix: ["tarix", "history"],
  "Ingliz tili": ["ingliz tili", "ingliz", "english"],
  "Jismoniy tarbiya": ["jismoniy tarbiya", "tarbiya", "sport"],
};

const CLASS_PATTERN = /(\d{1,2})[-\s]?([А-ЯA-Z])/i;
const TIMEFRAME_PATTERNS = [
  { pattern: /(\d{4})[-\s](\d{4})/, normalize: (m: RegExpMatchArray) => `${m[1]}-${m[2]}` },
  { pattern: /(\d+)[-\s]?chorak/i, normalize: (m: RegExpMatchArray) => `${m[1]}-chorak` },
  { pattern: /1[-\s]?yarim yillik/i, normalize: () => "1-yarim yillik" },
  { pattern: /2[-\s]?yarim yillik/i, normalize: () => "2-yarim yillik" },
];

export function parseIntent(prompt: string): UserIntent {
  const lower = prompt.toLowerCase();
  const intent: UserIntent = { shablonType: null };

  intent.shablonType = detectShablonType(lower);

  if (lower.includes("direktor")) intent.recipient = "direktor";
  else if (lower.includes("mudir")) intent.recipient = "mudir";
  else if (lower.includes("boshliq")) intent.recipient = "boshliq";

  const nameMatch = prompt.match(/(?:uchun|ga|dan)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
  if (nameMatch) intent.recipientName = nameMatch[1];

  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      intent.subject = subject;
      break;
    }
  }

  const classMatch = prompt.match(CLASS_PATTERN);
  if (classMatch) {
    intent.class = `${classMatch[1]}-${classMatch[2].toUpperCase()}`;
  }

  for (const tf of TIMEFRAME_PATTERNS) {
    const m = lower.match(tf.pattern);
    if (m) {
      intent.timeframe = tf.normalize(m);
      break;
    }
  }

  if (intent.shablonType === "tushuntirish_xati" || intent.shablonType === "ariza") {
    const topicMatch = prompt.match(/(?:mavzu|haqida|yuzasidan)\s+(.+?)(?:\.|,|$)/i);
    if (topicMatch) intent.topic = topicMatch[1].trim();
  }

  if (intent.shablonType === "tushuntirish_xati") {
    const reasonMatch = prompt.match(/(?:sabab|uchun|boisi)\s+(.+?)(?:\.|,|$)/i);
    if (reasonMatch) intent.reason = reasonMatch[1].trim();
  }

  return intent;
}

function detectShablonType(lower: string): string | null {
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(SHABLON_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type;
    }
  }

  return bestMatch;
}
