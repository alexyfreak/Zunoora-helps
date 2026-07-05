
<p align="center">
  <div style="margin: 0 auto; width: 32px; height: 32px; rotate: 45deg; border: 2px solid #c7976a;"></div>
</p>
<p align="center"><strong>Z U N O O R A</strong></p>
<p align="center"><em>School Document Generator — for Uzbek-language teachers</em></p>

<p align="center">
  <a href="#-what-is-zunoora">What</a> •
  <a href="#-how-it-works">How</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-shablons-templates">Shablons</a> •
  <a href="#-ai-setup">AI Setup</a> •
  <a href="#-blanks-folder">Blanks</a>
</p>

---

## What is Zunoora?

Zunoora is an **offline-first single-page application** for Uzbek school teachers. Type a natural request in Uzbek — *"tushuntirish xati yozing direktor uchun"* — and Zunoora instantly generates a formatted `.docx` document from a local template.

**No database required.** All data (teachers, templates, schools) lives in the `Blanks/` folder as simple JSON files. Everything runs in your browser.

### Features

- **8 document types**: Ariza, Ish Tabeli, KTP, O'UM, BSB/CHB, Sillabus, Hisobot, Tushuntirish Xati
- **Local templates** — edit or add new ones in the `Blanks/` folder
- **Smart field resolution** — auto-fills teacher name, school, director, date, academic year
- **Conversational Q&A** — if fields are missing, it asks one question at a time
- **AI enhancement** (optional) — connect your own API key via OpenRouter, Groq, OpenAI, or Anthropic
- **100% offline** — no server, no database, no API keys required for basic use
- **Export to .docx** — download documents as Word files
- **Chat history** — persisted in your browser's localStorage
- **Uzbek language UI** — built for Uzbek teachers

---

## How it works

```
User prompt → Intent Parser → Shablon lookup → Field Resolution → Template fill → Document
                                     ↓
                              Missing fields?
                                     ↓
                           Conversational Q&A (one at a time)
```

1. **Intent Parser** (`intentParser.ts`) — keyword-based, no AI. Detects shablon type, recipient, subject, class.
2. **Shablon lookup** — loads the correct template from `Blanks/shablons.json`
3. **Field Resolution** (`resolvers.ts`) — 18 smart resolvers auto-fill fields from:
   - Teacher profile (name, position, school, subject)
   - Intent data (recipient, class, timeframe)
   - Runtime (today's date, academic year, current week)
   - Director lookup (by school)
   - Document history (previous similar documents)
   - User answers (from conversation)
4. **Template filling** (`shablons.ts`) — replaces `{{placeholder}}` tags with real values
5. **Document display** — streamed markdown preview with `.docx` download

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

**No .env setup required.** Zunoora works fully offline out of the box.

---

## Shablons (Templates)

Zunoora includes 8 built-in document templates for Uzbek schools:

| Type | Label | Fields |
|------|-------|--------|
| `ariza` | Ariza (formal murojaat) | recipient_title, recipient_name, sender_name, sender_position, reason, date |
| `ish_tabeli` | Ish Tabeli | teacher_name, subject, classes, week_start, week_end |
| `ktp` | Kalendar-tematik plan | teacher_name, subject, class_name, academic_year |
| `oum` | O'UM (o'quv-uslubiy majmua) | teacher_name, subject, class_name, academic_year |
| `bsb_chb` | BSB/CHB (summativ baholash) | teacher_name, subject, class_name, quarter |
| `sillabus` | Sillabus | teacher_name, subject, class_name, academic_year, goals |
| `hisobot` | Hisobot | teacher_name, subject, period, academic_year |
| `tushuntirish_xati` | Tushuntirish xati | recipient_title, recipient_name, sender_name, sender_position, letter_topic, explanation, date |

Templates use `{{placeholder}}` syntax:

```
{{school}} direktori {{recipient_title}} {{recipient_name}}ga

Arizachi: {{sender_name}}
{{sender_position}}

TUSHUNTIRISH XATI

Mavzu: {{letter_topic}}

{{explanation}}

Sana: {{date}}

Imzo: ________
({{sender_name}})
```

---

## Blanks Folder

The `Blanks/` folder is the **local data directory**. All your data lives here as editable JSON files:

```
Blanks/
├── shablons.json    # Document templates (8 types)
├── teachers.json    # Teacher profiles (9 teachers)
├── schools.json     # Schools (5 schools)
├── directors.json   # School directors (5 directors)
├── classes.json     # Classes (35 classes)
└── pupils.json      # Pupils (optional, for future use)
```

### How to customize teachers

Edit `Blanks/teachers.json`:

```json
{
  "id": "teacher-01",
  "full_name": "Ismingiz Familyangiz",
  "age": 34,
  "subject": "Matematika",
  "classes": ["9-A", "9-B", "10-A"],
  "phone": "+998901234567",
  "email": "you@school.uz",
  "school": "21-umumiy o'rta maktab",
  "school_id": "school-01",
  "position": "O'qituvchi",
  "extra_info": { "experience_years": 10, "degree": "bakalavr" },
  "created_at": "2025-09-01T00:00:00Z"
}
```

### How to add a custom shablon

1. Open `Blanks/shablons.json`
2. Add a new object with `type`, `label`, `description`, `keywords`, `schema`, and `template`
3. Add keywords for the intent parser (lowercase Uzbek words)
4. Your new shablon will appear automatically in the app

```json
{
  "id": "shablon-09",
  "type": "your_new_type",
  "label": "Your Shablon Label",
  "description": "What this shablon is for",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "schema": {
    "required": ["field1", "field2"],
    "optional": ["field3"]
  },
  "template": "{{field1}}\n\n{{field2}}"
}
```

### How to add custom field resolvers

Edit `src/lib/zunoora/resolvers.ts` and add a new resolver:

```ts
{
  field: "your_field",
  priority: 50,     // higher = resolved first
  label: "Your Field Label",
  resolve: async (ctx) => {
    // ctx.teacher, ctx.shablon, ctx.intent available
    return "value or null";
  },
},
```

---

## AI Setup

Zunoora's core template engine is **AI-free** — it uses keyword parsing and field resolution. However, you can optionally connect an AI provider for:

- **AI Enhance** (`AI yaxshilash`) — improves document formatting and language
- **Smart detection** — AI-based shablon type detection (fallback)

### Supported Providers

| Provider | Models | Website |
|----------|--------|---------|
| **OpenRouter** | gpt-4o-mini, claude-3.5-sonnet, gemini-2.0-flash, llama-3.3-70b, deepseek-chat | https://openrouter.ai |
| **Groq** | llama-3.3-70b-versatile, mixtral-8x7b | https://console.groq.com |
| **OpenAI** | gpt-4o-mini, gpt-4o, gpt-4-turbo | https://platform.openai.com |
| **Anthropic** | claude-3-haiku, claude-3-sonnet, claude-3-opus | https://console.anthropic.com |

### How to configure

1. Open the app
2. Click the **gear icon (Settings)** in the sidebar
3. Go to the **AI Provider** section
4. Select your provider (OpenRouter recommended for best compatibility)
5. Paste your API key
6. Select a model
7. Click **Save API Key**
8. Your key is stored in browser localStorage (never on disk)

> **Recommended for beginners:** Sign up at [OpenRouter](https://openrouter.ai), get a free API key, select "openai/gpt-4o-mini" model.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start v1 (SSR) |
| Frontend | React 19, TypeScript 5.8 |
| Routing | TanStack Router v1 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand v5 (localStorage) |
| Export | docx + JSZip |
| AI | OpenRouter / Groq / OpenAI / Anthropic |
| Data | Local JSON (Blanks/) + localStorage |

---

## Project Structure

```
├── Blanks/                      # 📁 Your local data (edit these!)
│   ├── shablons.json            #   Document templates
│   ├── teachers.json            #   Teacher profiles
│   ├── schools.json             #   Schools
│   ├── directors.json           #   Directors
│   └── classes.json             #   Classes
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   └── zunoora/             # App-specific components
│   │       ├── AppShell.tsx
│   │       ├── Sidebar.tsx
│   │       ├── MainStage.tsx
│   │       ├── ChatPanel.tsx
│   │       ├── DocumentPane.tsx
│   │       ├── SettingsDialog.tsx
│   │       └── AccountDialog.tsx
│   ├── lib/zunoora/
│   │   ├── database.ts          # 📁 Local JSON data loader
│   │   ├── ai.ts                # 🤖 Multi-provider AI client
│   │   ├── store.ts             # Zustand state
│   │   ├── shablons.ts          # Template engine
│   │   ├── resolvers.ts         # Field resolution (18 resolvers)
│   │   ├── documentPipeline.ts  # Main pipeline
│   │   ├── intentParser.ts      # Keyword intent parser
│   │   ├── questionEngine.ts    # Q&A flow
│   │   ├── docx.ts              # .docx export
│   │   └── download.ts          # .zip export
│   └── server.ts                # Cloudflare Workers entry
├── package.json
├── vite.config.ts
└── README.md
```

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## Contact

- Telegram channel: [https://t.me/o712alx](https://t.me/o712alx)

---

## License

[All rights reserved](https://github.com/alexyfreak/Zunoora-helps/blob/master/LICENSE.md)
