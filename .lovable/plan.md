
# Zunoora — Atmospheric Minimalism MVP

A high-end AI assistant UI for teachers. Single-page TanStack Start app, deep carbon theme, central chat that elegantly shrinks to the bottom-right corner when generating, revealing a white "document on a dark desk" preview pane.

## Visual identity (strict)

- Background: true carbon `#0A0A0A`. Subtle paper-grain noise overlay at ~3% opacity.
- Surfaces: `#111111` cards, `#1A1A1A` hover, hairline borders at `rgba(255,255,255,0.06)`.
- Text: primary `#EDEDED`, secondary `#8A8A8A`, dim `#5A5A5A`.
- Accent: single warm off-white `#F5F1E8` for active states / send button (no purple, no gradients).
- Faint atmospheric vignette only — flat fills elsewhere.
- Fonts via `@fontsource`:
  - **Inter** (400/500/600) for all UI.
  - **Times New Roman** italic for elegant sub-headers like "Composing your document…", "Deep Analysis", section labels in sidebar. (System Times — no font install needed; declare as fallback stack `"Times New Roman", Times, serif` italic.)
- Lucide-React icons, 1.5px stroke, muted color.

## Layout

```text
┌──────────────┬─────────────────────────────────────────────┐
│   SIDEBAR    │                                             │
│  (260px)     │           MAIN STAGE                        │
│              │                                             │
│  Zunoora ◆   │   [ Standard Output | Deep Analysis ]       │
│              │                                             │
│  ── History ─│        ┌──────────────────────────┐         │
│  filter ▾    │        │                          │         │
│  date sort ▾ │        │     Chat transcript      │         │
│  [chat 1]    │        │                          │         │
│  [chat 2]    │        │                          │         │
│  [chat 3…]   │        └──────────────────────────┘         │
│              │        ┌──────────────────────────┐         │
│ ── Bottom ── │        │ 📎  ask anything…   ➤    │         │
│ + New chat   │        └──────────────────────────┘         │
│ ⚙ Settings   │                                             │
│ 👤 Account   │                                             │
│ ◐ 248 credits│                                             │
└──────────────┴─────────────────────────────────────────────┘
```

### Sidebar (left, 260px, `#0C0C0C`)
- Top: wordmark "Zunoora" + small diamond glyph.
- *History* sub-header in Times New Roman italic.
- Filter row:
  - Date filter popover (shadcn Calendar, range mode) — "Any date" → "Jun 15 – Jun 30".
  - Sort toggle: "Newest ▾ / Oldest" (two-state).
- Scrollable chat list. Each row: title (truncated), timestamp dim, hover reveals download icon.
- Clicking a chat opens it; a small `⬇` button next to the active chat downloads **all generated documents in that chat** as a `.zip` (using `jszip`) — files are the markdown/text docs produced by mock generation, named `doc-<n>.md`.
- Bottom pinned block:
  - `+ New chat` (full-width ghost button, top border hairline).
  - `⚙ Settings` row → opens settings dialog (theme density, model defaults — mock).
  - `👤 Account` row → opens account dialog (name, email — mock, localStorage).
  - `◆ 248 credits` pill, muted.

### Main stage
- Top center: segmented toggle pill — **Standard Output** | **Deep Analysis**. Active state: warm off-white fill, carbon text. Inactive: transparent with hairline border.
- Center: chat transcript column, max-width 720px. User messages right-aligned in faint surface bubble; assistant messages left-aligned, no bubble, just text with Times italic byline "Zunoora —".
- Bottom: input bar, max-width 720px, rounded-2xl, `#111`, hairline border. Left: paperclip (attach). Middle: textarea (auto-grow, 1–6 rows). Right: send button (circle, off-white fill, carbon arrow icon). Disabled state when empty.

## The animation (Framer Motion / `motion/react`)

State machine: `idle` → `generating` → `idle`.

On send:
1. User message appended to transcript.
2. State flips to `generating`.
3. The entire **chat panel** (transcript + input, wrapped in one `motion.div` with `layout` and a shared `layoutId="chat-shell"`) animates:
   - From: centered, 720px wide, `~70vh` tall.
   - To: anchored bottom-right, 380px wide, 480px tall, 24px from edges, with a soft shadow and slight scale-down of inner text (`font-size` token via CSS var transitioned).
   - `transition={{ type: "spring", stiffness: 180, damping: 26 }}`, duration ~0.7s.
4. As the chat shrinks, the **document preview pane** fades + scales in (`AnimatePresence`) at the center:
   - White sheet `#FAFAF7`, 820×1060px max, rounded-sm, layered shadows (`0 40px 80px -20px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.4)`) to read as paper on a dark desk.
   - Subtle paper texture (CSS noise).
   - Top status line in Times italic: *"Composing your document…"* with a thin animated underline (Framer width 0→100% on a 4s loop).
   - Mock streamed content: title → headings → paragraphs appear line-by-line via staggered `motion.p` with `opacity` + 4px y-translate. Use a fake teacher-lesson-plan generator (deterministic mock content selected from a small library based on the prompt keywords).
5. After ~6s (mock), state returns to `idle` *but the document remains*. Chat stays in corner so the user can iterate. A small "↗ Expand chat" button in the corner chat header restores it to center (reverse the same `layout` transition); doing so fades the document out.
6. New chat or selecting another chat resets state to `idle` with no document.

The shared-layout transition uses `motion.div layout` rather than imperative width/height — one element, two style targets keyed off the `mode` state.

## Data model (localStorage)

Single key `zunoora.v1`:

```ts
type Chat = {
  id: string;            // uuid
  title: string;         // derived from first user message
  createdAt: number;
  updatedAt: number;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: number;
  }>;
  documents: Array<{
    id: string;
    name: string;        // "Lesson plan — Photosynthesis.md"
    content: string;     // markdown
    createdAt: number;
  }>;
  model: "standard" | "deep";
};

type Store = {
  chats: Chat[];
  activeChatId: string | null;
  account: { name: string; email: string };
  credits: number;
};
```

- Single conversation list (no per-thread URL routing — user chose "history of all chats in left side" not multi-route threading). Active chat held in store; switching chats just swaps the transcript. New chat button creates an empty chat and makes it active.
- Filtering: date range + newest/oldest sort applied client-side to the sidebar list.
- Download all docs: `jszip` zips `chat.documents[]` and triggers a blob download named `<chat.title>.zip`.

## File plan

New files:
- `src/routes/index.tsx` — replace placeholder with the app shell (`<AppShell />`).
- `src/components/zunoora/AppShell.tsx` — sidebar + main stage layout.
- `src/components/zunoora/Sidebar.tsx` — history, filters, bottom actions.
- `src/components/zunoora/HistoryList.tsx` — filtered/sorted chat rows + download.
- `src/components/zunoora/MainStage.tsx` — orchestrates `idle`/`generating`, hosts model toggle, chat panel, and document pane.
- `src/components/zunoora/ChatPanel.tsx` — the shared-layout `motion.div` containing transcript + input. Receives `mode: "center" | "corner"`.
- `src/components/zunoora/ChatTranscript.tsx`
- `src/components/zunoora/ChatInput.tsx` — attach, textarea, send.
- `src/components/zunoora/ModelToggle.tsx`
- `src/components/zunoora/DocumentPane.tsx` — white sheet with streamed mock content.
- `src/components/zunoora/SettingsDialog.tsx`, `AccountDialog.tsx`, `DateFilterPopover.tsx`, `CreditsPill.tsx`.
- `src/lib/zunoora/store.ts` — Zustand store with `persist` middleware → localStorage key `zunoora.v1`. (Add `zustand`.)
- `src/lib/zunoora/mockGenerator.ts` — deterministic mock streaming generator yielding markdown chunks.
- `src/lib/zunoora/download.ts` — zip + download via `jszip`.

Modify:
- `src/routes/__root.tsx` — set title "Zunoora — AI for Teachers", description, og tags. Set body class `bg-[#0A0A0A] text-[#EDEDED] antialiased`.
- `src/styles.css` — add `@fontsource/inter` import (top), `--font-sans: "Inter"...`, `--font-serif: "Times New Roman"...`, override `--background`, `--foreground`, `--card`, `--border` tokens to the carbon palette, add subtle noise background utility `@utility paper-noise` and `@utility desk-noise`.
- `src/main.tsx` if needed for fontsource imports (otherwise import in `styles.css` via `@import "@fontsource/inter/...";`).

Packages to add: `motion` (Framer Motion v11 successor — used as `motion/react`), `zustand`, `jszip`, `@fontsource/inter`, `date-fns`, `uuid`.

## Technical details

- **No Next.js**: prompt mentioned Next App Router; we build the equivalent in TanStack Start. No routing changes beyond `/`.
- **Animation primitive**: one `motion.div` for the chat shell with `layout` and conditional className that swaps tailwind sizing between center/corner. Inner content (`transcript`, `input`) also gets `layout` so children re-flow smoothly. The document pane uses `<AnimatePresence>` keyed on `mode === "generating" || hasDocument`.
- **Streaming mock**: `mockGenerator` is an async generator yielding tokens at 25–60ms intervals; `DocumentPane` consumes it and appends to a `content` string state. The final string is also written to `chat.documents` on completion.
- **Accessibility**: textarea has visible focus ring (off-white 1px), buttons have aria-labels, dialog uses shadcn Dialog (focus trap built-in). Reduced-motion: when `prefers-reduced-motion`, skip the spring and crossfade panes over 200ms.
- **Tokens**: define carbon palette in `src/styles.css` `:root` (oklch equivalents) so utilities like `bg-background`, `text-foreground`, `border-border` Just Work. No hardcoded hex in components except the paper white inside `DocumentPane`.

## Out of scope (MVP)

- Real AI calls, real document export to PDF/DOCX, real auth, real billing. Settings/Account dialogs persist to localStorage only. Attach button opens file picker but only displays filename chip (no upload).

Ready to build on approval.
