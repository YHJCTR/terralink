"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TL } from "@/lib/terralink";

const STORAGE_KEY = "terrabox_agent_session";

interface Message {
  role: "user" | "assistant";
  content: string;
  thinking?: string;   // content inside <think> tags, if any
  images?: string[];   // blob: preview URLs — ephemeral, stripped before persisting
}

interface PersistedMessage {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
}

interface PersistedState {
  sessionId: string | null;
  messages: PersistedMessage[];
}

function loadState(): PersistedState {
  if (typeof window === "undefined") return { sessionId: null, messages: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    // ignore
  }
  return { sessionId: null, messages: [] };
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

// ---------------------------------------------------------------------------
// ThinkingBlock — collapsible gray block for <think> content
// ---------------------------------------------------------------------------

function ThinkingBlock({ content, streaming }: { content: string; streaming: boolean }) {
  return (
    <details
      open={streaming}
      className="mb-1 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
    >
      <summary className="cursor-pointer select-none px-3 py-1.5 text-xs text-gray-400 hover:text-gray-500 list-none flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        思考过程
      </summary>
      <div className="px-3 pb-3 pt-1 text-xs text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AgentPage() {
  // Always start with empty state so server and client render identically.
  // Load persisted state from localStorage only after mount (useEffect),
  // which avoids the React hydration mismatch caused by server having no
  // access to localStorage while the client does.
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingThinking, setStreamingThinking] = useState("");
  const [streamingResponse, setStreamingResponse] = useState("");

  // Refs so onDone callback always reads current accumulated text
  const thinkingRef = useRef("");
  const responseRef = useRef("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load persisted session from localStorage after first mount
  useEffect(() => {
    const saved = loadState();
    if (saved.sessionId) setSessionId(saved.sessionId);
    if (saved.messages.length > 0) setMessages(saved.messages);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist session whenever messages or sessionId change (strip ephemeral images)
  useEffect(() => {
    saveState({
      sessionId,
      messages: messages.map(({ role, content, thinking }) => ({ role, content, thinking })),
    });
  }, [sessionId, messages]);

  // Stable blob URLs — only recreated when the files array changes
  const previewUrls = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files]
  );

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && files.length === 0) return;
    if (isStreaming) return;

    const userMsg: Message = { role: "user", content: text, images: previewUrls };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const sentFiles = [...files];
    setIsStreaming(true);
    setStreamingThinking("");
    setStreamingResponse("");
    thinkingRef.current = "";
    responseRef.current = "";

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    await TL.agentChatStream(
      text,
      sessionId,
      sentFiles,
      (token) => {
        thinkingRef.current += token;
        setStreamingThinking((prev) => prev + token);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      },
      (token) => {
        responseRef.current += token;
        setStreamingResponse((prev) => prev + token);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      },
      (sid) => {
        setSessionId(sid);
        const finalThinking = thinkingRef.current;
        const finalResponse = responseRef.current;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: finalResponse,
            thinking: finalThinking || undefined,
          },
        ]);
        setStreamingThinking("");
        setStreamingResponse("");
        thinkingRef.current = "";
        responseRef.current = "";
        setIsStreaming(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      },
      (errMsg) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${errMsg}` },
        ]);
        setStreamingThinking("");
        setStreamingResponse("");
        thinkingRef.current = "";
        responseRef.current = "";
        setIsStreaming(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearSession = async () => {
    if (sessionId) await TL.agentClearSession(sessionId).catch(() => {});
    setSessionId(null);
    setMessages([]);
    setFiles([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Agent</h2>
          <p className="text-xs text-gray-500">
            Autonomous tool selection · LangGraph ReAct
            {sessionId && (
              <span className="ml-2 text-gray-400">session: {sessionId.slice(0, 8)}…</span>
            )}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearSession}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors"
          >
            Clear session
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
            <div className="text-4xl">🤖</div>
            <p>Ask the Agent anything. It will automatically choose and chain tools to answer.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" ? (
              <div className="max-w-[75%]">
                {msg.thinking && (
                  <ThinkingBlock content={msg.thinking} streaming={false} />
                )}
                <div className="rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap shadow-sm bg-white text-gray-800 border border-gray-200">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap shadow-sm bg-blue-600 text-white">
                {msg.images && msg.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {msg.images.map((url, j) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={j}
                        src={url}
                        alt="upload"
                        className="h-20 w-20 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {/* Live streaming bubble */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[75%]">
              {streamingThinking && (
                <ThinkingBlock content={streamingThinking} streaming />
              )}
              <div className="rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap shadow-sm bg-white text-gray-800 border border-gray-200">
                {streamingResponse || (
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-white px-4 py-3">
        {/* Image preview strip */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((f, i) => (
              <div key={i} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="h-14 w-14 object-cover rounded-lg border"
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
            title="Attach image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) setFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />

          {/* Text input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Agent… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-40 overflow-y-auto"
            style={{ minHeight: "38px" }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={isStreaming || (!input.trim() && files.length === 0)}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
