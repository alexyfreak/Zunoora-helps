# Zunoora — Architecture & Implementation Master Plan

## 1. Project Overview

Zunoora is a school document generation app built with TanStack Start + React + Vite + TypeScript + Supabase. Teachers type natural language requests like "tushuntirish xati yozing direktor uchun", and the app generates formatted Word documents (.docx).

**Current status:** AI-dependent (Groq API). Documents fall back to basic template filling when AI is unavailable.

**Target state:** Zero AI dependency for standard cases. Collect ALL school entities (teachers, directors, pupils, classes, schools) in the database so document generation is purely data-driven. AI becomes optional — only used for first-time prose generation, not for lookups or filling.

---

## 2. File Inventory

### Core App Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Cloudflare Workers entry — SSR + `/api/groq` proxy |
| `src/app.ts` | TanStack app root |
| `src/router.ts` | Route definitions |
| `src/config.ts` | App config |

### Zunoora Library (`src/lib/zunoora/`)

| File | Purpose |
|------|---------|
| `supabase.ts` | Supabase client + queries (`fetchTeacherByEmail`, `fetchShablonByType`, `fetchAllTeachers`, `ensureDatabaseSeeded`) |
| `gemini.ts` | **Misnamed** — actually Groq AI client. Functions: `groqChat`, `chatWithGemini`, `detectShablonWithAI`, `generateDocument`, `generateMissingFieldQuestions`, `isGeminiAvailable` |
| `documentPipeline.ts` | Pipeline orchestrator. Functions: `runPipeline` (entry), `detectShablonType` (keyword), `findMissingFields`, `generateAndDisplay`, `continuePipeline`, `parseAnswers` |
| `shablons.ts` | `FIELD_META` (21 field → label/question mappings), `SHABLON_KEYWORDS` (8 types → search keywords), `SELF_INTRO` |
| `templateProcessor.ts` | `fillTemplate` — basic `{{placeholder}}` string replacement |
| `store.ts` | Zustand store — chats, messages, documents, account, pipeline state |
| `docx.ts` | `generateDocx` — converts document text to .docx blob + download |
| `textUtils.ts` | Uzbek date formatting, text utilities |

### Components (`src/components/`)

| File | Purpose |
|------|---------|
| `zunoora/MainStage.tsx` | Main orchestrator — state machine (idle → generating → ready), handles `onSend` → pipeline → events |
| `zunoora/ChatInput.tsx` | Text input + attachment button |
| `zunoora/MessageList.tsx` | Chat message rendering |
| `zunoora/DocPreview.tsx` | Generated document preview |
| `zunoora/AccountDialog.tsx` | Email/name input for teacher lookup |

### Database

| File | Purpose |
|------|---------|
| `supabase/migration.sql` | DDL — creates `teachers`, `shablons`, `chat_sessions` tables |
| `db/seed/shablons.ts` | FIELD_META, SHABLON_KEYWORDS, shablon template definitions (8 types) |
| `db/seed/seed.ts` | Seed script — inserts 10 teachers + 8 shablons |
| `scripts/seed.mjs` | Runner for seed.ts |
| `db/seed/seed.sql` | Raw SQL version of seed data |

### Config

| File | Purpose |
|------|---------|
| `.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GROQ_API_KEY`, `GROQ_API_KEY` |
| `.dev.vars` | Cloudflare Workers local env (GROQ_API_KEY) |
| `vite.config.ts` | Uses `@lovable.dev/vite-tanstack-config` |
| `tsconfig.json` | TypeScript config |
| `eslint.config.js` | ESLint + Prettier config |

---

## 3. Current Database Schema

### `teachers` table
```
id            uuid PK
full_name     text NOT NULL    -- "Abdullayev Azizjon Alisher o'g'li"
age           integer
subject       text             -- "Matematika"
classes       text[]           -- {"9-A","9-B"}
phone         text
email         text             -- used for login lookup
school        text             -- "21-umumiy o'rta maktab"
position      text             -- "O'qituvchi" | "Direktor"
extra_info    jsonb
created_at    timestamptz
```

### `shablons` table
```
id            uuid PK
type          text UNIQUE      -- "ariza" | "ish_tabeli" | "ktp" | "oum" | "bsb_chb" | "sillabus" | "hisobot" | "tushuntirish_xati"
label         text NOT NULL    -- Display name in Uzbek
description   text
keywords      text[]           -- Search keywords
schema        jsonb            -- { required: string[], optional: string[] }
template      text NOT NULL    -- Template with {{placeholder}} markers
created_at    timestamptz
```

### `chat_sessions` table *(unused — all chat state is in localStorage)*
```
id            uuid PK
teacher_id    uuid FK
title         text
messages      jsonb
documents     jsonb
created_at    timestamptz
updated_at    timestamptz
```

---

## 4. The Data-Model-First Vision

### New Entities to Add

#### `directors` table
```sql
CREATE TABLE directors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text NOT NULL,
  school_id   uuid REFERENCES schools(id) ON DELETE SET NULL,
  phone       text,
  email       text UNIQUE,
  position    text DEFAULT 'Direktor',
  created_at  timestamptz DEFAULT now()
);
```

#### `schools` table
```sql
CREATE TABLE schools (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  address     text,
  phone       text,
  director_id uuid REFERENCES directors(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);
```

#### `pupils` table
```sql
CREATE TABLE pupils (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name   text NOT NULL,
  class_id    uuid REFERENCES classes(id) ON DELETE SET NULL,
  parent_name text,
  parent_phone text,
  created_at  timestamptz DEFAULT now()
);
```

#### `classes` table
```sql
CREATE TABLE classes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,           -- "9-A", "10-B"
  school_id       uuid REFERENCES schools(id) ON DELETE CASCADE,
  form_teacher_id uuid REFERENCES teachers(id) ON DELETE SET NULL,
  academic_year   text,
  UNIQUE(name, school_id, academic_year)
);
```

#### `documents` table (replaces localStorage)
```sql
CREATE TABLE documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid REFERENCES teachers(id) ON DELETE CASCADE,
  shablon_id  uuid REFERENCES shablons(id) ON DELETE SET NULL,
  title       text,
  content     text,
  fields_used jsonb,           -- snapshot of all field values used
  created_at  timestamptz DEFAULT now()
);
```

### Entity Relationship Diagram (text)
```
schools ──1:N──> classes ──1:N──> pupils
  │                  │
  │                  └── N:1 ── teachers (form_teacher)
  │
  └── 1:1 ── directors
  │
  └── 1:N ── teachers (work at this school)

teachers ──1:N──> documents
shablons ──1:N──> documents
```

### Seed Data Plan

**Schools:**
- "21-umumiy o'rta maktab" (director: Sultonov Bahrom Karim o'g'li)
- "5-IDUM" (director: TBD)
- "35-maktab" (director: TBD)
- "12-umumiy o'rta maktab" (director: TBD)
- "1-ixtisoslashtirilgan maktab" (director: TBD)

**Directors:**
- Sultonov Bahrom Karim o'g'li → 21-maktab (already in teachers table with position=Direktor, move to directors)
- Add 4 more directors for other schools

**Classes:**
- 9-A, 9-B, 10-A, 10-B, 11-A, 11-B (per school)

**Pupils:**
- 15-25 pupils per class (generated or imported)

---

## 5. Smart Resolver System

### The Core Problem

Currently, when a teacher types "tushuntirish xati yozing direktor uchun", the pipeline:
1. Detects shablon type via keyword matching
2. Fetches teacher + shablon from DB
3. Compares required fields against available data
4. Asks the user for EVERY missing field (including recipient_name, recipient_title, etc.)

### The Smart Resolver Solution

Replace step 3-4 with a **resolver chain** that tries multiple sources before asking the user:

```
findMissingFields(shablon, teacher, context)
  → for each required field:
      1. Check teacher record (sender_name, sender_position, school, subject)
      2. Check context/previous answers
      3. Resolve from related entities (directors, classes, pupils)
      4. Resolve from document history (previous similar documents)
      5. ONLY THEN → prompt user
```

#### Resolver Registry

```typescript
type Resolver = {
  field: string;
  priority: number;          // higher = tried first
  resolve: (ctx: ResolutionContext) => Promise<string | null>;
};

// Example resolvers:
const RESOLVERS: Resolver[] = [
  // Recipient resolvers
  {
    field: "recipient_title",
    priority: 100,
    resolve: async (ctx) => {
      // If user said "direktor", "mudir", etc. → derive title
      const roleMap: Record<string, string> = {
        direktor: "Direktor",
        mudir: "Mudir",
        boshliq: "Bo'lim boshlig'i",
      };
      return roleMap[ctx.userIntent?.recipient?.toLowerCase()] ?? null;
    },
  },
  {
    field: "recipient_name",
    priority: 90,
    resolve: async (ctx) => {
      // If recipient is director, find director of teacher's school
      if (ctx.userIntent?.recipient === "direktor") {
        const director = await findDirectorBySchool(ctx.teacher.school);
        return director?.full_name ?? null;
      }
      return null;
    },
  },
  // Date resolver
  {
    field: "date",
    priority: 80,
    resolve: async () => formatUzbekDate(new Date()),  // always "Bugungi sana"
  },
  // Content field resolvers (check document history)
  {
    field: "letter_topic",
    priority: 50,
    resolve: async (ctx) => {
      // Check if teacher has a previous tushuntirish_xati with same recipient
      const prev = await findPreviousDocument(ctx.teacher.id, "tushuntirish_xati", { recipient_name: ctx.fields.recipient_name });
      return prev?.fields_used?.letter_topic ?? null;
    },
  },
];
```

### Intent Parsing (upgrade from keyword matching)

Currently `detectShablonType()` just scores keywords. Replace with a structured **intent parser**:

```typescript
type UserIntent = {
  shablonType: string | null;
  recipient?: string;        // "direktor", "mudir", ...
  recipientName?: string;    // explicit name if given
  subject?: string;          // "matematika", "fizika", ...
  class?: string;            // "9-a", "10-b", ...
  timeframe?: string;        // "1-chorak", "2025-2026", ...
  topic?: string;            // for letters, the specific topic
  reason?: string;           // short description of the issue
};
```

Parse from user input using simple patterns (no AI needed):

```typescript
function parseIntent(prompt: string): UserIntent {
  const lower = prompt.toLowerCase();
  const intent: UserIntent = { shablonType: null };

  // Detect shablon type
  for (const [type, keywords] of Object.entries(SHABLON_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      intent.shablonType = type;
      break;
    }
  }

  // Detect recipient role
  if (lower.includes("direktor")) intent.recipient = "direktor";
  else if (lower.includes("mudir")) intent.recipient = "mudir";

  // Detect explicit names (capitalized words after "uchun", "ga", "dan")
  const nameMatch = prompt.match(/(?:uchun|ga|dan)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
  if (nameMatch) intent.recipientName = nameMatch[1];

  return intent;
}
```

---

## 6. Progressive Fill Algorithm

### Flow Diagram

```
User: "tushuntirish xati yozing direktor uchun"
  │
  ├── 1. parseIntent() → { shablonType: "tushuntirish_xati", recipient: "direktor" }
  │
  ├── 2. fetchShablonByType("tushuntirish_xati") → { required: [recipient_title, recipient_name, sender_name, sender_position, letter_topic, explanation, date] }
  │    fetchTeacherByEmail("azizjon@school.uz") → { full_name: "Abdullayev A.A.", position: "O'qituvchi", school: "21-umumiy o'rta maktab", ... }
  │
  ├── 3. resolveFields(required, teacher, intent)
  │      ├── date → "4-iyul 2026"                                   (runtime)
  │      ├── sender_name → "Abdullayev Azizjon Alisher o'g'li"      (teacher.full_name)
  │      ├── sender_position → "O'qituvchi"                         (teacher.position)
  │      ├── recipient_title → "Direktor"                           (intent.recipient → roleMap)
  │      ├── recipient_name → "Sultonov Bahrom Karim o'g'li"        (findDirectorBySchool)
  │      ├── letter_topic → ?                                       NOT FOUND → ask user
  │      └── explanation → ?                                        NOT FOUND → ask user
  │
  ├── 4. Ask: "Xat mavzusi nima?" → user: "Darsga kechikish sababi"
  │    Ask: "Tushuntirish matnini yozing:" → user: "9-A sinf matematika..."
  │
  └── 5. fillTemplate(template, allFields) → complete document
        (No AI involved. Pure data-driven.)
```

### The Two-Phase Question Strategy

When fields are missing, don't dump all questions at once. Use a **conversational funnel**:

**Phase 1 — Entity resolution** (resolve from DB before asking):
- "Siz direktor uchun yozyapsiz. Bu Sultonov Bahrom Karim o'g'limi?" (confirm, not ask)

**Phase 2 — Content gap filling** (only truly creative fields):
- "Xat mavzusi nima?" (letter_topic)
- "Tushuntirish matnini yozing:" (explanation)

Goal: Reduce user cognitive load. Most fields are auto-resolved. User answers only 1-3 creative questions.

---

## 7. Pipeline Refactoring Plan

### Current Pipeline (`documentPipeline.ts`)

```
runPipeline(prompt, email, onEvent)
  → detectShablonType(prompt)            // keyword scoring
  → fetchShablonByType(type)             // DB query
  → fetchTeacherByEmail(email)           // DB query
  → findMissingFields(shablon, teacher)  // compare required vs available
  → if missing: ask user
  → generateAndDisplay(shablon, teacher, extraFields)
    → if AI available: generateDocument()  // Groq API
    → else: fillTemplate()                 // basic replacement
```

### Target Pipeline

```
runPipeline(prompt, email, onEvent)
  → parseIntent(prompt)                   // structured intent parsing
  → fetchShablonByType(intent.type)       // DB query
  → fetchTeacherByEmail(email)            // DB query

  → resolveFields(shablon, teacher, intent)
    // For each required field, try:
    //   1. teacher record
    //   2. related entities (directors, schools, classes)
    //   3. document history
    //   4. intent data
    //   5. runtime calculation (date, academic_year)
    // Only remaining unfilled fields reach the user

  → if unresolved.length > 0:
      askQuestions(unresolved)            // conversational, 1-2 at a time

  → generateDocument(shablon, allFields)
    // NO AI. Pure fillTemplate + smart defaults.
    // For content fields (explanation, goals, reason):
    //   - Check document history for similar documents
    //   - Use previous content as default, let user edit
    //   - AI is a SEPARATE, OPTIONAL enhancement step

  → convertToDocx(text)                   // docx.ts
  → emit document_ready
```

### Key Changes

1. **Remove AI dependency from the main pipeline**
2. **Add structured intent parsing** (no AI needed)
3. **Add resolver chain** with entity lookups
4. **Add document history check** for reusing past content
5. **Make AI a separate, post-generation enhancement step** (user clicks "AI yaxshilash" button)
6. **Add progressive questioning** — one question at a time, not a list

---

## 8. Step-by-Step Implementation Plan

### Phase 1: Data Layer (Database)

**Step 1:** Create new migration with `schools`, `directors`, `classes`, `pupils`, `documents` tables

**Step 2:** Migrate existing teachers — extract distinct schools into `schools` table, link teachers to schools

**Step 3:** Move Sultonov Bahrom from teachers to directors, link to 21-maktab

**Step 4:** Add seed data — directors for all 5 schools, classes for each school, 15-20 pupils per class

**Step 5:** Update `supabase.ts` with new query functions:
- `findDirectorBySchool(schoolName)` → returns director record
- `findPupilsByClass(className, schoolId)` → returns pupil list
- `findPreviousDocument(teacherId, shablonType, filters)` → returns last N documents

### Phase 2: Resolver System

**Step 6:** Create `src/lib/zunoora/resolvers.ts`
- `parseIntent(prompt)` — structured intent parser
- `resolveField(field, ctx)` — single field resolver
- `resolveFields(shablon, teacher, intent)` — resolves all required fields
- `Resolver` type + resolver registry
- Role map (direktor → Direktor, etc.)

**Step 7:** Create `src/lib/zunoora/intentParser.ts` (or include in resolvers.ts)
- Pattern-based parsing (no AI)
- Recipient detection
- Shablon type detection
- Timeframe/class/subject extraction

### Phase 3: Pipeline Refactoring

**Step 8:** Refactor `documentPipeline.ts`
- Replace `detectShablonType` with `parseIntent`
- Replace `findMissingFields` with `resolveFields`
- Remove AI call from `generateAndDisplay`
- Add conversational questioning (one question at a time)
- Add document history lookup for content defaults

**Step 9:** Create `src/lib/zunoora/questionEngine.ts`
- Manages the question-answer flow
- Supports confirmation questions ("Siz... uchun yozyapsiz, to'g'rimi?")
- Supports open-ended questions for content fields
- Handles answer parsing and field extraction

### Phase 4: Optional AI Enhancement

**Step 10:** Create `src/lib/zunoora/aiEnhancer.ts` (optional, separate from main pipeline)
- `enhanceContent(text)` — improve grammar, style, formality
- `suggestContinuation(text)` — suggest next paragraphs
- Called ONLY when user clicks "AI yaxshilash" button
- Still requires Groq API key

### Phase 5: UI Updates

**Step 11:** Update `MainStage.tsx`
- Support conversational question flow (Phase 1: confirm, Phase 2: ask)
- Add "AI yaxshilash" button on generated documents
- Show which fields were auto-resolved vs user-provided

**Step 12:** Update `AccountDialog.tsx`
- School selection (if teacher belongs to multiple schools)
- Default director selection for the school

---

## 9. Key Design Decisions

### Decision 1: Directors as a Separate Table
**Why:** Multiple documents reference the director. Having a dedicated table with `school_id` FK makes lookup trivial. Remove ambiguity (which director? the one at my school).

### Decision 2: Schools as a Separate Table
**Why:** Avoid string-based school matching ("21-umumiy o'rta maktab" vs "21-maktab"). Enables multi-school support for future.

### Decision 3: Document History in DB
**Why:** Currently all generated documents are lost on browser refresh. Storing in DB enables:
- "Last time you wrote this, the topic was X — use again?"
- Reuse content fields (explanation, goals) from previous similar documents
- Teacher dashboard showing all generated documents

### Decision 4: AI as Optional Enhancement Layer
**Why:** Core generation must work WITHOUT AI. AI should be a quality-of-life improvement, not a requirement. This ensures:
- Works offline
- No API costs for basic usage
- Predictable output formatting
- Fast generation (no 30s API wait)

### Decision 5: Progressive Questions (1 at a time)
**Why:** Current implementation dumps all missing field questions as a numbered list. This is overwhelming. Ask one question, wait for answer, then ask next. Use confirmation questions when data is guessed (not certain).

### Decision 6: Intent Parser Over Keyword Matching
**Why:** Simple keyword matching can't distinguish "tushuntirish xati direktor uchun" from "tarix fanidan tushuntirish". Structured intent parsing extracts the full picture: document type, recipient, subject, class, timeframe — all from a single sentence.

---

## 10. File Tree (Target State)

```
src/
├── server.ts                          # Cloudflare Workers entry
├── app.ts                             # App root
├── router.ts                          # Routes
├── config.ts                          # Config
│
├── lib/
│   └── zunoora/
│       ├── supabase.ts                # Supabase client + all queries
│       ├── shablons.ts                # FIELD_META, SHABLON_KEYWORDS
│       ├── templateProcessor.ts       # fillTemplate (placeholder replacement)
│       ├── documentPipeline.ts        # Pipeline orchestrator (REFACTORED)
│       ├── resolvers.ts               # NEW — intent parsing + field resolution
│       ├── questionEngine.ts          # NEW — conversational question flow
│       ├── docx.ts                    # .docx generation
│       ├── textUtils.ts              # Uzbek date formatting, etc.
│       ├── gemini.ts                  # DEPRECATED — kept for AI enhancement
│       ├── aiEnhancer.ts             # NEW — optional AI post-processing
│       └── store.ts                   # Zustand store
│
├── components/
│   └── zunoora/
│       ├── MainStage.tsx              # State machine + pipeline UI (UPDATE)
│       ├── ChatInput.tsx              # Text input
│       ├── MessageList.tsx            # Chat rendering
│       ├── DocPreview.tsx             # Document preview (add AI enhance btn)
│       ├── AccountDialog.tsx          # Account setup (add school picker)
│       └── QuestionFlow.tsx           # NEW — conversational question UI
│
├── db/
│   ├── migration.sql                  # CURRENT schema
│   ├── migration_v2.sql               # NEW — schools, directors, classes, pupils, documents
│   └── seed/
│       ├── shablons.ts                # FIELD_META + shablon definitions
│       ├── seed.ts                    # Seed script (UPDATE with new entities)
│       └── seed.sql                   # Raw SQL seed (UPDATE)
│
└── routes/
    └── index.tsx                      # Main app page
```

---

## 11. Testing the Non-AI Pipeline

The pipeline should be tested by sending these prompts and verifying the output contains correctly resolved data:

| Prompt | Expected shablon | Expected auto-resolve |
|--------|-----------------|----------------------|
| "ariza yozing direktor uchun" | ariza | recipient=Direktor, recipient_name=Sultonov B.K., date=bugun |
| "tushuntirish xati" | tushuntirish_xati | same as above |
| "9-A sinf matematika BSB" | bsb_chb | class=9-A, subject=Matematika |
| "ktp tuzing fizikadan 10-A" | ktp | subject=Fizika, class=10-A |
| "ish tabeli" | ish_tabeli | week_start=dushanba, week_end=shanba |
| "sillabus tayyorlang" | sillabus | teacher_name, subject, class from teacher record |
| "hisobot matematikadan" | hisobot | subject=Matematika, period=annual/yearly |

Each test should verify that NO AI is called and ALL lookups come from the database.

---

## 12. Summary

**The core insight:** School documents follow strict formats with predictable entities (director, teacher, class, subject). By modeling these entities in the database and building a smart resolver, we can generate >90% of documents with ZERO AI involvement. AI becomes a nice-to-have enhancement layer, not the core engine.

The priority order:
1. ✅ Database + resolvers (all data in place)
2. ✅ Pipeline refactoring (no AI in main path)
3. ✅ Question engine (conversational, progressive)
4. ⏳ AI enhancer (optional, post-generation)

Current backup: `UI-mvp-backup2.tar.gz` in `D:\ZUNORA\`.
