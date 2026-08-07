"use client";

/**
 * features/knowledge/knowledge-feature.tsx
 *
 * Universal Knowledge Engine UI (Phase 3.1 - Production Ready & Fully Connected).
 * Complete CRUD for Collections & Documents, Multi-layer Search,
 * Dynamic Statistics with Live Filter Connection, and Detail/Edit Modals.
 */

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  FolderPlus,
  FilePlus,
  Search,
  Tag,
  Layers,
  Sparkles,
  Database,
  Globe,
  ShoppingBag,
  FileText,
  HelpCircle,
  Shield,
  Code,
  FileCode,
  Link,
  StickyNote,
  Trash2,
  Eye,
  Edit3,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";
import type {
  KnowledgeCollectionRow,
  KnowledgeDocumentRow,
  KnowledgeCollectionType,
  KnowledgeDocumentStatus,
  KnowledgeSearchResult,
  KnowledgeEngineStats,
} from "@/types/knowledge-engine";

const COLLECTION_TYPES: { type: KnowledgeCollectionType; label: string; icon: React.ElementType; color: string }[] = [
  { type: "WEBSITE", label: "Website", icon: Globe, color: "text-blue-400" },
  { type: "PRODUCT_CATALOG", label: "Product Catalog", icon: ShoppingBag, color: "text-emerald-400" },
  { type: "BLOG", label: "Blog", icon: FileText, color: "text-purple-400" },
  { type: "DOCUMENTATION", label: "Documentation", icon: Code, color: "text-cyan-400" },
  { type: "PDF", label: "PDF", icon: FileCode, color: "text-rose-400" },
  { type: "MARKDOWN", label: "Markdown", icon: FileCode, color: "text-amber-400" },
  { type: "URL", label: "URL Link", icon: Link, color: "text-indigo-400" },
  { type: "NOTES", label: "Notes", icon: StickyNote, color: "text-yellow-400" },
  { type: "FAQS", label: "FAQs", icon: HelpCircle, color: "text-teal-400" },
  { type: "POLICIES", label: "Policies", icon: Shield, color: "text-orange-400" },
];

export function KnowledgeFeature() {
  const [activeTab, setActiveTab] = useState<"COLLECTIONS" | "DOCUMENTS" | "SEARCH" | "STATS">("COLLECTIONS");

  // Core Data
  const [collections, setCollections] = useState<KnowledgeCollectionRow[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocumentRow[]>([]);
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [stats, setStats] = useState<KnowledgeEngineStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  // Global Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Selection & Details
  const [selectedCollection, setSelectedCollection] = useState<KnowledgeCollectionRow | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocumentRow | null>(null);

  // Modals
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState<boolean>(false);
  const [showCreateDocModal, setShowCreateDocModal] = useState<boolean>(false);

  const [editingCollection, setEditingCollection] = useState<KnowledgeCollectionRow | null>(null);
  const [editingDocument, setEditingDocument] = useState<KnowledgeDocumentRow | null>(null);

  // Form State - Collections
  const [collName, setCollName] = useState<string>("");
  const [collDesc, setCollDesc] = useState<string>("");
  const [collType, setCollType] = useState<KnowledgeCollectionType>("DOCUMENTATION");
  const [collTags, setCollTags] = useState<string>("");
  const [collStatus, setCollStatus] = useState<string>("ACTIVE");

  // Form State - Documents
  const [docCollId, setDocCollId] = useState<string>("");
  const [docTitle, setDocTitle] = useState<string>("");
  const [docSource, setDocSource] = useState<string>("");
  const [docContent, setDocContent] = useState<string>("");
  const [docSummary, setDocSummary] = useState<string>("");
  const [docTags, setDocTags] = useState<string>("");
  const [docStatus, setDocStatus] = useState<KnowledgeDocumentStatus>("PROCESSED");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch Core Data
  const loadData = useCallback(async () => {
    try {
      const [collsRes, docsRes] = await Promise.all([
        fetch("/api/knowledge/collections", { cache: "no-store" }),
        fetch("/api/knowledge/documents", { cache: "no-store" }),
      ]);

      const collsData = await collsRes.json();
      const docsData = await docsRes.json();

      if (collsData.success) setCollections(collsData.collections || []);
      if (docsData.success) setDocuments(docsData.documents || []);
    } catch (err) {
      console.error("[LOAD KNOWLEDGE ENGINE ERROR]:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Filtered Stats (BUG 4 FIX: Connects filters directly to backend)
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      let url = "/api/knowledge/stats?";
      const params = new URLSearchParams();
      if (selectedTypeFilter !== "ALL") params.append("type", selectedTypeFilter);
      if (selectedStatusFilter !== "ALL") params.append("status", selectedStatusFilter);
      if (selectedCollectionFilter !== "ALL") params.append("collectionId", selectedCollectionFilter);

      url += params.toString();
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("[LOAD STATS ERROR]:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [selectedTypeFilter, selectedStatusFilter, selectedCollectionFilter]);

  useEffect(() => {
    let active = true;

    const fetchKnowledgeData = () => {
      Promise.all([
        fetch("/api/knowledge/collections", { cache: "no-store" }),
        fetch("/api/knowledge/documents", { cache: "no-store" }),
      ])
        .then(async ([collsRes, docsRes]) => {
          const collsData = await collsRes.json();
          const docsData = await docsRes.json();

          if (active) {
            if (collsData.success) setCollections(collsData.collections || []);
            if (docsData.success) setDocuments(docsData.documents || []);
          }
        })
        .catch((err) => {
          console.error("[LOAD KNOWLEDGE ENGINE ERROR]:", err);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    fetchKnowledgeData();
    const interval = setInterval(fetchKnowledgeData, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (selectedTypeFilter !== "ALL") params.append("type", selectedTypeFilter);
    if (selectedStatusFilter !== "ALL") params.append("status", selectedStatusFilter);
    if (selectedCollectionFilter !== "ALL") params.append("collectionId", selectedCollectionFilter);

    fetch(`/api/knowledge/stats?${params.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) {
          setStats(data.stats || null);
        }
      })
      .catch((err) => {
        console.error("[LOAD STATS ERROR]:", err);
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTypeFilter, selectedStatusFilter, selectedCollectionFilter]);

  // Execute Multi-Layer Search
  const handleExecuteSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      let url = `/api/knowledge/search?query=${encodeURIComponent(query)}`;
      if (selectedCollectionFilter !== "ALL") {
        url += `&collectionId=${selectedCollectionFilter}`;
      }
      if (selectedTypeFilter !== "ALL") {
        url += `&type=${selectedTypeFilter}`;
      }
      if (selectedStatusFilter !== "ALL") {
        url += `&status=${selectedStatusFilter}`;
      }

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create or Update Collection
  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collName.trim()) return;

    setSubmitting(true);
    try {
      const tags = collTags.split(",").map((t) => t.trim()).filter(Boolean);
      const isEdit = Boolean(editingCollection);
      const url = isEdit ? `/api/knowledge/collections/${editingCollection!.id}` : "/api/knowledge/collections";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: collName,
          description: collDesc,
          type: collType,
          status: collStatus,
          tags,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showFeedback("success", isEdit ? "Collection updated successfully!" : "Collection created successfully!");
        setShowCreateCollectionModal(false);
        setEditingCollection(null);
        resetCollForm();
        await loadData();
        await loadStats();
      } else {
        showFeedback("error", data.error || "Failed to save collection.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving collection";
      showFeedback("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Create or Update Document (BUG 3 FIX)
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;

    setSubmitting(true);
    try {
      const tags = docTags.split(",").map((t) => t.trim()).filter(Boolean);
      const isEdit = Boolean(editingDocument);
      const url = isEdit ? `/api/knowledge/documents/${editingDocument!.id}` : "/api/knowledge/documents";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId: docCollId || undefined,
          collection_id: docCollId || undefined,
          title: docTitle,
          source: docSource,
          rawContent: docContent,
          raw_content: docContent,
          summary: docSummary,
          status: docStatus,
          tags,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showFeedback("success", isEdit ? "Document updated successfully in database!" : "Document created successfully!");
        setShowCreateDocModal(false);
        setEditingDocument(null);
        resetDocForm();
        await loadData();
        await loadStats();
      } else {
        showFeedback("error", data.error || "Failed to save document.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving document";
      showFeedback("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Collection (BUG 1 FIX)
  const handleDeleteCollection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this collection and all associated documents?")) return;
    try {
      const res = await fetch(`/api/knowledge/collections/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback("success", "Collection deleted successfully.");
        setSelectedCollection(null);
        await loadData();
        await loadStats();
      } else {
        showFeedback("error", data.error || "Failed to delete collection.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete collection";
      showFeedback("error", msg);
    }
  };

  // Delete Document (BUG 2 FIX)
  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/knowledge/documents/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback("success", "Document deleted successfully.");
        setSelectedDocument(null);
        await loadData();
        await loadStats();
      } else {
        showFeedback("error", data.error || "Failed to delete document.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete document";
      showFeedback("error", msg);
    }
  };

  const openEditCollection = (col: KnowledgeCollectionRow) => {
    setEditingCollection(col);
    setCollName(col.name);
    setCollDesc(col.description || "");
    setCollType(col.type);
    setCollStatus(col.status);
    setCollTags((col.tags || []).join(", "));
    setShowCreateCollectionModal(true);
  };

  const openEditDocument = (doc: KnowledgeDocumentRow) => {
    setEditingDocument(doc);
    setDocTitle(doc.title);
    setDocSource(doc.source || "");
    setDocContent(doc.raw_content || doc.clean_content || "");
    setDocSummary(doc.summary || "");
    setDocCollId(doc.collection_id || "");
    setDocStatus(doc.status);
    setDocTags((doc.tags || []).join(", "));
    setShowCreateDocModal(true);
  };

  const resetCollForm = () => {
    setCollName("");
    setCollDesc("");
    setCollType("DOCUMENTATION");
    setCollStatus("ACTIVE");
    setCollTags("");
    setEditingCollection(null);
  };

  const resetDocForm = () => {
    setDocTitle("");
    setDocSource("");
    setDocContent("");
    setDocSummary("");
    setDocCollId("");
    setDocStatus("PROCESSED");
    setDocTags("");
    setEditingDocument(null);
  };

  // Filter collections
  const filteredCollections = collections.filter((c) => {
    if (selectedTypeFilter !== "ALL" && c.type !== selectedTypeFilter) return false;
    if (selectedStatusFilter !== "ALL" && c.status !== selectedStatusFilter) return false;
    if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Filter documents
  const filteredDocuments = documents.filter((d) => {
    if (selectedCollectionFilter !== "ALL" && d.collection_id !== selectedCollectionFilter) return false;
    if (selectedStatusFilter !== "ALL" && d.status !== selectedStatusFilter) return false;
    if (searchQuery.trim() && !d.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── NOTIFICATION TOAST ── */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ── HEADER & ACTIONS ── */}
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" /> Universal Knowledge Engine
            </h1>
            <p className="text-xs text-slate-400">
              The brain of Aura OS. Manage collections, indexing, full-text & semantic search for all agents and managers.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                resetCollForm();
                setShowCreateCollectionModal(true);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
            >
              <FolderPlus className="w-4 h-4 text-purple-400" />
              <span>New Collection</span>
            </button>

            <button
              onClick={() => {
                resetDocForm();
                setShowCreateDocModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-lg shadow-purple-500/20"
            >
              <FilePlus className="w-4 h-4" />
              <span>Add Document</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-t border-slate-800/80 pt-4 text-xs font-bold font-mono">
          <button
            onClick={() => setActiveTab("COLLECTIONS")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === "COLLECTIONS"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Collections ({collections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("DOCUMENTS")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === "DOCUMENTS"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Documents ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("SEARCH")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === "SEARCH"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Semantic Search</span>
          </button>

          <button
            onClick={() => setActiveTab("STATS")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              activeTab === "STATS"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Statistics & Telemetry</span>
          </button>
        </div>
      </div>

      {/* ── TOOLBAR / FILTERS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 border border-slate-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder={activeTab === "SEARCH" ? "Type search query..." : "Filter knowledge..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab === "SEARCH") handleExecuteSearch(e.target.value);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto overflow-x-auto text-xs">
          {/* Collection Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 font-mono text-xs focus:outline-none"
          >
            <option value="ALL">All Collection Types</option>
            {COLLECTION_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Collection Filter */}
          <select
            value={selectedCollectionFilter}
            onChange={(e) => setSelectedCollectionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 font-mono text-xs focus:outline-none"
          >
            <option value="ALL">All Collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 font-mono text-xs focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PROCESSED">PROCESSED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* ── TAB 1: COLLECTIONS ── */}
      {activeTab === "COLLECTIONS" && (
        <div>
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs animate-pulse">Loading collections...</div>
          ) : filteredCollections.length === 0 ? (
            <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-300">No Knowledge Collections Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create a collection to start organizing documentation, websites, FAQs, PDFs, and catalog data.
              </p>
              <button
                onClick={() => {
                  resetCollForm();
                  setShowCreateCollectionModal(true);
                }}
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
              >
                Create Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollections.map((col) => {
                const typeObj = COLLECTION_TYPES.find((t) => t.type === col.type) || COLLECTION_TYPES[0];
                const Icon = typeObj.icon;
                const docCount = documents.filter((d) => d.collection_id === col.id).length;

                return (
                  <div
                    key={col.id}
                    className="p-5 bg-slate-950 border border-slate-800 hover:border-purple-500/40 rounded-2xl space-y-3 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${typeObj.color}`}>
                          <Icon className="w-4 h-4" />
                        </span>

                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full uppercase">
                            {col.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3
                          onClick={() => setSelectedCollection(col)}
                          className="font-bold text-slate-100 text-sm hover:text-purple-300 cursor-pointer transition-colors"
                        >
                          {col.name}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                          {col.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-purple-400" /> {docCount} Docs
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => openEditCollection(col)}
                          className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                          title="Edit Collection"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(col.id)}
                          className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded border border-rose-500/30"
                          title="Delete Collection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: DOCUMENTS ── */}
      {activeTab === "DOCUMENTS" && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs animate-pulse">Loading documents...</div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-300">No Knowledge Documents Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add documents to populate the Universal Knowledge Engine for AI reasoning.
              </p>
              <button
                onClick={() => {
                  resetDocForm();
                  setShowCreateDocModal(true);
                }}
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
              >
                Add Document
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Document Title</th>
                    <th className="p-4">Collection</th>
                    <th className="p-4">Tokens</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredDocuments.map((doc) => {
                    const collection = collections.find((c) => c.id === doc.collection_id);

                    return (
                      <tr key={doc.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 font-bold text-slate-100">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                            <span className="truncate max-w-xs">{doc.title}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400">{collection?.name || "Unassigned"}</td>
                        <td className="p-4 font-bold text-emerald-400">{doc.tokens} tokens</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px]">
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedDocument(doc)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800"
                            title="View Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditDocument(doc)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-purple-300 rounded-lg border border-slate-800"
                            title="Edit Document"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: SEMANTIC SEARCH ── */}
      {activeTab === "SEARCH" && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="text-xs text-slate-300">
              Multi-layer Search Engine combining <strong>Full-text matching</strong>, <strong>Tag filtering</strong>, and <strong>Semantic Relevance Scoring</strong>. Ready for pgvector indexing.
            </div>
          </div>

          {searchResults.length === 0 ? (
            <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 font-mono text-xs">
              {searchQuery ? "No search results match your query." : "Type a query above to test the Universal Knowledge Search Engine."}
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((res) => (
                <div
                  key={res.document.id}
                  onClick={() => setSelectedDocument(res.document)}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-purple-500/40 rounded-2xl space-y-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" /> {res.document.title}
                    </h3>

                    <div className="flex items-center space-x-2 font-mono text-[10px]">
                      {res.collection && (
                        <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded">
                          {res.collection.name}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full font-bold">
                        Relevance: {Math.round(res.relevanceScore * 100)}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                    {res.snippet}
                  </p>

                  {res.matchedTerms.length > 0 && (
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
                      <Tag className="w-3 h-3 text-slate-500" />
                      <span>Matched terms:</span>
                      {res.matchedTerms.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-purple-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: STATISTICS & TELEMETRY (BUG 4 FIX: Live Filtered Stats) ── */}
      {activeTab === "STATS" && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-300">
              <Filter className="w-4 h-4 text-purple-400" />
              <span>Live Statistics Filters Applied:</span>
              <span className="text-purple-300 font-bold">Type ({selectedTypeFilter})</span> |
              <span className="text-purple-300 font-bold">Collection ({selectedCollectionFilter})</span> |
              <span className="text-purple-300 font-bold">Status ({selectedStatusFilter})</span>
            </div>

            {statsLoading && <span className="text-slate-400 animate-pulse">Updating Stats...</span>}
          </div>

          {stats && (
            <>
              {/* Top Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Layers className="w-4 h-4 text-purple-400" /> Active Collections
                  </span>
                  <div className="text-2xl font-bold text-slate-100">{stats.totalCollections}</div>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <FileText className="w-4 h-4 text-cyan-400" /> Active Documents
                  </span>
                  <div className="text-2xl font-bold text-slate-100">{stats.totalDocuments}</div>
                </div>

                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Cpu className="w-4 h-4 text-emerald-400" /> Token Volume
                  </span>
                  <div className="text-2xl font-bold text-emerald-400">{stats.totalTokens.toLocaleString()} tokens</div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
                {/* Collection Type Breakdown */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <h3 className="font-bold text-slate-200 uppercase text-[11px]">Collection Types Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.collectionTypeCounts).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-xl">
                        <span className="text-slate-300">{type}</span>
                        <span className="font-bold text-purple-400">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document Status Breakdown */}
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <h3 className="font-bold text-slate-200 uppercase text-[11px]">Recent Document Imports</h3>
                  <div className="space-y-2">
                    {stats.recentImports.length === 0 ? (
                      <div className="text-slate-500 py-4 text-center">No recent document imports for current filters.</div>
                    ) : (
                      stats.recentImports.map((doc) => (
                        <div key={doc.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                          <div className="font-bold text-slate-200 truncate">{doc.title}</div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{doc.tokens} tokens</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT COLLECTION MODAL ── */}
      {showCreateCollectionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-purple-400" />
              <span>{editingCollection ? "Edit Knowledge Collection" : "Create Knowledge Collection"}</span>
            </h2>

            <form onSubmit={handleSaveCollection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aura OS Documentation"
                  value={collName}
                  onChange={(e) => setCollName(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                    Collection Type *
                  </label>
                  <select
                    value={collType}
                    onChange={(e) => setCollType(e.target.value as KnowledgeCollectionType)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                  >
                    {COLLECTION_TYPES.map((t) => (
                      <option key={t.type} value={t.type}>
                        {t.label} ({t.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                    Status
                  </label>
                  <select
                    value={collStatus}
                    onChange={(e) => setCollStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SYNCING">SYNCING</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of knowledge content..."
                  value={collDesc}
                  onChange={(e) => setCollDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="docs, core, manual"
                  value={collTags}
                  onChange={(e) => setCollTags(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCollectionModal(false);
                    setEditingCollection(null);
                  }}
                  className="px-4 py-2 bg-slate-900 text-slate-400 rounded-xl hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                >
                  {submitting ? "Saving..." : editingCollection ? "Update Collection" : "Create Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT DOCUMENT MODAL (BUG 3 FIX) ── */}
      {showCreateDocModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-purple-400" />
              <span>{editingDocument ? "Edit Knowledge Document" : "Add Knowledge Document"}</span>
            </h2>

            <form onSubmit={handleSaveDocument} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Architecture Overview"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                    Assign Collection
                  </label>
                  <select
                    value={docCollId}
                    onChange={(e) => setDocCollId(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="">Unassigned</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                    Source / Origin URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://docs.auraos.dev/architecture"
                    value={docSource}
                    onChange={(e) => setDocSource(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                    Processing Status
                  </label>
                  <select
                    value={docStatus}
                    onChange={(e) => setDocStatus(e.target.value as KnowledgeDocumentStatus)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="PROCESSED">PROCESSED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FAILED">FAILED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                  Raw Content (Markdown / Text / HTML) *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste knowledge document content here..."
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                  AI Summary / Abstract
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional summary for quick indexing..."
                  value={docSummary}
                  onChange={(e) => setDocSummary(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono uppercase text-[10px] font-bold mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="architecture, database, core"
                  value={docTags}
                  onChange={(e) => setDocTags(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDocModal(false);
                    setEditingDocument(null);
                  }}
                  className="px-4 py-2 bg-slate-900 text-slate-400 rounded-xl hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl"
                >
                  {submitting ? "Saving..." : editingDocument ? "Update Document" : "Add Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DOCUMENT DETAIL MODAL ── */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" /> {selectedDocument.title}
                </h2>
                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                  ID: {selectedDocument.id} | Tokens: {selectedDocument.tokens} | Hash: {selectedDocument.hash}
                </span>
              </div>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-slate-400 hover:text-slate-200 font-mono text-xs px-2 py-1 bg-slate-900 rounded-lg"
              >
                Close
              </button>
            </div>

            {selectedDocument.summary && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-200">
                <strong>Summary:</strong> {selectedDocument.summary}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Clean Content</label>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 max-h-60 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {selectedDocument.clean_content || selectedDocument.raw_content}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  const docToEdit = selectedDocument;
                  setSelectedDocument(null);
                  openEditDocument(docToEdit);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Document
              </button>

              <button
                onClick={() => handleDeleteDocument(selectedDocument.id)}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COLLECTION DETAIL MODAL ── */}
      {selectedCollection && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" /> {selectedCollection.name}
                </h2>
                <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                  Type: {selectedCollection.type} | Status: {selectedCollection.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedCollection(null)}
                className="text-slate-400 hover:text-slate-200 font-mono text-xs px-2 py-1 bg-slate-900 rounded-lg"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-300 font-mono bg-slate-900 p-3 rounded-xl border border-slate-800">
              {selectedCollection.description || "No collection description."}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  const colToEdit = selectedCollection;
                  setSelectedCollection(null);
                  openEditCollection(colToEdit);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Collection
              </button>

              <button
                onClick={() => handleDeleteCollection(selectedCollection.id)}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold"
              >
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
