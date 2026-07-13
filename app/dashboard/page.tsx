"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  FileText,
  TrendingUp,
  Zap,
  Clock,
  Crown,
} from "lucide-react";

interface RecentDocument {
  id: string;
  title: string | null;
  original_text: string | null;
  humanized_text: string | null;
  created_at: string;
}

interface UsageRecord {
  date: string;
  count: number;
}

interface DayUsage {
  dateKey: string;
  label: string;
  count: number;
}

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  note: string;
  tone?: "purple" | "green" | "orange" | "blue";
}

const planName = "Free";
const dailyLimit = 10;

function countWords(text: string | null | undefined): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
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

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getLastSevenDateKeys(): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() - i);
    keys.push(toDateKey(day));
  }
  return keys;
}

function formatChartLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDocumentDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDocumentTitle(doc: RecentDocument): string {
  if (doc.title && doc.title.trim()) return doc.title.trim();
  const source = doc.original_text?.trim() || doc.humanized_text?.trim() || "";
  if (!source) return "Untitled document";
  return source.length > 42 ? `${source.slice(0, 42)}…` : source;
}

function StatCard({ icon, title, value, note, tone = "purple" }: StatCardProps) {
  const colors = {
    purple: { color: "#6d28d9", background: "#f3e8ff" },
    green: { color: "#15803d", background: "#dcfce7" },
    orange: { color: "#b45309", background: "#ffedd5" },
    blue: { color: "#1d4ed8", background: "#dbeafe" },
  }[tone];

  return (
    <article style={statCard}>
      <div style={{ ...statIcon, color: colors.color, background: colors.background }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={statLabel}>{title}</p>
        <h2 style={statValue}>{value}</h2>
        <p style={{ ...statNote, color: colors.color }}>{note}</p>
      </div>
    </article>
  );
}

function UsageChart({ days }: { days: DayUsage[] }) {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const maxValue = Math.max(...days.map((day) => day.count), 1);
  const width = 720;
  const height = 260;
  const paddingX = 48;
  const paddingY = 28;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2 - 24;

  const points = days.map((day, index) => {
    const x =
      paddingX +
      (days.length === 1 ? chartWidth / 2 : (index / (days.length - 1)) * chartWidth);
    const y =
      paddingY + chartHeight - (day.count / maxValue) * chartHeight;
    return { x, y, ...day };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) =>
    Math.round(maxValue * ratio),
  );

  return (
    <article style={panelCard}>
      <div style={cardHeader}>
        <div>
          <h2 style={cardTitle}>Humanizations over time</h2>
          <p style={cardMeta}>
            {total} total · {formatChartLabel(days[0]?.dateKey || "")} –{" "}
            {formatChartLabel(days[days.length - 1]?.dateKey || "")}
          </p>
        </div>
        <span style={rangeBadge}>Last 7 days</span>
      </div>

      {total === 0 ? (
        <div style={emptyChart}>
          <p style={emptyTitle}>No activity yet</p>
          <p style={emptyText}>
            Your daily humanizations for the last week will appear here.
          </p>
        </div>
      ) : (
        <div style={chartBox}>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Humanizations over the last seven days"
          >
            {yTicks.map((tick, index) => {
              const y = paddingY + (index / (yTicks.length - 1)) * chartHeight;
              return (
                <g key={`${tick}-${index}`}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#e8eaf0"
                    strokeWidth="1"
                  />
                  <text x={12} y={y + 4} fontSize="12" fill="#94a3b8">
                    {tick}
                  </text>
                </g>
              );
            })}

            <polyline
              points={polyline}
              fill="none"
              stroke="#7c3aed"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point) => (
              <g key={point.dateKey}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#7c3aed"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
                <text
                  x={point.x}
                  y={height - 8}
                  fontSize="12"
                  fill="#64748b"
                  textAnchor="middle"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </article>
  );
}

function UsageProgress({
  todayUsage,
  remainingUses,
}: {
  todayUsage: number;
  remainingUses: number;
}) {
  const percent = Math.min((todayUsage / dailyLimit) * 100, 100);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <article style={{ ...panelCard, ...usageCardLayout }}>
      <div style={progressWrap} aria-hidden>
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="#ede9fe"
            strokeWidth="10"
          />
          <circle
            cx="55"
            cy="55"
            r={radius}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 55 55)"
          />
          <text
            x="55"
            y="58"
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="#0f172a"
          >
            {Math.round(percent)}%
          </text>
        </svg>
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <h2 style={cardTitle}>Daily usage</h2>
        <p style={usagePrimary}>
          You have used {todayUsage} of {dailyLimit} daily rewrites.
        </p>
        <p style={mutedText}>{remainingUses} remaining today</p>
        <p style={resetText}>Resets tomorrow</p>
      </div>
    </article>
  );
}

function RecentDocumentsCard({
  documents,
  onOpenDocuments,
  onOpenHumanizer,
}: {
  documents: RecentDocument[];
  onOpenDocuments: () => void;
  onOpenHumanizer: () => void;
}) {
  return (
    <article style={panelCard}>
      <div style={cardHeader}>
        <h2 style={cardTitle}>Recent documents</h2>
        <button type="button" onClick={onOpenDocuments} style={linkButton}>
          View all
        </button>
      </div>

      {documents.length === 0 ? (
        <div style={emptyDocs}>
          <div style={emptyIcon}>
            <FileText size={22} />
          </div>
          <p style={emptyTitle}>No documents saved yet</p>
          <p style={emptyText}>
            Humanize text and save it to see your recent work here.
          </p>
          <button type="button" onClick={onOpenHumanizer} style={primaryButton}>
            Open humanizer
          </button>
        </div>
      ) : (
        <div style={docsList}>
          {documents.map((doc) => (
            <button
              key={doc.id}
              type="button"
              onClick={onOpenDocuments}
              style={docRow}
              className="lexora-doc-row"
            >
              <div style={docIcon}>
                <FileText size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <p style={docTitle}>{getDocumentTitle(doc)}</p>
                <p style={mutedText}>
                  {countWords(doc.humanized_text)} words ·{" "}
                  {formatDocumentDate(doc.created_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function DashboardSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ ...contentPad, padding: isMobile ? "80px 16px 32px" : "88px 28px 40px" }}>
      <div style={{ ...skeletonBlock, width: isMobile ? "60%" : "240px", height: 28, marginBottom: 10 }} />
      <div style={{ ...skeletonBlock, width: isMobile ? "90%" : "420px", height: 16, marginBottom: 28 }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[0, 1, 2, 3].map((item) => (
          <div key={item} style={{ ...skeletonBlock, height: 110 }} />
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr",
          gap: 16,
        }}
      >
        <div style={{ ...skeletonBlock, height: 300 }} />
        <div style={{ ...skeletonBlock, height: 300 }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [todayUsage, setTodayUsage] = useState(0);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [weekUsage, setWeekUsage] = useState<DayUsage[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setErrorMessage(null);

      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Dashboard session error:", sessionError);
        if (isMounted) {
          setErrorMessage(
            "We could not load all dashboard information. Please refresh and try again.",
          );
          setLoading(false);
        }
        return;
      }

      if (!currentSession) {
        router.replace("/login");
        return;
      }

      if (!isMounted) return;
      setSession(currentSession);

      const userId = currentSession.user.id;
      const today = toDateKey(new Date());
      const lastSevenKeys = getLastSevenDateKeys();
      const rangeStart = lastSevenKeys[0];

      let hasPartialError = false;

      const [countResult, wordsResult, todayResult, recentResult, weekResult] =
        await Promise.all([
          supabase
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("documents")
            .select("humanized_text")
            .eq("user_id", userId),
          supabase
            .from("usage")
            .select("count")
            .eq("user_id", userId)
            .eq("date", today)
            .maybeSingle(),
          supabase
            .from("documents")
            .select("id, title, original_text, humanized_text, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("usage")
            .select("date, count")
            .eq("user_id", userId)
            .gte("date", rangeStart)
            .lte("date", today),
        ]);

      if (countResult.error) {
        console.error("Dashboard document count error:", countResult.error);
        hasPartialError = true;
      } else if (isMounted) {
        setDocumentsCount(countResult.count || 0);
      }

      if (wordsResult.error) {
        console.error("Dashboard words error:", wordsResult.error);
        hasPartialError = true;
      } else if (isMounted) {
        const words = (wordsResult.data || []).reduce(
          (sum, doc: { humanized_text: string | null }) =>
            sum + countWords(doc.humanized_text),
          0,
        );
        setTotalWords(words);
      }

      if (todayResult.error) {
        console.error("Dashboard today usage error:", todayResult.error);
        hasPartialError = true;
      } else if (isMounted) {
        setTodayUsage(todayResult.data?.count || 0);
      }

      if (recentResult.error) {
        console.error("Dashboard recent documents error:", recentResult.error);
        hasPartialError = true;
      } else if (isMounted) {
        setRecentDocuments((recentResult.data as RecentDocument[]) || []);
      }

      if (weekResult.error) {
        console.error("Dashboard week usage error:", weekResult.error);
        hasPartialError = true;
        if (isMounted) {
          setWeekUsage(
            lastSevenKeys.map((dateKey) => ({
              dateKey,
              label: formatChartLabel(dateKey),
              count: 0,
            })),
          );
        }
      } else if (isMounted) {
        const usageMap = new Map<string, number>();
        ((weekResult.data as UsageRecord[]) || []).forEach((row) => {
          usageMap.set(row.date, row.count || 0);
        });

        setWeekUsage(
          lastSevenKeys.map((dateKey) => ({
            dateKey,
            label: formatChartLabel(dateKey),
            count: usageMap.get(dateKey) || 0,
          })),
        );
      }

      if (hasPartialError && isMounted) {
        setErrorMessage(
          "We could not load all dashboard information. Please refresh and try again.",
        );
      }

      if (isMounted) setLoading(false);
    }

    loadDashboard();

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

  const remainingUses = Math.max(dailyLimit - todayUsage, 0);

  const statsColumns = useMemo(() => {
    if (isMobile) return "1fr";
    if (isTablet) return "1fr 1fr";
    return "repeat(4, 1fr)";
  }, [isMobile, isTablet]);

  const navigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main
      style={{
        ...pageShell,
        flexDirection: isMobile ? "column" : "row",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <style>{`
        .lexora-doc-row:hover {
          background: #faf5ff;
        }
        .lexora-doc-row:focus-visible,
        .lexora-dash-btn:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
        .lexora-dash-btn:hover {
          filter: brightness(1.05);
        }
      `}</style>

      <Sidebar
        isMobile={isMobile}
        onNavigate={navigate}
        activePath="/dashboard"
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

        {loading ? (
          <DashboardSkeleton isMobile={isMobile} />
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
                alignItems: isMobile ? "flex-start" : "center",
                gap: isMobile ? 14 : 20,
              }}
            >
              <div>
                <h1 style={{ ...pageTitle, fontSize: isMobile ? 28 : 32 }}>
                  Dashboard
                </h1>
                <p style={pageSubtitle}>
                  Track your writing activity, saved documents, and current plan usage.
                </p>
              </div>

              <div style={headerMeta}>
                <span style={planBadge}>{planName} Plan</span>
                <span style={usageBadge}>
                  {todayUsage} / {dailyLimit} uses today
                </span>
                {session ? (
                  <div style={avatar} aria-label="Account">
                    {getUserInitial(session.user)}
                  </div>
                ) : null}
              </div>
            </header>

            {errorMessage ? (
              <p style={errorBanner} role="alert">
                {errorMessage}
              </p>
            ) : null}

            <section
              style={{
                display: "grid",
                gridTemplateColumns: statsColumns,
                gap: isMobile ? 12 : 16,
                marginBottom: isMobile ? 20 : 24,
              }}
            >
              <StatCard
                icon={<FileText size={20} />}
                title="Total Documents"
                value={documentsCount}
                note="Your saved documents"
              />
              <StatCard
                icon={<TrendingUp size={20} />}
                title="Total Words Rewritten"
                value={totalWords.toLocaleString()}
                note="Across saved documents"
                tone="green"
              />
              <StatCard
                icon={<Zap size={20} />}
                title="Today's Humanizations"
                value={todayUsage}
                note="Today's usage"
                tone="orange"
              />
              <StatCard
                icon={<Clock size={20} />}
                title="Remaining Uses"
                value={remainingUses}
                note={`of ${dailyLimit} today`}
                tone="blue"
              />
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1.45fr 1fr",
                gap: isMobile ? 14 : 16,
                marginBottom: isMobile ? 14 : 16,
              }}
            >
              <UsageChart days={weekUsage} />
              <RecentDocumentsCard
                documents={recentDocuments}
                onOpenDocuments={() => navigate("/documents")}
                onOpenHumanizer={() => navigate("/")}
              />
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? 14 : 16,
              }}
            >
              <UsageProgress
                todayUsage={todayUsage}
                remainingUses={remainingUses}
              />

              <article style={panelCard}>
                <div style={cardHeader}>
                  <h2 style={cardTitle}>Plan information</h2>
                  <span style={planBadge}>{planName} Plan</span>
                </div>

                <ul style={planList}>
                  <li>{dailyLimit} humanizations per day</li>
                  <li>Free rewrite mode</li>
                  <li>Standard processing</li>
                  <li>Saved documents</li>
                </ul>

                <button
                  type="button"
                  className="lexora-dash-btn"
                  onClick={() => navigate("/pricing")}
                  style={primaryButton}
                >
                  <Crown size={16} />
                  Upgrade Plan
                </button>
              </article>
            </section>
          </div>
        )}
      </section>
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
  maxWidth: "520px",
};

const headerMeta = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const planBadge = {
  background: "#f5f3ff",
  color: "#5b21b6",
  padding: "6px 11px",
  borderRadius: "999px",
  fontWeight: 600 as const,
  fontSize: "12px",
};

const usageBadge = {
  color: "#475569",
  fontWeight: 600 as const,
  fontSize: "13px",
};

const avatar = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700 as const,
  fontSize: "14px",
};

const errorBanner = {
  margin: "0 0 18px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#b91c1c",
  fontSize: "14px",
  lineHeight: 1.5,
};

const statCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "18px",
  display: "flex",
  gap: "14px",
  alignItems: "center",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
  minWidth: 0,
};

const statIcon = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const statLabel = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 500 as const,
};

const statValue = {
  margin: "4px 0",
  fontSize: "26px",
  fontWeight: 700 as const,
  letterSpacing: "-0.02em",
  color: "#0f172a",
};

const statNote = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 600 as const,
};

const panelCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box" as const,
  width: "100%",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "16px",
};

const cardTitle = {
  margin: 0,
  fontSize: "17px",
  fontWeight: 700 as const,
  color: "#0f172a",
  letterSpacing: "-0.015em",
};

const cardMeta = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.4,
};

const rangeBadge = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#475569",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 600 as const,
  whiteSpace: "nowrap" as const,
};

const chartBox = {
  height: "260px",
  width: "100%",
  overflow: "hidden",
};

const emptyChart = {
  minHeight: "220px",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  padding: "24px",
  background: "#fafbfc",
  borderRadius: "12px",
  border: "1px dashed #e2e8f0",
};

const emptyDocs = {
  ...emptyChart,
  minHeight: "240px",
};

const emptyIcon = {
  width: "44px",
  height: "44px",
  borderRadius: "12px",
  background: "#f3e8ff",
  color: "#7c3aed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "12px",
};

const emptyTitle = {
  margin: "0 0 6px",
  fontWeight: 600 as const,
  color: "#0f172a",
  fontSize: "15px",
};

const emptyText = {
  margin: "0 0 16px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.55,
  maxWidth: "280px",
};

const docsList = {
  display: "grid",
  gap: "6px",
};

const docRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid transparent",
  background: "transparent",
  cursor: "pointer",
  width: "100%",
  minHeight: "56px",
  transition: "background 0.15s ease",
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

const docTitle = {
  margin: "0 0 4px",
  fontWeight: 600 as const,
  color: "#0f172a",
  fontSize: "14px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const mutedText = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.45,
};

const linkButton = {
  border: "none",
  background: "transparent",
  color: "#7c3aed",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "13px",
  padding: "8px 4px",
  minHeight: "40px",
};

const usageCardLayout = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap" as const,
};

const progressWrap = {
  flexShrink: 0,
};

const usagePrimary = {
  margin: "8px 0 6px",
  color: "#0f172a",
  fontSize: "15px",
  lineHeight: 1.5,
  fontWeight: 500 as const,
};

const resetText = {
  margin: "8px 0 0",
  color: "#7c3aed",
  fontWeight: 600 as const,
  fontSize: "13px",
};

const planList = {
  margin: "0 0 18px",
  paddingLeft: "18px",
  color: "#475569",
  fontSize: "14px",
  lineHeight: 1.8,
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

const skeletonBlock = {
  background: "linear-gradient(90deg, #eef2f7 0%, #f8fafc 50%, #eef2f7 100%)",
  borderRadius: "14px",
  border: "1px solid #e8eaf0",
};
