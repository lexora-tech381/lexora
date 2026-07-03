"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  LayoutDashboard,
  PenSquare,
  FileText,
  BarChart3,
  CreditCard,
  Settings,
  LifeBuoy,
  Crown,
  Activity,
  Clock,
  Zap,
  TrendingUp,
} from "lucide-react";

export default function UsagePage() {
  const router = useRouter();

  const [todayUsage, setTodayUsage] = useState(0);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [wordsProcessed, setWordsProcessed] = useState(0);

  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    const loadUsageData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      const today = new Date().toISOString().split("T")[0];

      const { data: usage } = await supabase
        .from("usage")
        .select("count")
        .eq("user_id", session.user.id)
        .eq("date", today)
        .maybeSingle();

      setTodayUsage(usage?.count || 0);

      const { data: documents } = await supabase
        .from("documents")
        .select("humanized_text")
        .eq("user_id", session.user.id);

      setDocumentsCount(documents?.length || 0);

      const totalWords =
        documents?.reduce((total, doc) => {
          const words =
            doc.humanized_text?.trim().split(/\s+/).length || 0;
          return total + words;
        }, 0) || 0;

      setWordsProcessed(totalWords);
    };

    loadUsageData();
  }, [router]);

  return (
    <main style={{ ...page, flexDirection: isMobile ? "column" : "row" }}>

      {/* ================= Desktop Sidebar ================= */}

      <aside
        style={{
          ...sidebar,
          display: isMobile ? "none" : "flex",
        }}
      >
        <h2 style={logo}>Lexora</h2>

        <nav style={nav}>
          <button
            onClick={() => router.push("/dashboard")}
            style={navItem}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => router.push("/")}
            style={navItem}
          >
            <PenSquare size={18} />
            Humanizer
          </button>

          <button
            onClick={() => router.push("/documents")}
            style={navItem}
          >
            <FileText size={18} />
            Documents
          </button>

          <button style={activeNav}>
            <BarChart3 size={18} />
            Usage
          </button>

          <button
            onClick={() => router.push("/pricing")}
            style={navItem}
          >
            <CreditCard size={18} />
            Pricing
          </button>

          <button
            onClick={() => router.push("/settings")}
            style={navItem}
          >
            <Settings size={18} />
            Settings
          </button>

          <button
            onClick={() => router.push("/support")}
            style={navItem}
          >
            <LifeBuoy size={18} />
            Support
          </button>
        </nav>

        <div style={upgradeBox}>
          <Crown size={22} color="#7c3aed" />

          <h3>Upgrade to Pro</h3>

          <p style={mutedSmall}>
            Unlock unlimited usage and premium
            humanization modes.
          </p>

          <button
            onClick={() => router.push("/pricing")}
            style={upgradeButton}
          >
            Upgrade Now →
          </button>
        </div>
      </aside>

      {/* ================= Main Content ================= */}

      <section
        style={{
          flex: 1,
          width: "100%",
          maxWidth: isMobile ? "100%" : "1250px",
          margin: isMobile ? "0" : "0 auto",
          padding: isMobile
            ? "88px 16px 24px"
            : "50px 36px",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >

        {/* ================= Mobile Header ================= */}

        {isMobile && (
          <header style={mobileHeader}>
            <button
              onClick={() =>
                setMenuOpen(!menuOpen)
              }
              style={menuButton}
            >
              ☰
            </button>

            <div style={brandWrap}>
              <div style={brandIcon}>
                <div style={brandMark} />
              </div>

              <h2 style={headerLogo}>
                Lexora
              </h2>
            </div>

            <div style={headerActions}>
              {user ? (
                <div style={avatar}>
                  {(
                    user.user_metadata
                      ?.full_name?.[0] ||
                    user.email?.[0] ||
                    "U"
                  ).toUpperCase()}
                </div>
              ) : (
                <>
                  <button
                    onClick={() =>
                      router.push("/login")
                    }
                    style={headerSmallButton}
                  >
                    Login
                  </button>

                  <button
                    onClick={() =>
                      router.push("/signup")
                    }
                    style={headerPurpleButton}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </header>
        )}

{isMobile && menuOpen && (
  <div style={mobileMenu}>
    <button onClick={() => { setMenuOpen(false); router.push("/dashboard"); }} style={mobileMenuItem}>Dashboard</button>
    <button onClick={() => { setMenuOpen(false); router.push("/"); }} style={mobileMenuItem}>Humanizer</button>
    <button onClick={() => { setMenuOpen(false); router.push("/documents"); }} style={mobileMenuItem}>Documents</button>
    <button onClick={() => { setMenuOpen(false); router.push("/usage"); }} style={mobileMenuItem}>Usage</button>
    <button onClick={() => { setMenuOpen(false); router.push("/pricing"); }} style={mobileMenuItem}>Pricing</button>
    <button onClick={() => { setMenuOpen(false); router.push("/settings"); }} style={mobileMenuItem}>Settings</button>
    <button onClick={() => { setMenuOpen(false); router.push("/support"); }} style={mobileMenuItem}>Support</button>
  </div>
)}
                <header
          style={{
            ...topbar,
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? "14px" : "0",
          }}
        >
          <div>
            <h1
              style={{
                ...title,
                fontSize: isMobile ? "34px" : "38px",
              }}
            >
              Usage Analytics
            </h1>

            <p style={subtitle}>
              Track your humanization activity,
              limits and plan usage.
            </p>
          </div>

          {!isMobile && (
            <button
              onClick={() => router.push("/pricing")}
              style={upgradeTopButton}
            >
              Upgrade Plan
            </button>
          )}
        </header>

        <section
          style={{
            ...statsGrid,
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(4,1fr)",
          }}
        >
          <Stat
            icon={<Activity />}
            label="Daily Uses"
            value={`${todayUsage} / 10`}
            note={`${Math.round(
              (todayUsage / 10) * 100
            )}% used today`}
          />

          <Stat
            icon={<TrendingUp />}
            label="Saved Documents"
            value={documentsCount}
            note="Total documents"
            green
          />

          <Stat
            icon={<Zap />}
            label="Monthly Uses"
            value="156"
            note="+34 this month"
            orange
          />

          <Stat
            icon={<FileText />}
            label="Words Processed"
            value={wordsProcessed}
            note="All time"
            blue
          />
        </section>

        <section
          style={{
            ...mainGrid,
            gridTemplateColumns: isMobile
              ? "1fr"
              : "1.5fr 1fr",
          }}
        >
          <div style={chartCard}>
            <div style={cardHeader}>
              <h2 style={{ margin: 0 }}>
                Humanizations This Week
              </h2>

              <button style={filterButton}>
                7 Days ⌄
              </button>
            </div>

            <div
              style={{
                ...barChart,
                height: isMobile
                  ? "220px"
                  : "300px",
                padding: isMobile
                  ? "16px 10px"
                  : "24px",
              }}
            >
              {[
                ["Mon", 30],
                ["Tue", 50],
                ["Wed", 70],
                ["Thu", 40],
                ["Fri", 80],
                ["Sat", 60],
                ["Sun", 90],
              ].map(([day, value]) => (
                <div
                  key={day}
                  style={barItem}
                >
                  <div
                    style={{
                      ...bar,
                      height: `${value}%`,
                      width: isMobile
                        ? "22px"
                        : "34px",
                    }}
                  />

                  <span style={mutedSmall}>
                    {day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={planCard}>
            <h2>Current Plan</h2>

            <span style={planBadge}>
              Free Plan
            </span>

            <div style={planList}>
              <p>✓ 10 humanizations per day</p>
              <p>✓ Free mode access</p>
              <p>✓ Standard speed</p>
              <p>✓ Save documents</p>
            </div>

            <button
              onClick={() =>
                router.push("/pricing")
              }
              style={upgradeButton}
            >
              Upgrade to Pro →
            </button>
          </div>
        </section>

        <section
          style={{
            ...bottomGrid,
            gridTemplateColumns: isMobile
              ? "1fr"
              : "1fr 1fr",
          }}
        >
          <div style={progressCard}>
            <div style={cardHeader}>
              <h2 style={{ margin: 0 }}>
                Daily Limit
              </h2>

              <Clock
                size={22}
                color="#7c3aed"
              />
            </div>

            <div style={progressTrack}>
              <div
                style={{
                  ...progressFill,
                  width: `${Math.min(
                    (todayUsage / 10) * 100,
                    100
                  )}%`,
                }}
              />
            </div>

            <h3>
              {todayUsage} of 10 uses today
            </h3>

            <p style={mutedSmall}>
              Your limit resets every midnight.
            </p>
          </div>

          <div style={breakdownCard}>
            <h2>Usage Breakdown</h2>

            {[
              [
                "Natural Mode",
                "42%",
              ],
              [
                "Academic Mode",
                "28%",
              ],
              [
                "Professional Mode",
                "20%",
              ],
              [
                "Creative Mode",
                "10%",
              ],
            ].map(([name, value]) => (
              <div
                key={name}
                style={breakdownRow}
              >
                <span>{name}</span>

                <b>{value}</b>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
  green,
  orange,
  blue,
}: any) {
  return (
    <div style={statCard}>
      <div
        style={{
          ...statIcon,
          color: green
            ? "#16a34a"
            : orange
            ? "#f59e0b"
            : blue
            ? "#2563eb"
            : "#7c3aed",

          background: green
            ? "#dcfce7"
            : orange
            ? "#fef3c7"
            : blue
            ? "#dbeafe"
            : "#f3e8ff",
        }}
      >
        {icon}
      </div>

      <div>
        <p style={mutedSmall}>
          {label}
        </p>

        <h2
          style={{
            margin: "6px 0",
          }}
        >
          {value}
        </h2>

        <p
          style={{
            margin: 0,
            fontWeight: "bold",
            color: green
              ? "#16a34a"
              : orange
              ? "#f59e0b"
              : "#7c3aed",
          }}
        >
          {note}
        </p>
      </div>
    </div>
  );
}
const page = {
  minHeight: "100vh",
  display: "flex",
  background: "#f8fafc",
  color: "#0f172a",
  fontFamily: "Arial, sans-serif",
};

const sidebar = {
  width: "250px",
  minWidth: "250px",
  background: "#fff",
  borderRight: "1px solid #e5e7eb",
  padding: "28px 20px",
  height: "100vh",
  position: "sticky" as const,
  top: 0,
  display: "flex",
  flexDirection: "column" as const,
};

const logo = { fontSize: "26px", fontWeight: 800, marginBottom: "35px" };
const nav = { display: "grid", gap: "10px" };

const activeNav = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "none",
  background: "#f3e8ff",
  color: "#7c3aed",
  fontWeight: "bold" as const,
  cursor: "pointer",
  fontSize: "15px",
};

const navItem = { ...activeNav, background: "transparent", color: "#334155" };

const upgradeBox = {
  marginTop: "auto",
  background: "#faf5ff",
  border: "1px solid #eadcff",
  borderRadius: "16px",
  padding: "20px",
};

const upgradeButton = {
  padding: "12px 22px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: "bold" as const,
  cursor: "pointer",
  width: "100%",
};

const mobileHeader = {
  display: "flex",
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  zIndex: 9999,
  background: "#f8fafc",
  padding: "12px 14px",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
};

const menuButton = {
  width: "38px",
  height: "38px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  fontSize: "20px",
  cursor: "pointer",
  flexShrink: 0,
};

const brandWrap = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
};

const brandIcon = {
  width: "38px",
  height: "38px",
  background: "linear-gradient(135deg,#5b21b6,#c084fc)",
  clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const brandMark = {
  width: "15px",
  height: "21px",
  borderLeft: "6px solid white",
  borderBottom: "6px solid white",
  borderBottomLeftRadius: "7px",
};

const headerLogo = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 800,
  color: "#0f172a",
};

const headerActions = {
  marginLeft: "auto",
  display: "flex",
  gap: "6px",
};

const headerSmallButton = {
  padding: "8px 10px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#111827",
  fontWeight: "bold" as const,
  fontSize: "12px",
  cursor: "pointer",
};

const headerPurpleButton = {
  ...headerSmallButton,
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  border: "none",
};

const mobileMenu = {
  position: "fixed" as const,
  top: "68px",
  left: "14px",
  right: "14px",
  zIndex: 99999,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "14px",
  display: "grid",
  gap: "10px",
  boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
};

const mobileMenuItem = {
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  background: "#f8fafc",
  color: "#0f172a",
  fontWeight: "bold" as const,
  textAlign: "left" as const,
  cursor: "pointer",
};

const avatar = {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  background: "#7c3aed",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold" as const,
  flexShrink: 0,
};

const topbar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "28px",
};

const title = { fontSize: "38px", margin: 0 };

const subtitle = {
  color: "#64748b",
  marginTop: "8px",
  lineHeight: "1.5",
};

const upgradeTopButton = {
  padding: "12px 20px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "20px",
  marginBottom: "24px",
};

const statCard = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "24px",
  display: "flex",
  gap: "18px",
  alignItems: "center",
  boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
};

const statIcon = {
  width: "54px",
  height: "54px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1.5fr 1fr",
  gap: "24px",
  marginBottom: "24px",
};

const chartCard = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
  overflow: "hidden",
};

const planCard = { ...chartCard };

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "18px",
  gap: "10px",
};

const filterButton = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  background: "#fff",
  whiteSpace: "nowrap" as const,
};

const barChart = {
  height: "300px",
  display: "flex",
  alignItems: "end",
  justifyContent: "space-around",
  background: "linear-gradient(180deg,#fff,#faf5ff)",
  borderRadius: "16px",
  padding: "24px",
  overflow: "hidden",
};

const barItem = {
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "end",
  gap: "10px",
};

const bar = {
  width: "34px",
  borderRadius: "999px 999px 8px 8px",
  background: "linear-gradient(180deg,#a855f7,#7c3aed)",
};

const planBadge = {
  display: "inline-block",
  background: "#f3e8ff",
  color: "#7c3aed",
  padding: "9px 14px",
  borderRadius: "999px",
  fontWeight: "bold" as const,
  marginBottom: "18px",
};

const planList = {
  color: "#334155",
  lineHeight: "1.9",
  marginBottom: "24px",
};

const bottomGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
};

const progressCard = { ...chartCard };
const breakdownCard = { ...chartCard };

const progressTrack = {
  height: "14px",
  background: "#e5e7eb",
  borderRadius: "999px",
  margin: "22px 0",
};

const progressFill = {
  height: "14px",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  borderRadius: "999px",
};

const breakdownRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "16px 0",
  borderBottom: "1px solid #e5e7eb",
};

const mutedSmall = {
  color: "#64748b",
  fontSize: "14px",
  margin: "4px 0",
};