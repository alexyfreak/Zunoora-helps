# ZUNOORA — Full Project Documentation

> **AI-powered document assistant for Uzbek teachers**
> Built with TanStack Start · React 19 · Tailwind v4 · Supabase · Groq AI

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [File-by-File Reference](#5-file-by-file-reference)
6. [Database Schema (Supabase)](#6-database-schema-supabase)
7. [Configuration & Environment Variables](#7-configuration--environment-variables)
8. [UI Design System](#8-ui-design-system)
9. [Animation & Interaction Model](#9-animation--interaction-model)
10. [Known Issues & Fixes](#10-known-issues--fixes)
11. [How to Run](#11-how-to-run)
12. [Future Improvements](#12-future-improvements)

---

## 1. Project Overview

Zunoora is a single-page application that helps Uzbek-language teachers create professional documents (applications, lesson plans, syllabi, reports, etc.) through a chat-based AI interface. The user types a request in Uzbek, the app detects which document type they need, fetches a template, fills in teacher data from Supabase, checks for missing fields, and generates the final document — either via AI (Groq API) or basic template replacement.

**Key features:**
- Chat-based conversation with an Uzbek-language AI assistant
- Document type detection (8 types: ariza, ish_tabeli, ktp, oum, bsb_chb, sillabus, hisobot, tushuntirish_xati)
- Template-based document generation with teacher data
- AI-powered document creation (Groq API, llama-3.3-70b-versatile)
- Live markdown document preview ("paper on a dark desk" aesthetic)
- .docx export and batch .zip download
- Chat history with date filtering and sorting
- Framer Motion spring animations for chat-to-corner transition
- Dark carbon theme with warm off-white accents

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | TanStack Start (v1) | SSR-capable React framework (Vinxi/Nitro under the hood) |
| **React** | 19.2.0 | UI library |
| **Routing** | TanStack Router (v1) | File-based routing, auto-generated route tree |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Utility-first CSS with Radix UI primitives |
| **State** | Zustand + persist middleware | Client-side store (localStorage key `zunoora.v1`) |
| **Animation** | Framer Motion / motion/react | Layout transitions, spring animations |
| **Backend/DB** | Supabase (PostgreSQL) | Teachers & shablons tables, RLS policies |
| **AI** | Groq API (llama-3.3-70b-versatile) | Proxied through `/api/groq` server endpoint |
| **Export** | docx + JSZip | .docx generation & batch .zip download |
| **Build** | Vite 8 + Nitro | Dev server & production build (Cloudflare target) |
| **Package** | npm / bun | Dependency management |

---

## 3. Directory Structure

```
UI-mvp/
├── .dev.vars                          # Cloudflare dev secrets (GROQ_API_KEY)
├── .env                               # Environment variables (keys)
├── .env.example                       # Template for .env
├── .gitignore
├── .prettierrc / .prettierignore      # Code formatting
├── AGENTS.md                          # AI dev guidelines (Lovable + diagnostics)
├── bunfig.toml                        # Bun config (min release age guard)
├── components.json                    # shadcn/ui config
├── eslint.config.js                   # ESLint flat config
├── opencode.json                      # OpenCode AI config
├── package.json                       # Dependencies & scripts
├── tsconfig.json                      # TypeScript config
├── vite.config.ts                     # Vite + TanStack Start config
│
├── .lovable/
│   ├── plan.md                        # Original MVP plan document
│   └── project.json                   # Lovable template metadata
│
├── public/
│   └── favicon.ico
│
├── scripts/
│   ├── check-db.mjs                   # Check if Supabase tables exist
│   └── seed.mjs                       # Seed 10 teachers + 8 shablons via service_role
│
├── supabase/
│   ├── migration.sql                  # Schema: teachers, shablons, chat_sessions
│   └── seed.sql                       # Full SQL seed data (Uzbek)
│
├── src/
│   ├── router.tsx                     # TanStack Router factory with QueryClient
│   ├── routeTree.gen.ts               # Auto-generated route tree
│   ├── server.ts                      # Cloudflare-style server entry + /api/groq proxy
│   ├── start.ts                       # TanStack Start instance with error middleware
│   ├── styles.css                     # Tailwind v4 + carbon theme + custom utilities
│   ├── vite-env.d.ts                  # ImportMetaEnv type declarations
│   │
│   ├── routes/
│   │   ├── __root.tsx                 # Root layout: SEO meta, QueryClientProvider, error/404
│   │   └── index.tsx                  # Home route: renders <AppShell />
│   │
│   ├── components/
│   │   ├── ui/                        # 49 shadcn/ui components (Radix primitives)
│   │   └── zunoora/                   # Application-specific components
│   │       ├── AppShell.tsx           # Sidebar + MainStage layout
│   │       ├── Sidebar.tsx            # 260px left sidebar: brand, history, filters, actions
│   │       ├── HistoryList.tsx        # Filtered/sorted chat list with download/delete
│   │       ├── DateFilterPopover.tsx  # Date range picker (Calendar popover)
│   │       ├── MainStage.tsx          # State machine orchestrator (idle → generating → ready)
│   │       ├── ChatPanel.tsx          # Animated chat shell (center ↔ corner transition)
│   │       ├── ChatTranscript.tsx     # Message bubbles, thinking indicator, scroll-to-bottom
│   │       ├── ChatInput.tsx          # Auto-growing textarea, attach, send button
│   │       ├── ModelToggle.tsx        # Standard Output / Deep Analysis pill toggle
│   │       ├── DocumentPane.tsx       # White paper preview with markdown→HTML
│   │       ├── SettingsDialog.tsx     # Dense sidebar / reduced motion toggles
│   │       └── AccountDialog.tsx      # Email lookup, name editing, AI connection status
│   │
│   ├── hooks/
│   │   └── use-mobile.tsx             # Mobile detection via matchMedia
│   │
│   └── lib/
│       ├── utils.ts                   # cn() helper (clsx + tailwind-merge)
│       ├── error-capture.ts           # Error capturing for SSR recovery
│       ├── error-page.ts              # Minimal HTML error page
│       ├── lovable-error-reporting.ts # Lovable error reporting bridge
│       └── zunoora/
│           ├── store.ts               # Zustand store (chats, messages, documents, account)
│           ├── supabase.ts            # Supabase client + types + all DB queries
│           ├── shablons.ts            # Keyword detection, missing fields, template filler
│           ├── gemini.ts              # Groq API client + chat/gen/shablon functions (Uzbek)
│           ├── documentPipeline.ts    # Document generation pipeline (detect → fetch → fill)
│           ├── mockGenerator.ts       # Deterministic mock document generator
│           ├── docx.ts                # .docx generation from markdown
│           ├── download.ts            # .zip download for all chat documents
│           └── seed.ts                # TypeScript seed function (mirrors SQL seed)
```

---

## 4. Architecture & Data Flow

### 4.1 Rendering Model

TanStack Start uses **SSR (Server-Side Rendering)** via Vinxi/Nitro with a Cloudflare Workers target. The app:
1. Serves the initial HTML from the server (SSR)
2. Hydrates into a full SPA on the client
3. Uses `motion/react` for client-side animations
4. Communicates with external services via client-side fetch (with `/api/groq` server proxy)

### 4.2 Data Flow: Document Generation Pipeline

```
User types prompt in Uzbek
        │
        ▼
┌─────────────────────────────┐
│  MainStage.onSend(text)     │
│  • Adds user message        │
│  • Sets mode="generating"   │
│  • Calls runPipeline()      │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  documentPipeline.ts        │
│  runPipeline(prompt, email) │
│                             │
│  1. detectShablonType()     │  ← keyword matching in shablons.ts
│  2. fetchShablonByType()    │  ← Supabase query
│  3. fetchTeacherByEmail()   │  ← Supabase query
│  4. findMissingFields()     │  ← compare schema.required vs teacher data
│     ├─ If missing → return  │
│     │  questions to user    │
│     │  (await answers via   │
│     │   continuePipeline()) │
│     └─ If complete →        │
│        generateAndDisplay() │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  generateAndDisplay()       │
│                             │
│  if GROQ_API_KEY exists:    │
│    generateDocument()       │  ← AI-powered (Groq API)
│  else:                      │
│    fillTemplate()           │  ← Basic {{placeholder}} replacement
│                             │
│  Stream result in chunks    │
│  (50 words at 20ms delay)   │
│  via document_chunk events  │
│                             │
│  Final: document_ready      │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  MainStage handles events   │
│                             │
│  assistant_reply →          │
│    addMessage()             │
│  question →                 │
│    addMessage() + store     │
│    pending pipeline state   │
│  document_chunk →           │
│    setDocContent()          │
│  document_ready →           │
│    addDocument() +          │
│    setMode("ready")         │
└─────────────────────────────┘
```

### 4.3 State Management (Zustand)

The Zustand store (`store.ts`) uses `persist` middleware to save to localStorage key `zunoora.v1`. Persisted data:
- `chats[]` — array of Chat objects (messages, documents, model)
- `activeChatId` — currently selected chat
- `account` — { name, email }
- `credits` — display number

Non-persisted (resets on reload):
- `pendingShablon`, `pendingTeacher`, `pendingMissingFields` — pipeline state

### 4.4 Server-Side Proxy (`/api/groq`)

The browser sends AI requests to `/api/groq` (same origin) to avoid CORS issues. The server (`server.ts:42-81`) forwards the request to `https://api.groq.com/openai/v1/chat/completions` with the API key from environment variables.

---

## 5. File-by-File Reference

### 5.1 Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies: React 19, TanStack Start/Router, Tailwind v4, shadcn/ui, Framer Motion, Supabase, Groq, docx, JSZip, Zustand |
| `tsconfig.json` | TS 5.8, `@/*` path alias, bundler module resolution, strict mode |
| `vite.config.ts` | Uses `@lovable.dev/vite-tanstack-config`, sets server entry to `server.ts`, excludes `docx` from optimizeDeps |
| `eslint.config.js` | TypeScript-ESLint flat config, Prettier integration, bans `server-only` imports |
| `components.json` | shadcn/ui config: New York style, slate base, Lucide icons |
| `bunfig.toml` | 24h minimum release age guard (with Lovable package exceptions) |

### 5.2 Source Files — Core

| File | Lines | Purpose |
|------|-------|---------|
| `src/server.ts` | 103 | Cloudflare-style fetch handler; serves `/api/groq` proxy; SSR error normalization; reads GROQ_API_KEY from env → process.env → VITE_GROQ_API_KEY |
| `src/start.ts` | 22 | TanStack Start instance with error-catching middleware |
| `src/router.tsx` | 10 | Creates TanStack Router with QueryClient |
| `src/styles.css` | 129 | Tailwind v4 imports, Inter font, carbon theme CSS variables, `paper-noise`, `desk-vignette`, `serif-italic` utilities |
| `src/routes/__root.tsx` | 137 | HTML shell, SEO meta/OG tags, 404 page, error boundary with retry, QueryClientProvider |
| `src/routes/index.tsx` | 22 | Renders `<AppShell />` |

### 5.3 Source Files — Zunoora Library

| File | Lines | Purpose |
|------|-------|---------|
| `store.ts` | 165 | Zustand store: Chat/Message/Document types, CRUD operations, persist middleware, pipeline state, filters/sort |
| `supabase.ts` | 104 | Supabase client creation, Teacher/Shablon types, fetch functions (by ID, email, type), DB seeding check |
| `shablons.ts` | 132 | Uzbek keyword map for 8 document types, `detectShablonType()` with scoring, `findMissingFields()`, `fillTemplate()` placeholders, FIELD_META with Uzbek labels/questions |
| `gemini.ts` | 174 | Groq API client (client-side: `/api/groq` proxy, SSR: direct), `chatWithGemini()`, `detectShablonWithAI()`, `generateDocument()`, `generateMissingFieldQuestions()` — all in Uzbek |
| `documentPipeline.ts` | 201 | `runPipeline()` — main pipeline: detect shablon → fetch template → check missing fields → generate → stream; `continuePipeline()` — handle answers; `parseAnswers()` — parse numbered user responses |
| `mockGenerator.ts` | 102 | Deterministic mock lesson plan generator (keyword-based topic selection, streaming token yield) |
| `docx.ts` | 114 | `generateDocx()` — converts markdown headings/bold/italic/lists/hr to `docx` library Document objects, triggers blob download |
| `download.ts` | 24 | `downloadChatDocs()` — zips all chat documents via JSZip, triggers download |
| `seed.ts` | 244 | TypeScript seed: 10 teachers + 8 shablons (mirrors SQL seed data) |

### 5.4 Source Files — Components

| File | Lines | Purpose |
|------|-------|---------|
| `AppShell.tsx` | 11 | Flex layout: `Sidebar` + `MainStage` |
| `Sidebar.tsx` | 72 | Brand logo, History header, filters, scrollable `HistoryList`, New chat button, settings/account dialogs, credits pill |
| `HistoryList.tsx` | 86 | Filtered/sorted chat list, formatDistanceToNow time display, doc count, download-all (.zip), delete button |
| `DateFilterPopover.tsx` | 76 | Calendar range picker with "Any date" default, X clear button |
| `MainStage.tsx` | 199 | State machine (`idle`/`generating`/`ready`), `onSend()` orchestrator, pipeline event handler, `onExpand()`, pending pipeline answers, chat reset on switch |
| `ChatPanel.tsx` | 62 | `motion.div` with `layout` spring animation, switches between center (72vh, 720px) and corner (460×380px, fixed bottom-right), expand button in corner mode |
| `ChatTranscript.tsx` | 99 | Message list: user bubbles (right, surface-hover), assistant (left, warm Zunoora byline), bold→warm span, thinking dots animation, auto-scroll |
| `ChatInput.tsx` | 97 | Auto-growing textarea (1-6 rows), file attach button (name chip display), Enter to send, Send button (warm circle), disabled state |
| `ModelToggle.tsx` | 40 | Segmented pill toggle: Standard Output / Deep Analysis, animated active pill with `layoutId` |
| `DocumentPane.tsx` | 134 | White paper (`#FAFAF7`), markdown→HTML render, streaming cursor blink, auto-scroll on stream, "Composing..." / "Document ready" status, Download .docx button, CSS paper noise texture |
| `SettingsDialog.tsx` | 43 | shadcn Dialog with Dense sidebar / Reduced motion switches |
| `AccountDialog.tsx` | 87 | Email input → Supabase teacher lookup, name editing, AI connection status indicator (green/yellow dot) |

### 5.5 Error Handling

| File | Purpose |
|------|---------|
| `error-capture.ts` | Captures window `error` and `unhandledrejection` events, stores with TTL for SSR recovery |
| `error-page.ts` | Renders minimal HTML error page with "Try again" / "Go home" buttons |
| `lovable-error-reporting.ts` | Reports errors to Lovable's `window.__lovableEvents` |
| `__root.tsx` ErrorComponent | TanStack Router error boundary with `router.invalidate()` retry |

---

## 6. Database Schema (Supabase)

### 6.1 Table: `teachers`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `full_name` | `text NOT NULL` | Full name (Uzbek) |
| `age` | `integer` | Age |
| `subject` | `text` | Subject taught |
| `classes` | `text[]` | Array of class names (e.g., `{"9-A","9-B"}`) |
| `phone` | `text` | Phone number |
| `email` | `text` | Email (used for lookup) |
| `school` | `text` | School name |
| `position` | `text` | Position (e.g., O'qituvchi, Direktor) |
| `extra_info` | `jsonb` | Additional metadata |
| `created_at` | `timestamptz` | Auto-set |

**RLS:** Authenticated users can select/insert/update.

### 6.2 Table: `shablons`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `type` | `text UNIQUE` | Identifier (ariza, ish_tabeli, ktp, etc.) |
| `label` | `text NOT NULL` | Display name (Uzbek) |
| `description` | `text` | Description |
| `keywords` | `text[]` | Search keywords |
| `schema` | `jsonb` | `{ required: string[], optional: string[] }` |
| `template` | `text NOT NULL` | Template with `{{placeholder}}` markers |
| `created_at` | `timestamptz` | Auto-set |

**RLS:** Authenticated users can select/insert.

### 6.3 Table: `chat_sessions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid PK` | Auto-generated |
| `teacher_id` | `uuid FK → teachers` | Linked teacher |
| `title` | `text` | Chat title |
| `messages` | `jsonb` | Messages array |
| `documents` | `jsonb` | Documents array |
| `created_at` | `timestamptz` | Auto-set |
| `updated_at` | `timestamptz` | Auto-set |

**Note:** `chat_sessions` table exists in schema but is **not currently used** by the app — all chats are stored client-side in Zustand/localStorage.

### 6.4 Seed Data

- **10 teachers** with Uzbek names, subjects, classes, schools
- **8 shablon types** each with keywords, field schemas, and full templates:
  - `ariza` — Application (formal request)
  - `ish_tabeli` — Work schedule table
  - `ktp` — Calendar-thematic plan
  - `oum` — Educational-methodological complex
  - `bsb_chb` — Summative assessment results
  - `sillabus` — Syllabus
  - `hisobot` — Report (quarterly/yearly)
  - `tushuntirish_xati` — Explanatory letter

---

## 7. Configuration & Environment Variables

### 7.1 `.env` (development)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_GROQ_API_KEY` | Groq API key (client-side VITE_ prefixed) |
| `GROQ_API_KEY` | Groq API key (server-side) |

### 7.2 `.dev.vars` (Cloudflare dev secrets)

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Server-side Groq key for local Cloudflare dev |

### 7.3 Key Loading Order (server.ts:44-48)

```
1. env?.GROQ_API_KEY       ← Cloudflare Workers env binding (optional chaining)
2. process.env.GROQ_API_KEY ← Node.js / local process env
3. import.meta.env.VITE_GROQ_API_KEY ← Vite client env
```

---

## 8. UI Design System

### 8.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--carbon` | `oklch(0.12 0 0)` = `#0A0A0A` | Page background |
| `--surface` | `oklch(0.16 0 0)` = `#111111` | Card surfaces |
| `--surface-hover` | `oklch(0.20 0 0)` = `#1A1A1A` | Hover states |
| `--hairline` | `oklch(1 0 0 / 0.06)` | Subtle borders |
| `--warm` | `oklch(0.94 0.015 85)` = `#F5F1E8` | Active states, send button |
| `--foreground` | `oklch(0.93 0 0)` = `#EDEDED` | Primary text |
| `--muted-foreground` | `oklch(0.60 0 0)` = `#8A8A8A` | Secondary text |

### 8.2 Typography

- **UI:** Inter (400/500/600) via `@fontsource/inter`
- **Accents:** Times New Roman italic (serif-italic utility)
- **Document preview:** Times New Roman (paper aesthetic)

### 8.3 Custom CSS Utilities (`src/styles.css`)

- `serif-italic` — Elegant Times italic for headers/bylines
- `paper-noise` — Subtle dot pattern for paper texture
- `desk-vignette` — Radial gradient vignette overlay

---

## 9. Animation & Interaction Model

### 9.1 State Machine (MainStage.tsx)

```
         ┌─────────┐
         │  idle   │ ← initial state, no document
         └────┬────┘
              │ onSend()
              ▼
         ┌────────────┐
         │ generating │ ← chat shrinks to corner, document appears
         └─────┬──────┘
               │ document_ready event
               ▼
         ┌─────────┐
         │  ready  │ ← document remains, chat stays in corner
         └────┬────┘
              │ onExpand() / newChat()
              ▼
         ┌─────────┐
         │  idle   │
         └─────────┘
```

### 9.2 Chat Panel Transition (ChatPanel.tsx)

- Uses `motion.div` with `layout` prop
- Spring: `{ stiffness: 180, damping: 26 }`, ~0.7s duration
- **Center mode:** relative, 72vh height, max-w-2xl (720px)
- **Corner mode:** fixed bottom-right, 460×380px, backdrop blur, shadow

### 9.3 Document Pane Entry (DocumentPane.tsx)

- Uses `<AnimatePresence>` keyed on `showDoc`
- Fades in with spring: `{ stiffness: 160, damping: 24 }`, 0.15s delay
- Status line has animated gradient underline (4s loop while streaming)
- Streaming cursor: blinking `[2px]` bar

---

## 10. Known Issues & Fixes

### 10.1 🔴 FIXED: `env.GROQ_API_KEY` TypeError (server crash)

**Error:**
```
POST http://localhost:8080/api/groq 500 (Internal Server Error)
TypeError: Cannot read properties of undefined (reading 'GROQ_API_KEY')
```

**Root Cause:** `server.ts:45` — The `env` parameter in `handleGroqProxy(request, env)` is `undefined` when running locally via TanStack Start/Vite dev server. The Cloudflare Workers pattern (`env` as binding) doesn't apply in dev mode. Accessing `env.GROQ_API_KEY` on `undefined` throws a TypeError before the fallback to `process.env.GROQ_API_KEY` is reached.

**Fix:** Added optional chaining: `env?.GROQ_API_KEY` at `server.ts:45`.

**File:** `src/server.ts:45`
```ts
// BEFORE: (env.GROQ_API_KEY as string) ||
// AFTER:  (env?.GROQ_API_KEY as string) ||
```

### 10.2 🟡 OPEN: Chat sessions table unused

The `chat_sessions` table exists in the Supabase schema (`supabase/migration.sql`) but is never written to or read from in the application. All chat state is client-side only (Zustand localStorage). This means chat history is lost on browser clear.

**Suggested fix:** Implement server-side persistence using the `chat_sessions` table.

### 10.3 🟡 OPEN: No authentication

Supabase is configured with RLS for authenticated users, but the app has no login flow. The `anon` key is used, which means the RLS policies are effectively bypassed. The Account dialog only does email lookups against the teachers table.

### 10.4 🟡 OPEN: `seedDatabase()` RPC stub

`supabase.ts:97-103` has a stub that tries to run SQL via `supabase.rpc("exec_sql")` which won't work in production. Actual seeding must be done via SQL Editor or `scripts/seed.mjs` with the service_role key.

### 10.5 🟢 NOTE: Mock generator vs real AI

`mockGenerator.ts` is legacy from the initial MVP and is no longer imported by any component. The real pipeline (`documentPipeline.ts`) uses the Groq AI or template filler. The mock generator can be removed.

### 10.6 🟢 NOTE: `gemini.ts` naming

Despite being named `gemini.ts`, the file uses **Groq API** (not Google Gemini). The `VITE_GROQ_API_KEY` / `GROQ_API_KEY` variables are correctly named. The file name is misleading but functional.

---

## 11. How to Run

### 11.1 Prerequisites

- Node.js 18+ or Bun
- A Supabase project with the schema applied
- A Groq API key (free at https://console.groq.com)

### 11.2 Setup

```bash
cd UI-mvp

# Install dependencies
npm install
# or
bun install

# Copy env file and fill in your keys
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and Groq API key

# Apply database schema (via Supabase SQL Editor)
# Open supabase/migration.sql and run in Supabase dashboard

# Seed the database
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
node scripts/seed.mjs
```

### 11.3 Development

```bash
npm run dev
# Opens at http://localhost:8080
```

### 11.4 Build & Preview

```bash
npm run build
npm run preview
```

### 11.5 Lint

```bash
npm run lint
```

---

## 12. Future Improvements

1. **Server-side chat persistence** — Use `chat_sessions` table with Supabase
2. **Authentication** — Add login flow (Supabase Auth) so RLS actually protects data
3. **PDF export** — Add pdf-lib or similar for PDF generation alongside .docx
4. **File upload** — Process uploaded files (images, PDFs) for AI context
5. **Multi-language support** — Add Russian/English UI alongside Uzbek
6. **Streaming AI responses** — Use Groq's streaming API for real-time token display
7. **Edit generated documents** — Allow in-app editing before download
8. **Real credit system** — Integrate with billing API instead of hardcoded display
9. **Teacher management UI** — Add CRUD for teachers within the app
10. **Shablon designer** — Allow users to create/edit templates in-app

---

*Generated 2026-07-04 · Zunoora UI-MVP*
