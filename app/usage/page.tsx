"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  Activity,
  AlertCircle,
  Clock,
  FileText,
  TrendingUp,
  Zap,
} from "lucide-react";

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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
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
      <div
        style={{
          ...statIcon,
          color: colors.color,
          background: colors.background,
        }}
      >
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

function UsageChart({
  days,
  showDaySummary,
}: {
  days: DayUsage[];
  showDaySummary: boolean;
}) {
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
      (days.length === 1
        ? chartWidth / 2
        : (index / (days.length - 1)) * chartWidth);
    const y = paddingY + chartHeight - (day.count / maxValue) * chartHeight;
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
          <h2 style={cardTitle}>Humanizations this week</h2>
          <p style={cardMeta}>
            {formatNumber(total)} total ·{" "}
            {formatChartLabel(days[0]?.dateKey || "")} –{" "}
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
                  fill="#ffffff"
                  stroke="#7c3aed"
                  strokeWidth="3"
                />
                <text
                  x={point.x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#64748b"
                >
                  {point.label}
                </text>
                <title>
                  {point.label}: {point.count} humanization
                  {point.count === 1 ? "" : "s"}
                </title>
              </g>
            ))}
          </svg>
        </div>
      )}

      {total > 0 && showDaySummary ? (
        <div style={daySummary} aria-label="Daily totals">
          {days.map((day) => (
            <div key={day.dateKey} style={daySummaryItem}>
              <span style={daySummaryLabel}>{day.label}</span>
              <strong style={daySummaryValue}>{day.count}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function UsagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [todayUsage, setTodayUsage] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [wordsProcessed, setWordsProcessed] = useState(0);
  const [weekUsage, setWeekUsage] = useState<DayUsage[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1100);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUsage() {
      setErrorMessage(null);

      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Usage session error:", sessionError);
        if (isMounted) {
          setErrorMessage(
            "We could not load your usage information. Please refresh and try again.",
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

      const [todayResult, docsResult, weekResult] = await Promise.all([
        supabase
          .from("usage")
          .select("count")
          .eq("user_id", userId)
          .eq("date", today)
          .maybeSingle(),
        supabase
          .from("documents")
          .select("humanized_text")
          .eq("user_id", userId),
        supabase
          .from("usage")
          .select("date, count")
          .eq("user_id", userId)
          .gte("date", rangeStart)
          .lte("date", today),
      ]);

      if (todayResult.error) {
        console.error("Usage today error:", todayResult.error);
        hasPartialError = true;
      } else if (isMounted) {
        setTodayUsage(todayResult.data?.count || 0);
      }

      if (docsResult.error) {
        console.error("Usage documents error:", docsResult.error);
        hasPartialError = true;
      } else if (isMounted) {
        const docs = docsResult.data || [];
        setDocumentsCount(docs.length);
        setWordsProcessed(
          docs.reduce(
            (sum, doc: { humanized_text: string | null }) =>
              sum + countWords(doc.humanized_text),
            0,
          ),
        );
      }

      if (weekResult.error) {
        console.error("Usage week error:", weekResult.error);
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
          "We could not load all usage information. Please refresh and try again.",
        );
      }

      if (isMounted) setLoading(false);
    }

    loadUsage();

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

  const weekTotal = useMemo(
    () => weekUsage.reduce((sum, day) => sum + day.count, 0),
    [weekUsage],
  );

  const remainingUses = Math.max(dailyLimit - todayUsage, 0);
  const usagePercent = Math.min(
    Math.round((todayUsage / dailyLimit) * 100),
    100,
  );

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

  if (loading || !session) {
    return (
      <main
        style={{
          ...pageShell,
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        }}
      >
        <div style={loadingCard} role="status" aria-live="polite">
          Loading usage…
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        ...pageShell,
        flexDirection: isMobile ? "column" : "row",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <style>{`
        .lexora-usage-btn:hover {
          filter: brightness(1.04);
        }
        .lexora-usage-link:hover {
          color: #5b21b6;
        }
        .lexora-usage-btn:focus-visible,
        .lexora-usage-link:focus-visible {
          outline: 2px solid #8b5cf6;
          outline-offset: 2px;
        }
      `}</style>

      <Sidebar
        isMobile={isMobile}
        onNavigate={navigate}
        activePath="/usage"
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
          activePath="/usage"
        />

        <div
          style={{
            ...contentPad,
            padding: isMobile ? "80px 16px 32px" : "88px 28px 40px",
          }}
        >
          <header
            style={{
              ...hero,
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
            }}
          >
            <div>
              <h1 style={{ ...title, fontSize: isMobile ? "30px" : "36px" }}>
                Usage
              </h1>
              <p style={subtitle}>
                Track your real humanization activity, daily limit, and saved
                document totals.
              </p>
            </div>

            <Link
              href="/pricing"
              className="lexora-usage-btn"
              style={upgradeTopButton}
            >
              View plans
            </Link>
          </header>

          {errorMessage ? (
            <div style={errorBox} role="alert">
              <AlertCircle size={16} aria-hidden />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <section
            style={{
              display: "grid",
              gridTemplateColumns: statsColumns,
              gap: isMobile ? "12px" : "16px",
              marginBottom: "20px",
            }}
            aria-label="Usage summary"
          >
            <StatCard
              icon={<Activity size={20} aria-hidden />}
              title="Today"
              value={`${todayUsage} / ${dailyLimit}`}
              note={`${usagePercent}% of daily limit`}
              tone="purple"
            />
            <StatCard
              icon={<TrendingUp size={20} aria-hidden />}
              title="This week"
              value={formatNumber(weekTotal)}
              note="Humanizations in the last 7 days"
              tone="orange"
            />
            <StatCard
              icon={<FileText size={20} aria-hidden />}
              title="Saved documents"
              value={formatNumber(documentsCount)}
              note="Documents in your workspace"
              tone="green"
            />
            <StatCard
              icon={<Zap size={20} aria-hidden />}
              title="Words in saved docs"
              value={formatNumber(wordsProcessed)}
              note="Based on saved rewritten text"
              tone="blue"
            />
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.55fr 1fr",
              gap: "16px",
              marginBottom: "16px",
              alignItems: "start",
            }}
          >
            <UsageChart days={weekUsage} showDaySummary={!isMobile} />

            <article style={panelCard}>
              <div style={cardHeader}>
                <div>
                  <h2 style={cardTitle}>Current plan</h2>
                  <p style={cardMeta}>
                    Plan status will update once billing verification is
                    connected.
                  </p>
                </div>
                <span style={planBadge}>Free</span>
              </div>

              <ul style={planList}>
                <li>{dailyLimit} humanizations per day</li>
                <li>Save documents to your workspace</li>
                <li>Standard processing</li>
                <li>Usage tracking for your account</li>
              </ul>

              <Link
                href="/pricing"
                className="lexora-usage-btn"
                style={primaryButton}
              >
                Explore paid plans
              </Link>
            </article>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "16px",
            }}
          >
            <article style={panelCard}>
              <div style={cardHeader}>
                <div>
                  <h2 style={cardTitle}>Daily limit</h2>
                  <p style={cardMeta}>
                    Resets each day based on your account usage records.
                  </p>
                </div>
                <Clock size={20} color="#7c3aed" aria-hidden />
              </div>

              <div
                style={progressTrack}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={dailyLimit}
                aria-valuenow={todayUsage}
                aria-label="Daily humanization usage"
              >
                <div
                  style={{
                    ...progressFill,
                    width: `${usagePercent}%`,
                  }}
                />
              </div>

              <p style={progressPrimary}>
                {todayUsage} of {dailyLimit} uses today
              </p>
              <p style={progressNote}>
                {remainingUses === 0
                  ? "You have reached today’s Free plan limit."
                  : `${remainingUses} remaining today.`}
              </p>
            </article>

            <article style={panelCard}>
              <div style={cardHeader}>
                <div>
                  <h2 style={cardTitle}>What this page shows</h2>
                  <p style={cardMeta}>
                    Only information stored for your account is displayed.
                  </p>
                </div>
              </div>

              <ul style={infoList}>
                <li>
                  Daily and weekly humanization counts from your usage records
                </li>
                <li>Saved document totals from your workspace</li>
                <li>
                  Word counts calculated from saved rewritten text only
                </li>
                <li>
                  Mode-by-mode breakdowns are not shown because mode usage is
                  not stored separately yet
                </li>
              </ul>

              <p style={footerHint}>
                Need a higher limit?{" "}
                <Link
                  href="/pricing"
                  className="lexora-usage-link"
                  style={inlineLink}
                >
                  Compare plans
                </Link>
                .
              </p>
            </article>
          </section>
        </div>
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

const loadingCard = {
  width: "100%",
  maxWidth: "420px",
  margin: "40px 16px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "28px 24px",
  textAlign: "center" as const,
  color: "#64748b",
  fontSize: "14px",
  boxShadow: "0 12px 36px rgba(15, 23, 42, 0.06)",
};

const contentShell = {
  flex: 1,
  minWidth: 0,
  width: "100%",
};

const contentPad = {
  width: "100%",
  maxWidth: "1120px",
  margin: "0 auto",
  boxSizing: "border-box" as const,
};

const hero = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "22px",
};

const title = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontWeight: 700 as const,
  letterSpacing: "-0.03em",
  lineHeight: 1.15,
};

const subtitle = {
  margin: 0,
  color: "#64748b",
  fontSize: "16px",
  lineHeight: 1.6,
  maxWidth: "560px",
};

const upgradeTopButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "44px",
  padding: "10px 16px",
  borderRadius: "12px",
  border: "1px solid #ddd6fe",
  background: "#ffffff",
  color: "#7c3aed",
  fontWeight: 700 as const,
  fontSize: "14px",
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
  fontFamily: "inherit",
};

const errorBox = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  marginBottom: "16px",
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
  alignItems: "flex-start",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  boxSizing: "border-box" as const,
};

const statIcon = {
  width: "42px",
  height: "42px",
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
  fontWeight: 600 as const,
};

const statValue = {
  margin: "4px 0",
  fontSize: "28px",
  fontWeight: 700 as const,
  color: "#0f172a",
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
};

const statNote = {
  margin: 0,
  fontSize: "13px",
  fontWeight: 600 as const,
  lineHeight: 1.4,
};

const panelCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "20px 18px",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box" as const,
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
  fontSize: "18px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const cardMeta = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.5,
};

const rangeBadge = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#faf5ff",
  border: "1px solid #e9d5ff",
  color: "#6d28d9",
  fontSize: "12px",
  fontWeight: 700 as const,
  whiteSpace: "nowrap" as const,
};

const planBadge = {
  ...rangeBadge,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#475569",
};

const emptyChart = {
  border: "1px dashed #e2e8f0",
  borderRadius: "14px",
  padding: "36px 18px",
  textAlign: "center" as const,
  background: "#fafbfc",
};

const emptyTitle = {
  margin: "0 0 6px",
  fontSize: "16px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const emptyText = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const chartBox = {
  width: "100%",
  height: "260px",
  overflow: "hidden",
};

const daySummary = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "8px",
  marginTop: "14px",
};

const daySummaryItem = {
  background: "#f8fafc",
  border: "1px solid #eef2f7",
  borderRadius: "10px",
  padding: "8px 6px",
  textAlign: "center" as const,
};

const daySummaryLabel = {
  display: "block",
  color: "#94a3b8",
  fontSize: "11px",
  marginBottom: "4px",
};

const daySummaryValue = {
  color: "#0f172a",
  fontSize: "14px",
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
  width: "100%",
  minHeight: "48px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  color: "#ffffff",
  fontWeight: 700 as const,
  fontSize: "14px",
  textDecoration: "none",
  fontFamily: "inherit",
  boxSizing: "border-box" as const,
};

const progressTrack = {
  width: "100%",
  height: "12px",
  borderRadius: "999px",
  background: "#f1f5f9",
  overflow: "hidden",
  marginBottom: "14px",
};

const progressFill = {
  height: "100%",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  transition: "width 0.2s ease",
};

const progressPrimary = {
  margin: "0 0 6px",
  fontSize: "18px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const progressNote = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const infoList = {
  margin: "0 0 16px",
  paddingLeft: "18px",
  color: "#475569",
  fontSize: "14px",
  lineHeight: 1.75,
};

const footerHint = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
};

const inlineLink = {
  color: "#7c3aed",
  textDecoration: "none",
  fontWeight: 600 as const,
};
