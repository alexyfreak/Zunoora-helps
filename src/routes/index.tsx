import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/zunoora/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zunoora — AI for Teachers" },
      {
        name: "description",
        content:
          "A quiet, high-end AI assistant that drafts lessons, quizzes, and reports on a clean white sheet.",
      },
      { property: "og:title", content: "Zunoora — AI for Teachers" },
      { property: "og:description", content: "Atmospheric, focused, classroom-ready." },
    ],
  }),
  component: Index,
});

function Index() {
  return <AppShell />;
}
