"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  FileText,
  Search,
  Plus,
  Download,
  Trash2,
  Eye,
  Pencil,
  Copy,
  X,
  BarChart3,
  CalendarDays,
} from "lucide-react";

interface DocumentRecord {
  id: string;
  user_id: string;
  title: string | null;
  original_text: string | null;
  humanized_text: string | null;
  created_at: string;
}

type SortOption =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "words-high"
  | "words-low";

const PAGE_SIZE = 10;
const TITLE_MAX_LENGTH = 120;
const planName = "Free";
const dailyLimit = 10;

function countWords(value: string | null | undefined): number {
  if (!value || !value.trim()) return 0;
  return value.trim().split(/\s+/).length;
}

function getUserInitial(user: User): string {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim().charAt(0).toUpperCase();
  }
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  return "U";
}

function getDocumentTitle(doc: DocumentRecord): string {
  if (doc.title && doc.title.trim()) return doc.title.trim();
  const source = doc.original_text?.trim() || doc.humanized_text?.trim() || "";
  if (!source) return "Untitled document";
  const words = source.split(/\s+/).slice(0, 8).join(" ");
  return words.length > 48 ? `${words.slice(0, 48)}…` : words;
}

function getStartOfWeekLocal(date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  return start;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toSafeFilename(title: string): string {
  const cleaned = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned ? `${cleaned}.txt` : "lexora-document.txt";
}

function DocumentsSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ padding: isMobile ? "80px 16px 32px" : "88px 28px 40px" }}>
      <div style={{ ...skeleton, width: isMobile ? "55%" : 220, height: 28, marginBottom: 10 }} />
      <div style={{ ...skeleton, width: isMobile ? "90%" : 380, height: 16, marginBottom: 28 }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[0, 1, 2].map((item) => (
          <div key={item} style={{ ...skeleton, height: 100 }} />
        ))}
      </div>
      <div style={{ ...skeleton, height: 52, marginBottom: 16 }} />
      <div style={{ ...skeleton, height: 360 }} />
    </div>
  );
}

export default function DocumentsPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [todayUsage, setTodayUsage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [renameDoc, setRenameDoc] = useState<DocumentRecord | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), 2500);
  }, []);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setErrorMessage(null);

      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Documents session error:", sessionError);
        if (isMounted) {
          setErrorMessage(
            "We could not load your documents. Please refresh and try again.",
          );
          setCheckingAuth(false);
          setLoadingDocuments(false);
        }
        return;
      }

      if (!currentSession) {
        router.replace("/login");
        return;
      }

      if (!isMounted) return;
      setSession(currentSession);
      setCheckingAuth(false);

      const userId = currentSession.user.id;
      const today = new Date().toISOString().split("T")[0];

      const [docsResult, usageResult] = await Promise.all([
        supabase
          .from("documents")
          .select("id, user_id, title, original_text, humanized_text, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("usage")
          .select("count")
          .eq("user_id", userId)
          .eq("date", today)
          .maybeSingle(),
      ]);

      if (docsResult.error) {
        console.error("Documents load error:", docsResult.error);
        if (isMounted) {
          setErrorMessage(
            "We could not load your documents. Please refresh and try again.",
          );
          setDocuments([]);
        }
      } else if (isMounted) {
        setDocuments((docsResult.data as DocumentRecord[]) || []);
      }

      if (usageResult.error) {
        console.error("Documents usage load error:", usageResult.error);
      } else if (isMounted) {
        setTodayUsage(usageResult.data?.count || 0);
      }

      if (isMounted) setLoadingDocuments(false);
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        router.replace("/login");
        return;
      }
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, sortOption]);

  useEffect(() => {
    if (!previewDoc && !renameDoc && !deleteDoc) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewDoc(null);
        setRenameDoc(null);
        setDeleteDoc(null);
        setRenameError(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewDoc, renameDoc, deleteDoc]);

  const weekStart = useMemo(() => getStartOfWeekLocal(), []);

  const totalWords = useMemo(
    () =>
      documents.reduce(
        (sum, doc) => sum + countWords(doc.humanized_text),
        0,
      ),
    [documents],
  );

  const savedThisWeek = useMemo(
    () =>
      documents.filter((doc) => new Date(doc.created_at) >= weekStart).length,
    [documents, weekStart],
  );

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return documents;

    return documents.filter((doc) => {
      const title = (doc.title || "").toLowerCase();
      const original = (doc.original_text || "").toLowerCase();
      const humanized = (doc.humanized_text || "").toLowerCase();
      return (
        title.includes(query) ||
        original.includes(query) ||
        humanized.includes(query)
      );
    });
  }, [documents, searchQuery]);

  const sortedDocuments = useMemo(() => {
    const list = [...filteredDocuments];

    list.sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "name-asc":
          return getDocumentTitle(a).localeCompare(getDocumentTitle(b));
        case "name-desc":
          return getDocumentTitle(b).localeCompare(getDocumentTitle(a));
        case "words-high":
          return countWords(b.humanized_text) - countWords(a.humanized_text);
        case "words-low":
          return countWords(a.humanized_text) - countWords(b.humanized_text);
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return list;
  }, [filteredDocuments, sortOption]);

  const visibleDocuments = sortedDocuments.slice(0, visibleCount);
  const hasMore = visibleCount < sortedDocuments.length;

  const navigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const copyHumanized = async (doc: DocumentRecord) => {
    const text = doc.humanized_text || "";
    if (!text.trim()) {
      setErrorMessage("This document has no humanized text to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(doc.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      setErrorMessage("We could not copy the text. Please try again.");
    }
  };

  const downloadDocument = (doc: DocumentRecord) => {
    const title = getDocumentTitle(doc);
    const content = [
      title,
      "",
      "Humanized Text",
      "---------------",
      doc.humanized_text || "",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = toSafeFilename(title);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openRename = (doc: DocumentRecord) => {
    setRenameDoc(doc);
    setRenameValue(doc.title?.trim() || getDocumentTitle(doc));
    setRenameError(null);
  };

  const saveRename = async () => {
    if (!session || !renameDoc) return;

    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      setRenameError("Please enter a document title.");
      return;
    }
    if (nextTitle.length > TITLE_MAX_LENGTH) {
      setRenameError(`Title must be ${TITLE_MAX_LENGTH} characters or fewer.`);
      return;
    }

    setIsRenaming(true);
    setRenameError(null);

    const { error } = await supabase
      .from("documents")
      .update({ title: nextTitle })
      .eq("id", renameDoc.id)
      .eq("user_id", session.user.id);

    setIsRenaming(false);

    if (error) {
      console.error("Rename error:", error);
      setRenameError("We could not rename this document. Please try again.");
      return;
    }

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === renameDoc.id ? { ...doc, title: nextTitle } : doc,
      ),
    );
    setRenameDoc(null);
    showSuccess("Document renamed successfully.");
  };

  const confirmDelete = async () => {
    if (!session || !deleteDoc) return;

    setIsDeleting(true);

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", deleteDoc.id)
      .eq("user_id", session.user.id);

    setIsDeleting(false);

    if (error) {
      console.error("Delete error:", error);
      setErrorMessage("We could not delete this document. Please try again.");
      return;
    }

    setDocuments((prev) => prev.filter((doc) => doc.id !== deleteDoc.id));
    if (previewDoc?.id === deleteDoc.id) setPreviewDoc(null);
    setDeleteDoc(null);
    showSuccess("Document deleted.");
  };

  const reloadDocuments = async () => {
    if (!session) return;
    setLoadingDocuments(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("documents")
      .select("id, user_id, title, original_text, humanized_text, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Documents reload error:", error);
      setErrorMessage(
        "We could not load your documents. Please refresh and try again.",
      );
      setLoadingDocuments(false);
      return;
    }

    setDocuments((data as DocumentRecord[]) || []);
    setLoadingDocuments(false);
  };

  const isLoading = checkingAuth || loadingDocuments;

  return (
    <main
      style={{
        ...pageShell,
        flexDirection: isMobile ? "column" : "row",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <style>{`
        .lexora-docs-row:hover {
          background: #faf5ff;
        }
        .lexora-docs-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .lexora-docs-primary:hover {
          filter: brightness(1.05);
        }
        .lexora-docs-danger:hover {
          background: #fee2e2;
        }
        .lexora-docs-btn:focus-visible,
        .lexora-docs-primary:focus-visible,
        .lexora-docs-danger:focus-visible,
        .lexora-docs-input:focus-visible,
        .lexora-docs-select:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
      `}</style>

      <Sidebar
        isMobile={isMobile}
        onNavigate={navigate}
        activePath="/documents"
        onLogout={handleLogout}
      />

      <section style={contentShell}>
        <Header
          isMobile={isMobile}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen(!menuOpen)}
          onCloseMenu={() => setMenuOpen(false)}
          onNavigate={navigate}
          session={session}
          uses={todayUsage}
          getUserInitial={getUserInitial}
          planName={planName}
          dailyLimit={dailyLimit}
          onLogout={handleLogout}
        />

        {isLoading ? (
          <DocumentsSkeleton isMobile={isMobile} />
        ) : (
          <div
            style={{
              ...contentPad,
              padding: isMobile ? "80px 16px 32px" : "88px 28px 40px",
            }}
          >
            <header
              style={{
                ...pageHeader,
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                gap: isMobile ? 14 : 16,
              }}
            >
              <div>
                <h1 style={{ ...pageTitle, fontSize: isMobile ? 28 : 32 }}>
                  Documents
                </h1>
                <p style={pageSubtitle}>
                  Manage, review, and reuse your humanized content.
                </p>
              </div>

              <button
                type="button"
                className="lexora-docs-primary"
                onClick={() => navigate("/")}
                style={{
                  ...primaryButton,
                  width: isMobile ? "100%" : "auto",
                }}
              >
                <Plus size={18} />
                New Document
              </button>
            </header>

            {errorMessage ? (
              <div style={errorBanner} role="alert">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  className="lexora-docs-btn"
                  onClick={reloadDocuments}
                  style={retryButton}
                >
                  Retry
                </button>
              </div>
            ) : null}

            {successMessage ? (
              <p style={successBanner} role="status">
                {successMessage}
              </p>
            ) : null}

            <section
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: isMobile ? 12 : 16,
                marginBottom: isMobile ? 18 : 22,
              }}
            >
              <article style={summaryCard}>
                <div style={{ ...summaryIcon, background: "#f3e8ff", color: "#6d28d9" }}>
                  <FileText size={18} />
                </div>
                <p style={summaryLabel}>Total Documents</p>
                <h2 style={summaryValue}>{documents.length}</h2>
              </article>

              <article style={summaryCard}>
                <div style={{ ...summaryIcon, background: "#dcfce7", color: "#15803d" }}>
                  <BarChart3 size={18} />
                </div>
                <p style={summaryLabel}>Total Words</p>
                <h2 style={summaryValue}>{totalWords.toLocaleString()}</h2>
              </article>

              <article style={summaryCard}>
                <div style={{ ...summaryIcon, background: "#ffedd5", color: "#b45309" }}>
                  <CalendarDays size={18} />
                </div>
                <p style={summaryLabel}>Saved This Week</p>
                <h2 style={summaryValue}>{savedThisWeek}</h2>
              </article>
            </section>

            <div
              style={{
                ...toolbar,
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <label style={searchBox}>
                <Search size={18} color="#94a3b8" aria-hidden />
                <input
                  className="lexora-docs-input"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search documents..."
                  aria-label="Search documents"
                  style={searchInput}
                />
              </label>

              <select
                className="lexora-docs-select"
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
                aria-label="Sort documents"
                style={sortSelect}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name-asc">Name A–Z</option>
                <option value="name-desc">Name Z–A</option>
                <option value="words-high">Highest word count</option>
                <option value="words-low">Lowest word count</option>
              </select>
            </div>

            <section style={documentsCard}>
              {!isMobile && documents.length > 0 && sortedDocuments.length > 0 ? (
                <div style={tableHeader}>
                  <span>Document</span>
                  <span>Words</span>
                  <span>Created</span>
                  <span>Actions</span>
                </div>
              ) : null}

              {documents.length === 0 ? (
                <div style={emptyState}>
                  <div style={emptyIcon}>
                    <FileText size={22} />
                  </div>
                  <h2 style={emptyTitle}>No documents saved yet</h2>
                  <p style={emptyText}>
                    Humanize your first piece of content and save it here for later.
                  </p>
                  <button
                    type="button"
                    className="lexora-docs-primary"
                    onClick={() => navigate("/")}
                    style={primaryButton}
                  >
                    Open humanizer
                  </button>
                </div>
              ) : sortedDocuments.length === 0 ? (
                <div style={emptyState}>
                  <h2 style={emptyTitle}>No matching documents</h2>
                  <p style={emptyText}>
                    Try a different search term or clear your search to see all documents.
                  </p>
                  <button
                    type="button"
                    className="lexora-docs-btn"
                    onClick={() => setSearchQuery("")}
                    style={secondaryButton}
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <>
                  {visibleDocuments.map((doc) => {
                    const title = getDocumentTitle(doc);
                    const words = countWords(doc.humanized_text);
                    const preview =
                      doc.humanized_text?.trim().slice(0, 110) ||
                      "No humanized text available.";

                    if (isMobile) {
                      return (
                        <article key={doc.id} style={mobileCard}>
                          <div style={docTitleWrap}>
                            <div style={docIcon}>
                              <FileText size={18} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <h3 style={docTitleText} title={title}>
                                {title}
                              </h3>
                              <p style={mutedText}>
                                {words} words · {formatDate(doc.created_at)}
                              </p>
                              <span style={typeBadge}>Humanized</span>
                            </div>
                          </div>
                          <p style={mobilePreview}>{preview}</p>
                          <div style={mobileActions}>
                            <button
                              type="button"
                              className="lexora-docs-btn"
                              aria-label={`View ${title}`}
                              title="View"
                              onClick={() => setPreviewDoc(doc)}
                              style={actionButton}
                            >
                              <Eye size={16} />
                              View
                            </button>
                            <button
                              type="button"
                              className="lexora-docs-btn"
                              aria-label={`Copy ${title}`}
                              title="Copy"
                              onClick={() => copyHumanized(doc)}
                              style={actionButton}
                            >
                              <Copy size={16} />
                              {copiedId === doc.id ? "Copied" : "Copy"}
                            </button>
                            <button
                              type="button"
                              className="lexora-docs-btn"
                              aria-label={`Download ${title}`}
                              title="Download"
                              onClick={() => downloadDocument(doc)}
                              style={actionButton}
                            >
                              <Download size={16} />
                              Download
                            </button>
                            <button
                              type="button"
                              className="lexora-docs-btn"
                              aria-label={`Rename ${title}`}
                              title="Rename"
                              onClick={() => openRename(doc)}
                              style={actionButton}
                            >
                              <Pencil size={16} />
                              Rename
                            </button>
                            <button
                              type="button"
                              className="lexora-docs-danger"
                              aria-label={`Delete ${title}`}
                              title="Delete"
                              onClick={() => setDeleteDoc(doc)}
                              style={dangerButton}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        </article>
                      );
                    }

                    return (
                      <div key={doc.id} className="lexora-docs-row" style={docRow}>
                        <div style={docTitleWrap}>
                          <div style={docIcon}>
                            <FileText size={18} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={docTitleText} title={title}>
                              {title}
                            </p>
                            <span style={typeBadge}>Humanized</span>
                          </div>
                        </div>
                        <span style={cellText}>{words.toLocaleString()}</span>
                        <span style={cellText}>{formatDate(doc.created_at)}</span>
                        <div style={actions}>
                          <button
                            type="button"
                            className="lexora-docs-btn"
                            aria-label={`View ${title}`}
                            title="View"
                            onClick={() => setPreviewDoc(doc)}
                            style={iconButton}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="lexora-docs-btn"
                            aria-label={`Copy ${title}`}
                            title={copiedId === doc.id ? "Copied" : "Copy"}
                            onClick={() => copyHumanized(doc)}
                            style={iconButton}
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            type="button"
                            className="lexora-docs-btn"
                            aria-label={`Download ${title}`}
                            title="Download"
                            onClick={() => downloadDocument(doc)}
                            style={iconButton}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            type="button"
                            className="lexora-docs-btn"
                            aria-label={`Rename ${title}`}
                            title="Rename"
                            onClick={() => openRename(doc)}
                            style={iconButton}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="lexora-docs-danger"
                            aria-label={`Delete ${title}`}
                            title="Delete"
                            onClick={() => setDeleteDoc(doc)}
                            style={dangerIconButton}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div style={listFooter}>
                    <p style={mutedText}>
                      Showing {visibleDocuments.length} of {sortedDocuments.length}{" "}
                      documents
                    </p>
                    {hasMore ? (
                      <button
                        type="button"
                        className="lexora-docs-btn"
                        onClick={() =>
                          setVisibleCount((count) => count + PAGE_SIZE)
                        }
                        style={secondaryButton}
                      >
                        Load more
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </section>

      {previewDoc ? (
        <div
          style={overlay}
          onClick={() => setPreviewDoc(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-preview-title"
            style={modal}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={modalHeader}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 id="document-preview-title" style={modalTitle}>
                  {getDocumentTitle(previewDoc)}
                </h2>
                <p style={mutedText}>
                  {formatDate(previewDoc.created_at)} ·{" "}
                  {countWords(previewDoc.humanized_text)} words
                </p>
              </div>
              <button
                type="button"
                className="lexora-docs-btn"
                aria-label="Close preview"
                title="Close"
                onClick={() => setPreviewDoc(null)}
                style={iconButton}
              >
                <X size={16} />
              </button>
            </div>

            <div style={modalBody}>
              <section style={previewSection}>
                <h3 style={sectionHeading}>Original Text</h3>
                <div style={previewBox}>
                  {previewDoc.original_text?.trim() || "No original text saved."}
                </div>
              </section>
              <section style={previewSection}>
                <h3 style={sectionHeading}>Humanized Text</h3>
                <div style={previewBox}>
                  {previewDoc.humanized_text?.trim() ||
                    "No humanized text saved."}
                </div>
              </section>
            </div>

            <div style={modalFooter}>
              <button
                type="button"
                className="lexora-docs-btn"
                onClick={() => copyHumanized(previewDoc)}
                style={secondaryButton}
              >
                <Copy size={16} />
                {copiedId === previewDoc.id ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                className="lexora-docs-btn"
                onClick={() => downloadDocument(previewDoc)}
                style={secondaryButton}
              >
                <Download size={16} />
                Download
              </button>
              <button
                type="button"
                className="lexora-docs-btn"
                onClick={() => {
                  openRename(previewDoc);
                }}
                style={secondaryButton}
              >
                <Pencil size={16} />
                Rename
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {renameDoc ? (
        <div
          style={overlay}
          onClick={() => {
            if (!isRenaming) {
              setRenameDoc(null);
              setRenameError(null);
            }
          }}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-document-title"
            style={smallModal}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="rename-document-title" style={modalTitle}>
              Rename document
            </h2>
            <label style={fieldLabel} htmlFor="rename-input">
              Document title
            </label>
            <input
              id="rename-input"
              className="lexora-docs-input"
              value={renameValue}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(event) => setRenameValue(event.target.value)}
              style={textInput}
              disabled={isRenaming}
            />
            {renameError ? (
              <p style={inlineError} role="alert">
                {renameError}
              </p>
            ) : null}
            <div style={modalFooter}>
              <button
                type="button"
                className="lexora-docs-btn"
                disabled={isRenaming}
                onClick={() => {
                  setRenameDoc(null);
                  setRenameError(null);
                }}
                style={secondaryButton}
              >
                Cancel
              </button>
              <button
                type="button"
                className="lexora-docs-primary"
                disabled={isRenaming}
                onClick={saveRename}
                style={{
                  ...primaryButton,
                  opacity: isRenaming ? 0.7 : 1,
                  cursor: isRenaming ? "not-allowed" : "pointer",
                }}
              >
                {isRenaming ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteDoc ? (
        <div
          style={overlay}
          onClick={() => {
            if (!isDeleting) setDeleteDoc(null);
          }}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-document-title"
            style={smallModal}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-document-title" style={modalTitle}>
              Delete document
            </h2>
            <p style={deleteText}>
              Delete <strong>{getDocumentTitle(deleteDoc)}</strong>? This action
              cannot be undone.
            </p>
            <div style={modalFooter}>
              <button
                type="button"
                className="lexora-docs-btn"
                disabled={isDeleting}
                onClick={() => setDeleteDoc(null)}
                style={secondaryButton}
              >
                Cancel
              </button>
              <button
                type="button"
                className="lexora-docs-danger"
                disabled={isDeleting}
                onClick={confirmDelete}
                style={{
                  ...confirmDeleteButton,
                  opacity: isDeleting ? 0.7 : 1,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                }}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

const pageShell = {
  minHeight: "100vh",
  display: "flex",
  backgroundImage:
    "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139, 92, 246, 0.08), transparent 55%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
  backgroundColor: "#f8fafc",
  color: "#0f172a",
};

const contentShell = {
  flex: 1,
  width: "100%",
  minWidth: 0,
};

const contentPad = {
  width: "100%",
  maxWidth: "1100px",
  margin: "0 auto",
  boxSizing: "border-box" as const,
  overflowX: "hidden" as const,
};

const pageHeader = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "24px",
};

const pageTitle = {
  margin: 0,
  fontWeight: 700 as const,
  letterSpacing: "-0.025em",
  color: "#0f172a",
  lineHeight: 1.2,
};

const pageSubtitle = {
  margin: "10px 0 0",
  color: "#64748b",
  fontSize: "15px",
  lineHeight: 1.6,
};

const primaryButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "12px 18px",
  minHeight: "44px",
  borderRadius: "11px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "14px",
  transition: "filter 0.15s ease",
};

const secondaryButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 14px",
  minHeight: "42px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "13px",
  transition: "background 0.15s ease, border-color 0.15s ease",
};

const summaryCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
};

const summaryIcon = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "12px",
};

const summaryLabel = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 500 as const,
};

const summaryValue = {
  margin: "6px 0 0",
  fontSize: "26px",
  fontWeight: 700 as const,
  letterSpacing: "-0.02em",
  color: "#0f172a",
};

const toolbar = {
  display: "flex",
  gap: "12px",
  marginBottom: "18px",
};

const searchBox = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "0 14px",
  minHeight: "48px",
  width: "100%",
  boxSizing: "border-box" as const,
};

const searchInput = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: "14px",
  color: "#0f172a",
  fontFamily: "inherit",
  minWidth: 0,
};

const sortSelect = {
  minWidth: "180px",
  width: "100%",
  maxWidth: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#0f172a",
  fontSize: "14px",
  fontFamily: "inherit",
  minHeight: "48px",
};

const documentsCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "2.2fr 0.8fr 1fr 1.4fr",
  gap: "12px",
  padding: "14px 20px",
  background: "#f8fafc",
  color: "#64748b",
  fontWeight: 600 as const,
  fontSize: "12px",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  borderBottom: "1px solid #e8eaf0",
};

const docRow = {
  display: "grid",
  gridTemplateColumns: "2.2fr 0.8fr 1fr 1.4fr",
  gap: "12px",
  alignItems: "center",
  padding: "16px 20px",
  borderTop: "1px solid #f1f5f9",
  background: "#ffffff",
  transition: "background 0.15s ease",
};

const mobileCard = {
  padding: "16px",
  borderTop: "1px solid #f1f5f9",
};

const docTitleWrap = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  minWidth: 0,
};

const docIcon = {
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  background: "#f3e8ff",
  color: "#7c3aed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const docTitleText = {
  margin: "0 0 4px",
  fontWeight: 600 as const,
  color: "#0f172a",
  fontSize: "14px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const typeBadge = {
  display: "inline-block",
  marginTop: "4px",
  background: "#f5f3ff",
  color: "#6d28d9",
  padding: "3px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 600 as const,
};

const cellText = {
  color: "#475569",
  fontSize: "14px",
};

const mutedText = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.45,
};

const actions = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap" as const,
};

const iconButton = {
  width: "36px",
  height: "36px",
  borderRadius: "9px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#334155",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background 0.15s ease, border-color 0.15s ease",
};

const dangerIconButton = {
  ...iconButton,
  color: "#dc2626",
};

const actionButton = {
  ...secondaryButton,
  minHeight: "40px",
  padding: "8px 12px",
};

const dangerButton = {
  ...actionButton,
  color: "#dc2626",
  borderColor: "#fecaca",
  background: "#fff5f5",
};

const mobilePreview = {
  margin: "12px 0 14px",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.55,
};

const mobileActions = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
};

const listFooter = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
  padding: "16px 20px",
  borderTop: "1px solid #f1f5f9",
};

const emptyState = {
  padding: "48px 24px",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  textAlign: "center" as const,
};

const emptyIcon = {
  width: "48px",
  height: "48px",
  borderRadius: "12px",
  background: "#f3e8ff",
  color: "#7c3aed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "14px",
};

const emptyTitle = {
  margin: "0 0 8px",
  fontSize: "17px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const emptyText = {
  margin: "0 0 18px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
  maxWidth: "360px",
};

const errorBanner = {
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  fontSize: "14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const successBanner = {
  marginBottom: "16px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#15803d",
  fontSize: "14px",
};

const retryButton = {
  ...secondaryButton,
  minHeight: "36px",
  padding: "8px 12px",
};

const overlay = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(15, 23, 42, 0.45)",
  zIndex: 100000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
};

const modal = {
  width: "100%",
  maxWidth: "760px",
  maxHeight: "90vh",
  overflow: "auto",
  background: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)",
  padding: "20px",
  boxSizing: "border-box" as const,
};

const smallModal = {
  ...modal,
  maxWidth: "440px",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "16px",
};

const modalTitle = {
  margin: "0 0 6px",
  fontSize: "18px",
  fontWeight: 700 as const,
  color: "#0f172a",
  letterSpacing: "-0.015em",
};

const modalBody = {
  display: "grid",
  gap: "14px",
};

const previewSection = {
  minWidth: 0,
};

const sectionHeading = {
  margin: "0 0 8px",
  fontSize: "13px",
  fontWeight: 600 as const,
  color: "#64748b",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
};

const previewBox = {
  border: "1px solid #e8eaf0",
  borderRadius: "12px",
  background: "#fafbfc",
  padding: "14px",
  whiteSpace: "pre-wrap" as const,
  color: "#0f172a",
  fontSize: "14px",
  lineHeight: 1.6,
  maxHeight: "240px",
  overflow: "auto",
};

const modalFooter = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
  marginTop: "18px",
};

const fieldLabel = {
  display: "block",
  margin: "12px 0 8px",
  fontSize: "13px",
  fontWeight: 600 as const,
  color: "#475569",
};

const textInput = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  fontSize: "14px",
  fontFamily: "inherit",
  color: "#0f172a",
  outline: "none",
};

const inlineError = {
  margin: "10px 0 0",
  color: "#b91c1c",
  fontSize: "13px",
};

const deleteText = {
  margin: "8px 0 0",
  color: "#475569",
  fontSize: "14px",
  lineHeight: 1.6,
};

const confirmDeleteButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 16px",
  minHeight: "42px",
  borderRadius: "10px",
  border: "none",
  background: "#dc2626",
  color: "#ffffff",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "14px",
};

const skeleton = {
  background: "linear-gradient(90deg, #eef2f7 0%, #f8fafc 50%, #eef2f7 100%)",
  borderRadius: "14px",
  border: "1px solid #e8eaf0",
};
