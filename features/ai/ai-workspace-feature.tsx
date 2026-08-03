"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Send,
  Plus,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Loader2,
  RefreshCw,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAIProviderConfigAction, healthCheckAction } from "@/services/ai";
import type { AIMessage, HealthCheckResult } from "@/lib/ai/types";

interface ChatConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
}

export interface ToolActivityItem {
  callId: string;
  toolName: string;
  status: "running" | "success" | "error";
  executionTimeMs?: number;
  error?: string;
}

const createDefaultConversation = (): ChatConversation => ({
  id: `conv-initial`,
  title: "New Chat",
  messages: [
    {
      role: "system",
      content:
        "You are Aura OS AI, an intelligent workspace assistant. How can I assist you with your operations today?",
    },
  ],
  createdAt: new Date().toISOString(),
});

const getToolLabel = (
  toolName: string,
  status: "running" | "success" | "error",
  executionTimeMs?: number
): string => {
  const friendlyNames: Record<string, { running: string; success: string; error: string }> = {
    search_knowledge: {
      running: "🔎 Searching Knowledge...",
      success: "✓ Knowledge Search Complete",
      error: "✗ Knowledge Search Failed",
    },
    get_knowledge_entry: {
      running: "📖 Retrieving Knowledge Entry...",
      success: "✓ Knowledge Entry Loaded",
      error: "✗ Knowledge Entry Not Found",
    },
    list_missions: {
      running: "📋 Listing Missions...",
      success: "✓ Missions Loaded",
      error: "✗ Failed to Load Missions",
    },
    get_mission_status: {
      running: "🎯 Checking Mission Status...",
      success: "✓ Mission Status Checked",
      error: "✗ Mission Status Check Failed",
    },
    list_employees: {
      running: "👥 Listing Employees...",
      success: "✓ Employees Loaded",
      error: "✗ Failed to Load Employees",
    },
    get_employee_profile: {
      running: "👤 Loading Employee Profile...",
      success: "✓ Employee Profile Loaded",
      error: "✗ Employee Profile Not Found",
    },
  };

  const config = friendlyNames[toolName];
  if (config) {
    const base = config[status];
    return status === "success" && executionTimeMs !== undefined
      ? `${base} (${executionTimeMs}ms)`
      : base;
  }

  const nameFormatted = toolName.replace(/_/g, " ");
  if (status === "running") return `⚙️ Running ${nameFormatted}...`;
  if (status === "success")
    return `✓ ${nameFormatted} complete${executionTimeMs ? ` (${executionTimeMs}ms)` : ""}`;
  return `✗ ${nameFormatted} failed`;
};

export function AIWorkspaceFeature() {
  const [conversations, setConversations] = useState<ChatConversation[]>(() => [
    createDefaultConversation(),
  ]);
  const [activeId, setActiveId] = useState<string | null>("conv-initial");

  const [inputPrompt, setInputPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const [activeProvider, setActiveProvider] = useState<string>("gemini");
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const [knowledgeStatus, setKnowledgeStatus] = useState<"Enabled" | "None" | "Error">("None");

  // Track live tool execution activities per conversation
  const [toolActivities, setToolActivities] = useState<Record<string, ToolActivityItem[]>>({});
  const [isToolsExpanded, setIsToolsExpanded] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, toolActivities, scrollToBottom]);

  // Load config & initial health check on mount
  const checkHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const config = await getAIProviderConfigAction();
      setActiveProvider(config.activeProvider);
      const healthRes = await healthCheckAction(config.activeProvider);
      setHealth(healthRes);
    } catch {
      setHealth({
        ok: false,
        provider: "gemini",
        message: "Failed to connect to AI server context.",
      });
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkHealth();
    }, 0);
    return () => clearTimeout(timer);
  }, [checkHealth]);

  function handleNewChat() {
    const newId = `conv-${Date.now()}`;
    const newConv: ChatConversation = {
      id: newId,
      title: "New Chat",
      messages: [
        {
          role: "system",
          content:
            "You are Aura OS AI, an intelligent workspace assistant. How can I assist you with your operations today?",
        },
      ],
      createdAt: new Date().toISOString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
    setInputPrompt("");
  }

  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isStreaming || !activeConversation) return;

    const userText = inputPrompt.trim();
    setInputPrompt("");

    const userMessage: AIMessage = { role: "user", content: userText };
    const updatedMessages = [...activeConversation.messages, userMessage];

    let updatedTitle = activeConversation.title;
    if (activeConversation.title === "New Chat") {
      const truncated = userText.length > 50 ? `${userText.slice(0, 47)}...` : userText;
      updatedTitle = truncated;
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, title: updatedTitle, messages: updatedMessages }
          : c
      )
    );

    setIsStreaming(true);
    // Reset tool activities for new query turn
    setToolActivities((prev) => ({ ...prev, [activeConversation.id]: [] }));
    setIsToolsExpanded((prev) => ({ ...prev, [activeConversation.id]: true }));

    const assistantPlaceholder: AIMessage = { role: "assistant", content: "" };
    let currentAssistantText = "";

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, messages: [...updatedMessages, assistantPlaceholder] }
          : c
      )
    );

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          provider: activeProvider,
        }),
      });

      if (!response.ok || !response.body) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}: Streaming request failed.`);
      }

      const ragStatus = response.headers.get("X-RAG-Status");
      if (ragStatus === "Enabled" || ragStatus === "None" || ragStatus === "Error") {
        setKnowledgeStatus(ragStatus);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const updateAssistantMsg = (text: string) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeConversation.id) return c;
            const msgs = [...c.messages];
            msgs[msgs.length - 1] = {
              role: "assistant",
              content: text,
            };
            return { ...c, messages: msgs };
          })
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value, { stream: true });
        buffer += rawChunk;

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            try {
              const event = JSON.parse(dataStr);
              if (event.type === "tool_start") {
                setToolActivities((prev) => {
                  const currentList = prev[activeConversation.id] || [];
                  const existingIndex = currentList.findIndex((a) => a.callId === event.callId);
                  const newItem: ToolActivityItem = {
                    callId: event.callId,
                    toolName: event.toolName,
                    status: "running",
                  };
                  if (existingIndex >= 0) {
                    const updated = [...currentList];
                    updated[existingIndex] = newItem;
                    return { ...prev, [activeConversation.id]: updated };
                  }
                  return { ...prev, [activeConversation.id]: [...currentList, newItem] };
                });
              } else if (event.type === "tool_complete") {
                setToolActivities((prev) => {
                  const currentList = prev[activeConversation.id] || [];
                  const updated = currentList.map((a) =>
                    a.callId === event.callId
                      ? {
                          ...a,
                          status: (event.status === "success" ? "success" : "error") as "success" | "error",
                          executionTimeMs: event.executionTimeMs,
                        }
                      : a
                  );
                  return { ...prev, [activeConversation.id]: updated };
                });
              } else if (event.type === "tool_error") {
                setToolActivities((prev) => {
                  const currentList = prev[activeConversation.id] || [];
                  const updated = currentList.map((a) =>
                    a.callId === event.callId
                      ? {
                          ...a,
                          status: "error" as const,
                          error: event.error?.message || "Tool execution failed.",
                        }
                      : a
                  );
                  return { ...prev, [activeConversation.id]: updated };
                });
              } else if (event.type === "assistant_chunk" || event.type === "assistant_complete") {
                if (typeof event.text === "string" && event.text.length > 0) {
                  currentAssistantText = event.text;
                  updateAssistantMsg(currentAssistantText);
                }
              }
            } catch {
              // Backward compatibility for raw text streaming
              currentAssistantText += trimmed;
              updateAssistantMsg(currentAssistantText);
            }
          } else {
            currentAssistantText += trimmed;
            updateAssistantMsg(currentAssistantText);
          }
        }
      }

      // Handle any trailing buffer chunk
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data: ")) {
          try {
            const event = JSON.parse(trimmed.slice(6));
            if (event.type === "assistant_chunk" || event.type === "assistant_complete") {
              if (event.text) {
                currentAssistantText = event.text;
                updateAssistantMsg(currentAssistantText);
              }
            }
          } catch {
            currentAssistantText += trimmed;
            updateAssistantMsg(currentAssistantText);
          }
        } else {
          currentAssistantText += trimmed;
          updateAssistantMsg(currentAssistantText);
        }
      }

      // Auto-collapse completed tool activities
      setIsToolsExpanded((prev) => ({ ...prev, [activeConversation.id]: false }));
    } catch (err: unknown) {
      setKnowledgeStatus("Error");
      const errorMsg = err instanceof Error ? err.message : "Error streaming response.";
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConversation.id) return c;
          const msgs = [...c.messages];
          msgs[msgs.length - 1] = {
            role: "assistant",
            content: `⚠️ Error: ${errorMsg}`,
          };
          return { ...c, messages: msgs };
        })
      );
    } finally {
      setIsStreaming(false);
    }
  }

  const currentActivities = toolActivities[activeConversation?.id || ""] || [];
  const expanded = isToolsExpanded[activeConversation?.id || ""] ?? true;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Modular AI Foundation infrastructure & agent tool activity workspace.
          </p>
        </div>

        {/* Status Badges Header */}
        <div className="flex items-center gap-3">
          {/* Knowledge Status Badge */}
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Knowledge:</span>
            {knowledgeStatus === "Enabled" ? (
              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                <CheckCircle2 className="h-3 w-3" /> Enabled
              </span>
            ) : knowledgeStatus === "Error" ? (
              <span className="flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                <AlertCircle className="h-3 w-3" /> Error
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-[10px] font-semibold">
                None
              </span>
            )}
          </div>

          {/* Active Provider Status Badge */}
          <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Provider:</span>
            <span className="font-semibold uppercase tracking-wider text-foreground">
              {activeProvider}
            </span>
            {isCheckingHealth ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-1" />
            ) : health?.ok ? (
              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-semibold ml-1">
                <CheckCircle2 className="h-3 w-3" /> Online
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] font-semibold ml-1"
                title={health?.message}
              >
                <AlertCircle className="h-3 w-3" /> Config Required
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={checkHealth}
            title="Refresh Provider Health"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCheckingHealth ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left Sidebar: Conversations list */}
        <div className="w-64 flex flex-col gap-3 bg-card border rounded-xl p-3 shrink-0">
          <Button onClick={handleNewChat} className="w-full justify-start gap-2" variant="default">
            <Plus className="h-4 w-4" /> New Chat
          </Button>

          <div className="text-xs font-semibold text-muted-foreground px-2 pt-2 uppercase tracking-wider">
            Conversations
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
                  c.id === activeId
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{c.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Main Chat Area */}
        <div className="flex-1 flex flex-col bg-card border rounded-xl overflow-hidden min-h-0">
          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeConversation?.messages
              .filter((m) => m.role !== "system")
              .map((msg, idx, arr) => {
                const isLastAssistant =
                  msg.role === "assistant" && idx === arr.length - 1;

                return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div className="flex flex-col max-w-[75%] gap-2">
                      {/* Live Agent Tool Activity Panel (rendered above last assistant message if active) */}
                      {isLastAssistant && currentActivities.length > 0 && (
                        <div className="bg-card border rounded-xl p-3 shadow-sm text-xs space-y-2 mb-1">
                          <button
                            type="button"
                            onClick={() =>
                              setIsToolsExpanded((prev) => ({
                                ...prev,
                                [activeConversation.id]: !expanded,
                              }))
                            }
                            className="flex items-center justify-between w-full font-semibold text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              <Wrench className="h-3.5 w-3.5 text-primary" />
                              Agent Tool Activity ({currentActivities.length})
                            </span>
                            {expanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {expanded && (
                            <div className="space-y-1.5 pt-1">
                              {currentActivities.map((act) => (
                                <div
                                  key={act.callId}
                                  className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                                    act.status === "running"
                                      ? "bg-primary/5 text-primary border-primary/20"
                                      : act.status === "success"
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                                      : "bg-destructive/10 text-destructive border-destructive/20"
                                  }`}
                                >
                                  {act.status === "running" ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                                  ) : act.status === "success" ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                                  )}
                                  <span className="font-mono text-[11px] truncate">
                                    {getToolLabel(
                                      act.toolName,
                                      act.status,
                                      act.executionTimeMs
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Assistant Message Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground font-medium"
                            : "bg-muted/40 border text-foreground"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">
                          {msg.content ||
                            (isStreaming && idx === arr.length - 1 ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              ""
                            ))}
                        </div>
                      </div>
                    </div>

                    {msg.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-background/50 flex gap-3">
            <textarea
              rows={1}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message or prompt..."
              className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isStreaming}
            />
            <Button type="submit" disabled={isStreaming || !inputPrompt.trim()}>
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
