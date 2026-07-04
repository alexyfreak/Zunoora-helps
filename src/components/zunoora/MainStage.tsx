import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { useZunoora, getActiveChat } from "@/lib/zunoora/store";
import { ModelToggle } from "./ModelToggle";
import { ChatPanel } from "./ChatPanel";
import { DocumentPane } from "./DocumentPane";
import { runPipeline, continuePipeline } from "@/lib/zunoora/documentPipeline";
import type { PipelineEvent } from "@/lib/zunoora/documentPipeline";
import type { QuestionFlow as QuestionFlowType } from "@/lib/zunoora/questionEngine";
import type { Shablon, Teacher } from "@/lib/zunoora/database";

type Mode = "idle" | "generating" | "ready";

export function MainStage() {
  const chat = useZunoora(getActiveChat);
  const newChat = useZunoora((s) => s.newChat);
  const addMessage = useZunoora((s) => s.addMessage);
  const addDocument = useZunoora((s) => s.addDocument);
  const setModel = useZunoora((s) => s.setModel);
  const account = useZunoora((s) => s.account);

  const [mode, setMode] = useState<Mode>("idle");
  const [docContent, setDocContent] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activeFlow, setActiveFlow] = useState<QuestionFlowType | null>(null);
  const [activeShablon, setActiveShablon] = useState<Shablon | null>(null);
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const lastChatId = useRef<string | null>(null);
  const pipelineRunning = useRef(false);
  const initRef = useRef(false);

  useEffect(() => {
    const currentChatId = chat?.id;
    if (currentChatId !== lastChatId.current) {
      abortRef.current?.abort();
      lastChatId.current = currentChatId ?? null;
      if (chat && chat.documents.length > 0) {
        const last = chat.documents[chat.documents.length - 1];
        setDocContent(last.content);
        setMode("ready");
      } else {
        setDocContent("");
        setMode("idle");
      }
      setThinking(false);
      setActiveFlow(null);
      pipelineRunning.current = false;
    }
  }, [chat]);

  useEffect(() => {
    if (!chat && !initRef.current) {
      initRef.current = true;
      newChat();
    }
  }, [chat, newChat]);

  const handlePipelineEvent = useCallback(
    (chatId: string, event: PipelineEvent) => {
      switch (event.type) {
        case "assistant_reply":
          addMessage(chatId, { role: "assistant", content: event.content });
          break;
        case "question":
          addMessage(chatId, { role: "assistant", content: event.content });
          break;
        case "document_chunk":
          setDocContent(event.content);
          break;
        case "document_ready":
          addDocument(chatId, {
            name: "Dokument",
            content: event.content,
          });
          setMode("ready");
          setThinking(false);
          setActiveFlow(null);
          pipelineRunning.current = false;
          break;
      }
    },
    [addMessage, addDocument],
  );

  const handleQuestion = useCallback(
    (
      question: string,
      _field: string,
      flow: QuestionFlowType,
      shablon: Shablon,
      teacher: Teacher,
    ) => {
      if (chat) {
        addMessage(chat.id, { role: "assistant", content: question });
      }
      setActiveFlow(flow);
      setActiveShablon(shablon);
      setActiveTeacher(teacher);
      setThinking(false);
    },
    [chat, addMessage],
  );

  const onSend = useCallback(
    async (text: string) => {
      if (!chat) return;

      if (activeFlow && activeShablon && activeTeacher) {
        addMessage(chat.id, { role: "user", content: text });
        setThinking(true);

        await continuePipeline(
          text,
          activeFlow,
          activeShablon,
          activeTeacher,
          (event) => handlePipelineEvent(chat.id, event),
          (question, field, flow, shablon, teacher) => {
            handleQuestion(question, field, flow, shablon, teacher);
          },
        );

        setThinking(false);
        return;
      }

      addMessage(chat.id, { role: "user", content: text });
      setThinking(true);
      setMode("generating");
      setDocContent("");
      pipelineRunning.current = true;

      const teacherEmail = account.email || "azizjon@school.uz";

      await runPipeline(
        text,
        teacherEmail,
        (event) => {
          switch (event.type) {
            case "assistant_reply":
            case "question":
              addMessage(chat.id, { role: "assistant", content: event.content });
              break;
            case "document_chunk":
              setDocContent(event.content);
              break;
            case "document_ready":
              addDocument(chat.id, {
                name: "Dokument",
                content: event.content,
              });
              setMode("ready");
              setThinking(false);
              pipelineRunning.current = false;
              break;
          }
        },
        (question, field, flow, shablon, teacher) => {
          handleQuestion(question, field, flow, shablon, teacher);
        },
      );

      if (pipelineRunning.current) {
        setThinking(false);
        pipelineRunning.current = false;
      }
    },
    [
      chat,
      account,
      activeFlow,
      activeShablon,
      activeTeacher,
      addMessage,
      addDocument,
      handlePipelineEvent,
      handleQuestion,
    ],
  );

  const onExpand = () => {
    abortRef.current?.abort();
    setMode("idle");
    setDocContent("");
    setThinking(false);
    setActiveFlow(null);
    pipelineRunning.current = false;
  };

  if (!chat) return null;

  const panelMode = mode === "idle" ? "center" : "corner";
  const showDoc = mode === "generating" || mode === "ready";

  return (
    <main className="relative flex h-screen min-w-0 flex-1 flex-col desk-vignette">
      <div className="z-20 flex items-center justify-center pt-6">
        <ModelToggle value={chat.model} onChange={(m) => setModel(chat.id, m)} />
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-6 pb-6 pt-4">
        <AnimatePresence>
          {showDoc && (
            <DocumentPane key="doc" content={docContent} streaming={mode === "generating"} />
          )}
        </AnimatePresence>

        <ChatPanel
          mode={panelMode}
          messages={chat.messages}
          thinking={thinking}
          onSend={onSend}
          onExpand={onExpand}
        />
      </div>
    </main>
  );
}
