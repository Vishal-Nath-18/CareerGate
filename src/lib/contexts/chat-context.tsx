"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { Message } from "ai";
import { useFileSystem } from "./file-system-context";
import { setHasAnonWork } from "@/lib/anon-work-tracker";

interface ChatContextProps {
  projectId?: string;
  initialMessages?: Message[];
}

interface ChatContextType {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  append: (message: { role: "user"; content: string }) => void;
  status: string;
  hasApiKey: boolean;
  apiKeyChecked: boolean;
  currentModel: string;
  generationCount: number;
  chatError: string | null;
  setHasApiKey: (v: boolean) => void;
  setCurrentModel: (v: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  projectId,
  initialMessages = [],
}: ChatContextProps & { children: ReactNode }) {
  const { fileSystem, handleToolCall } = useFileSystem();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyChecked, setApiKeyChecked] = useState(false);
  const [currentModel, setCurrentModel] = useState("");
  const [generationCount, setGenerationCount] = useState(0);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/api-key")
      .then((r) => r.json())
      .then((data) => {
        if (data.hasKey) {
          setHasApiKey(true);
          setCurrentModel(data.model);
        }
      })
      .catch(() => {})
      .finally(() => setApiKeyChecked(true));

    fetch("/api/user/generation-count")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.count === "number") {
          setGenerationCount(data.count);
        }
      })
      .catch(() => {});
  }, []);

    const {
    messages,
    input,
    handleInputChange,
    handleSubmit: aiHandleSubmit,
    append,
    status,
  } = useAIChat({
    api: "/api/chat",
    initialMessages,
    body: {
      files: fileSystem.serialize(),
      projectId,
    },
    onToolCall: ({ toolCall }) => {
      handleToolCall(toolCall);
    },
    onFinish: (message) => {
      // Match the backend: only count it if a generation tool was actually invoked,
      // not just because the assistant wrote a long reply.
      const hasToolInvocation =
        (Array.isArray((message as any)?.toolInvocations) &&
          (message as any).toolInvocations.length > 0) ||
        (Array.isArray((message as any)?.parts) &&
          (message as any).parts.some((p: any) => p?.type === "tool-invocation"));

      if (hasToolInvocation) {
        setGenerationCount((prev) => prev + 1);
      }
    },
    onError: (err) => {
      let msg = "Something went wrong. Please try again.";
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error) msg = parsed.error;
      } catch {
        // err.message wasn't JSON — this is the plain-text friendly message
        // from getErrorMessage() in route.ts (rate-limit/credit/auth errors).
        if (err.message) msg = err.message;
      }
      setChatError(msg);

      // Resync count in case this was a 429 the frontend didn't know about yet
      fetch("/api/user/generation-count")
        .then((r) => r.json())
        .then((data) => {
          if (typeof data.count === "number") setGenerationCount(data.count);
        })
        .catch(() => {});
    },
  });

  useEffect(() => {
    if (!projectId && messages.length > 0) {
      setHasAnonWork(messages, fileSystem.serialize());
    }
  }, [messages, fileSystem, projectId]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setChatError(null);
    aiHandleSubmit(e);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        append,
        status,
        hasApiKey,
        apiKeyChecked,
        currentModel,
        generationCount,
        chatError,
        setHasApiKey,
        setCurrentModel,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
