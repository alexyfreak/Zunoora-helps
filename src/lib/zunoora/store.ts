import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Shablon, Teacher } from "./database";
import type { MissingField } from "./shablons";

export type Role = "user" | "assistant";
export type Model = "standard" | "deep";

export type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
};

export type GeneratedDoc = {
  id: string;
  name: string;
  content: string;
  createdAt: number;
};

export type Chat = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  documents: GeneratedDoc[];
  model: Model;
};

export type Account = { name: string; email: string };

type State = {
  chats: Chat[];
  activeChatId: string | null;
  account: Account;
  credits: number;
  filterFrom: number | null;
  filterTo: number | null;
  sortDir: "newest" | "oldest";

  // Pipeline state (not persisted — resets on reload)
  pendingShablon: Shablon | null;
  pendingTeacher: Teacher | null;
  pendingMissingFields: MissingField[];
  setPendingPipeline: (
    shablon: Shablon | null,
    teacher: Teacher | null,
    missing: MissingField[],
  ) => void;

  newChat: () => string;
  setActive: (id: string) => void;
  deleteChat: (id: string) => void;
  addMessage: (chatId: string, msg: Omit<Message, "id" | "createdAt">) => Message;
  addDocument: (chatId: string, doc: Omit<GeneratedDoc, "id" | "createdAt">) => GeneratedDoc;
  setModel: (chatId: string, model: Model) => void;
  renameChat: (chatId: string, title: string) => void;
  setAccount: (a: Partial<Account>) => void;
  setFilter: (from: number | null, to: number | null) => void;
  setSort: (d: "newest" | "oldest") => void;
};

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyChat = (): Chat => ({
  id: uuid(),
  title: "New chat",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  documents: [],
  model: "standard",
});

export const useZunoora = create<State>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      account: { name: "Abdullayev Azizjon Alisher o'g'li", email: "azizjon@school.uz" },
      credits: 248,
      filterFrom: null,
      filterTo: null,
      sortDir: "newest",

      pendingShablon: null,
      pendingTeacher: null,
      pendingMissingFields: [],
      setPendingPipeline: (shablon, teacher, missing) =>
        set({ pendingShablon: shablon, pendingTeacher: teacher, pendingMissingFields: missing }),

      newChat: () => {
        const c = emptyChat();
        set((s) => ({ chats: [c, ...s.chats], activeChatId: c.id }));
        return c.id;
      },
      setActive: (id) => set({ activeChatId: id }),
      deleteChat: (id) =>
        set((s) => {
          const chats = s.chats.filter((c) => c.id !== id);
          return {
            chats,
            activeChatId: s.activeChatId === id ? (chats[0]?.id ?? null) : s.activeChatId,
          };
        }),
      addMessage: (chatId, msg) => {
        const m: Message = { ...msg, id: uuid(), createdAt: Date.now() };
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [...c.messages, m],
                  updatedAt: Date.now(),
                  title:
                    c.messages.length === 0 && msg.role === "user"
                      ? msg.content.slice(0, 48)
                      : c.title,
                }
              : c,
          ),
        }));
        return m;
      },
      addDocument: (chatId, doc) => {
        const d: GeneratedDoc = { ...doc, id: uuid(), createdAt: Date.now() };
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId ? { ...c, documents: [...c.documents, d], updatedAt: Date.now() } : c,
          ),
        }));
        return d;
      },
      setModel: (chatId, model) =>
        set((s) => ({
          chats: s.chats.map((c) => (c.id === chatId ? { ...c, model } : c)),
        })),
      renameChat: (chatId, title) =>
        set((s) => ({
          chats: s.chats.map((c) => (c.id === chatId ? { ...c, title } : c)),
        })),
      setAccount: (a) => set((s) => ({ account: { ...s.account, ...a } })),
      setFilter: (from, to) => set({ filterFrom: from, filterTo: to }),
      setSort: (d) => set({ sortDir: d }),
    }),
    {
      name: "zunoora.v1",
      partialize: (s) => ({
        chats: s.chats,
        activeChatId: s.activeChatId,
        account: s.account,
        credits: s.credits,
      }),
    },
  ),
);

export const getActiveChat = (s: State): Chat | null =>
  s.chats.find((c) => c.id === s.activeChatId) ?? null;
