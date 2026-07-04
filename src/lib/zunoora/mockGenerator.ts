// Deterministic mock token streamer that produces a teacher-style document.

const SUBJECTS: Record<string, string> = {
  photo: "Photosynthesis",
  algebra: "Linear Equations",
  shakespeare: "Macbeth — Act I",
  history: "The Industrial Revolution",
  fraction: "Adding Fractions",
  poem: "Imagery in Modern Poetry",
};

function pickTopic(prompt: string): string {
  const lower = prompt.toLowerCase();
  for (const k of Object.keys(SUBJECTS)) {
    if (lower.includes(k)) return SUBJECTS[k];
  }
  // Use first meaningful words
  const words = prompt.trim().split(/\s+/).slice(0, 6).join(" ");
  return words || "A Lesson Plan";
}

export function buildDocument(prompt: string, model: "standard" | "deep") {
  const topic = pickTopic(prompt);
  const depth = model === "deep" ? "Deep Analysis" : "Standard Output";
  return `# ${topic}

*${depth} · Prepared by Zunoora for the classroom*

## Learning objectives

By the end of this lesson, students will be able to:

1. Define the core concepts behind ${topic.toLowerCase()} in their own words.
2. Identify two real-world examples that illustrate the idea.
3. Apply the concept to solve a short guided exercise.

## Materials

— Whiteboard and markers
— Printed handout (one per pair)
— A short opening video, two to three minutes
— Sticky notes for the exit ticket

## Lesson flow

**Opening (5 min).** Begin with a question on the board. Ask students to write
a single sentence response on a sticky note. Collect a few responses aloud to
surface prior knowledge without judgement.

**Direct instruction (12 min).** Introduce the key idea using one concrete
example and one abstract one. Pause twice to check understanding.

**Guided practice (15 min).** Pairs work through the handout. Circulate and
ask probing questions rather than giving answers.

**Independent practice (10 min).** Students attempt two problems on their own.

**Close (5 min).** Exit ticket: one thing learned, one question still open.

## Differentiation

For students who need extra support, pair them with a peer mentor and provide
a sentence-starter handout. For students ready for extension, offer a deeper
case study question that connects to the next unit.

## Assessment

Use the exit tickets as a formative check. Look for misconceptions in the
questions students still hold and address them at the start of the next class.

---

*Generated as a starting point. Adapt freely.*
`;
}

export async function* streamDocument(
  prompt: string,
  model: "standard" | "deep",
  signal?: AbortSignal,
): AsyncGenerator<string, string, void> {
  const full = buildDocument(prompt, model);
  // Stream by short chunks (1–4 words) at varying delays
  const tokens = full.match(/(\s+|[^\s]+)/g) ?? [full];
  let acc = "";
  for (let i = 0; i < tokens.length; i++) {
    if (signal?.aborted) break;
    acc += tokens[i];
    const delay = 18 + Math.floor(Math.random() * 35);
    await new Promise((r) => setTimeout(r, delay));
    yield acc;
  }
  return acc;
}

export function buildAssistantReply(prompt: string, model: "standard" | "deep") {
  const topic = pickTopic(prompt);
  if (model === "deep") {
    return `Drafting a deep-analysis document on **${topic}**. I've laid out objectives, a paced lesson flow, and differentiation notes — open the document on the left to review.`;
  }
  return `Here's a clean lesson plan for **${topic}**. The document is composed on the desk — edit any section directly or ask me to refine it.`;
}
