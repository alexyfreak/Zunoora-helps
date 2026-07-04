import type { ResolutionResult } from "./resolvers";
import type { UserIntent } from "./intentParser";

export type QuestionType = "confirm" | "open";

export type Question = {
  field: string;
  text: string;
  type: QuestionType;
  suggestion?: string;
};

export type QuestionFlow = {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
};

export function buildQuestionFlow(resolution: ResolutionResult, intent: UserIntent): QuestionFlow {
  const questions: Question[] = [];

  for (const m of resolution.missing) {
    questions.push({
      field: m.key,
      text: m.question,
      type: "open",
    });
  }

  return {
    questions,
    currentIndex: 0,
    answers: {},
  };
}

export function getCurrentQuestion(flow: QuestionFlow): Question | null {
  if (flow.currentIndex >= flow.questions.length) return null;
  return flow.questions[flow.currentIndex];
}

export function answerQuestion(flow: QuestionFlow, answer: string): QuestionFlow {
  const question = flow.questions[flow.currentIndex];
  if (!question) return flow;

  return {
    ...flow,
    answers: { ...flow.answers, [question.field]: answer },
    currentIndex: flow.currentIndex + 1,
  };
}

export function isFlowComplete(flow: QuestionFlow): boolean {
  return flow.currentIndex >= flow.questions.length;
}

export function extractAnswers(flow: QuestionFlow): Record<string, string> {
  return { ...flow.answers };
}
