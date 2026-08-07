"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Inbox as InboxIcon,
  CheckCheck,
  Plus,
  RefreshCw,
  Radio,
  FileText,
  User,
} from "lucide-react";
import {
  getInbox,
  getOutbox,
  getThreadMessages,
  sendDirectMessage,
  sendBroadcastMessage,
  replyToMessage,
  markMessageRead,
  resolveThread,
} from "@/services/acp/messaging-service";
import type { AgentMessageRow, AgentThreadRow } from "@/types/acp";
import type { AgentRow } from "@/types/agent";

interface AcpMessagesTabProps {
  agentId: string;
  allAgents: AgentRow[];
}

type SubTab = "inbox" | "outbox" | "threads";

export function AcpMessagesTab({ agentId, allAgents }: AcpMessagesTabProps) {
  const [subTab, setSubTab] = useState<SubTab>("inbox");
  const [inbox, setInbox] = useState<AgentMessageRow[]>([]);
  const [outbox, setOutbox] = useState<AgentMessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Thread View State
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<AgentThreadRow | null>(null);
  const [threadMessages, setThreadMessages] = useState<AgentMessageRow[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // New Message Modal State
  const [showNewMsgModal, setShowNewMsgModal] = useState(false);
  const [msgRecipientId, setMsgRecipientId] = useState("");
  const [msgSubject, setMsgSubject] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [inRes, outRes] = await Promise.all([
        getInbox(agentId),
        getOutbox(agentId),
      ]);
      setInbox(inRes);
      setOutbox(outRes);
    } catch (err) {
      console.error("[ACP LOAD ERROR]:", err);
    }
  }, [agentId]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getInbox(agentId), getOutbox(agentId)])
      .then(([inRes, outRes]) => {
        if (isMounted) {
          setInbox(inRes);
          setOutbox(outRes);
        }
      })
      .catch((err) => console.error("[ACP LOAD ERROR]:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [agentId]);

  const handleOpenThread = async (threadId: string) => {
    setSelectedThreadId(threadId);
    try {
      const res = await getThreadMessages(threadId);
      setActiveThread(res.thread);
      setThreadMessages(res.messages);

      // Auto-mark unread messages as read
      const unreadInThread = res.messages.filter(
        (m) => m.recipient_agent_id === agentId && m.status === "UNREAD"
      );
      for (const m of unreadInThread) {
        await markMessageRead(m.id);
      }
      loadData();
    } catch (err) {
      console.error("[ACP LOAD THREAD ERROR]:", err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId || !replyText.trim()) return;
    setSendingReply(true);

    try {
      const recipientId = threadMessages.find((m) => m.sender_agent_id !== agentId)?.sender_agent_id;
      await replyToMessage({
        sender_agent_id: agentId,
        thread_id: selectedThreadId,
        content: replyText.trim(),
        recipient_agent_id: recipientId,
      });

      setReplyText("");
      const res = await getThreadMessages(selectedThreadId);
      setThreadMessages(res.messages);
      loadData();
    } catch (err) {
      console.error("[ACP REPLY ERROR]:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgContent.trim()) return;
    setSendingMsg(true);

    try {
      if (isBroadcast) {
        await sendBroadcastMessage({
          sender_agent_id: agentId,
          subject: msgSubject.trim(),
          content: msgContent.trim(),
        });
      } else {
        if (!msgRecipientId) return;
        await sendDirectMessage({
          sender_agent_id: agentId,
          recipient_agent_id: msgRecipientId,
          subject: msgSubject.trim(),
          content: msgContent.trim(),
        });
      }

      setMsgSubject("");
      setMsgContent("");
      setMsgRecipientId("");
      setShowNewMsgModal(false);
      loadData();
    } catch (err) {
      console.error("[ACP SEND MSG ERROR]:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleResolveThread = async (threadId: string) => {
    await resolveThread(threadId);
    if (selectedThreadId === threadId) {
      const res = await getThreadMessages(threadId);
      setActiveThread(res.thread);
    }
    loadData();
  };

  const unreadCount = inbox.filter((m) => m.status === "UNREAD").length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Agent Communication Protocol (ACP) v1
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-slate-950">
                  {unreadCount} UNREAD
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 font-mono">Inter-Agent Direct Messaging & Information Request Protocol</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 transition-colors"
            title="Refresh Messages"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNewMsgModal(true)}
            className="px-3.5 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Send ACP Message</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Messages List vs Thread Conversation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Sub-Tab Navigation & List */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center space-x-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSubTab("inbox")}
              className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center space-x-1 ${
                subTab === "inbox" ? "bg-slate-800 text-purple-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <InboxIcon className="w-3.5 h-3.5" />
              <span>Inbox ({inbox.length})</span>
            </button>
            <button
              onClick={() => setSubTab("outbox")}
              className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center space-x-1 ${
                subTab === "outbox" ? "bg-slate-800 text-purple-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Outbox ({outbox.length})</span>
            </button>
          </div>

          {/* Messages List */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 max-h-[600px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-slate-500 font-mono text-xs py-8">Loading ACP messages...</p>
            ) : (subTab === "inbox" ? inbox : outbox).length === 0 ? (
              <p className="text-center text-slate-500 font-mono text-xs py-8">
                No {subTab} messages found for this agent.
              </p>
            ) : (
              (subTab === "inbox" ? inbox : outbox).map((msg) => {
                const isSelected = selectedThreadId === msg.thread_id;
                const isUnread = msg.status === "UNREAD" && subTab === "inbox";
                return (
                  <button
                    key={msg.id}
                    onClick={() => handleOpenThread(msg.thread_id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all space-y-1.5 ${
                      isSelected
                        ? "bg-purple-500/10 border-purple-500/40 text-slate-100"
                        : isUnread
                        ? "bg-slate-950 border-purple-500/30 text-slate-200 font-bold"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-400 font-bold flex items-center gap-1">
                        {msg.message_type === "BROADCAST" ? (
                          <Radio className="w-3 h-3 text-amber-400" />
                        ) : (
                          <User className="w-3 h-3 text-purple-400" />
                        )}
                        {subTab === "inbox"
                          ? msg.sender?.name || `Agent #${msg.sender_agent_id.substring(0, 6)}`
                          : msg.recipient?.name || (msg.message_type === "BROADCAST" ? "ALL (Broadcast)" : `Agent #${msg.recipient_agent_id?.substring(0, 6)}`)}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="text-xs font-bold line-clamp-1 text-slate-200">{msg.content}</p>

                    <div className="flex items-center justify-between text-[10px] pt-1">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                          msg.message_type === "REQUEST_INFO"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {msg.message_type}
                      </span>

                      {isUnread && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-slate-950">
                          UNREAD
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Thread Conversation Detail */}
        <div className="md:col-span-2 space-y-4">
          {selectedThreadId && activeThread ? (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
              {/* Thread Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{activeThread.subject}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Thread ID: #{activeThread.id}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      activeThread.status === "RESOLVED"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                    }`}
                  >
                    {activeThread.status}
                  </span>
                  {activeThread.status !== "RESOLVED" && (
                    <button
                      onClick={() => handleResolveThread(activeThread.id)}
                      className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 transition-colors flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Timeline */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {threadMessages.map((m) => {
                  const isMine = m.sender_agent_id === agentId;
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-xl space-y-2 border text-xs ${
                        isMine
                          ? "bg-purple-950/20 border-purple-500/30 ml-8 text-slate-200"
                          : "bg-slate-950 border-slate-800 mr-8 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-purple-400" />
                          {m.sender?.name || `Agent #${m.sender_agent_id.substring(0, 6)}`}{" "}
                          <span className="text-[10px] font-normal text-slate-500">({m.sender?.role || "Agent"})</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(m.created_at).toLocaleString()}
                        </span>
                      </div>

                      <p className="leading-relaxed font-mono whitespace-pre-wrap">{m.content}</p>

                      {/* Attachments if any */}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="pt-2 border-t border-slate-800/60 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-purple-400" /> Attachments ({m.attachments.length})
                          </span>
                          {m.attachments.map((att) => (
                            <div key={att.id} className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                              <span className="font-bold text-slate-200 block">{att.title}</span>
                              <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap">{att.content_or_url}</pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2 border-t border-slate-800">
                <textarea
                  rows={3}
                  placeholder="Type inter-agent reply message..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:border-purple-500 focus:outline-none"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sendingReply}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingReply ? "Sending Reply..." : "Send Reply"}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 font-mono text-xs">Select an ACP message from the Inbox or Outbox to view the full thread timeline.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMsgModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-lg w-full text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <Send className="w-4 h-4 text-purple-400" /> Send Inter-Agent Message (ACP v1)
              </span>
              <button
                onClick={() => setShowNewMsgModal(false)}
                className="text-slate-400 hover:text-slate-200 font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendNewMessage} className="space-y-4">
              <div className="flex items-center space-x-4 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="msgMode"
                    checked={!isBroadcast}
                    onChange={() => setIsBroadcast(false)}
                    className="accent-purple-500"
                  />
                  <span>Direct Message</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="msgMode"
                    checked={isBroadcast}
                    onChange={() => setIsBroadcast(true)}
                    className="accent-amber-500"
                  />
                  <span className="text-amber-400 font-bold">Broadcast to All Agents</span>
                </label>
              </div>

              {!isBroadcast && (
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Target Recipient Agent</label>
                  <select
                    value={msgRecipientId}
                    onChange={(e) => setMsgRecipientId(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs"
                    required={!isBroadcast}
                  >
                    <option value="">-- Select Recipient Agent --</option>
                    {allAgents
                      .filter((a) => a.id !== agentId)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.role})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Subject / Query Title</label>
                <input
                  type="text"
                  placeholder="e.g. Request Dataset Clarification for Catalog Items"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Message Content / Details</label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed question or instructions..."
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewMsgModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded-xl flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingMsg ? "Sending Message..." : "Send Message"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
