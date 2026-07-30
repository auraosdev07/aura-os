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

export function AIWorkspaceFeature() {
  const [conversations, setConversations] = useState<ChatConversation[]>(() => [createDefaultConversation()]);
  const [activeId, setActiveId] = useState<string | null>("conv-initial");

  const [inputPrompt, setInputPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const [activeProvider, setActiveProvider] = useState<string>("gemini");
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Determine auto-title logic:
    // "Conversation titles must not be AI-generated. Use 'New Chat' for new conversations,
    // and replace it with the first 40–60 characters of the user's first message after the first successful send."
    let updatedTitle = activeConversation.title;
    if (activeConversation.title === "New Chat") {
      const truncated = userText.length > 50 ? `${userText.slice(0, 47)}...` : userText;
      updatedTitle = truncated;
    }

    // Update conversation state with user message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, title: updatedTitle, messages: updatedMessages }
          : c
      )
    );

    setIsStreaming(true);

    // Prepare assistant message placeholder
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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        currentAssistantText += chunk;

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeConversation.id) return c;
            const msgs = [...c.messages];
            msgs[msgs.length - 1] = {
              role: "assistant",
              content: currentAssistantText,
            };
            return { ...c, messages: msgs };
          })
        );
      }
    } catch (err: unknown) {
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
            Modular AI Foundation infrastructure & streaming test workspace.
          </p>
        </div>

        {/* Active Provider Status Badge */}
        <div className="flex items-center gap-3">
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
              <span className="flex items-center gap-1 text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] font-semibold ml-1" title={health?.message}>
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
              .map((msg, idx) => (
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

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted/40 border text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content || (isStreaming && idx === activeConversation.messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : "")}</div>
                  </div>

                  {msg.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
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
