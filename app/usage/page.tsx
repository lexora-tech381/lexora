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
useEffect(() => {
  const loadUsageData = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

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
        const words = doc.humanized_text?.trim().split(/\s+/).length || 0;
        return total + words;
      }, 0) || 0;

    setWordsProcessed(totalWords);
  };

  loadUsageData();
}, [router]);
  return (
    <main style={page}>
      <aside style={sidebar}>
        <h2 style={logo}>Lexora</h2>

        <nav style={nav}>
  <button onClick={() => router.push("/dashboard")} style={navItem}><LayoutDashboard size={18} />Dashboard</button>
  <button onClick={() => router.push("/")} style={navItem}><PenSquare size={18} />Humanizer</button>
  <button onClick={() => router.push("/documents")} style={navItem}><FileText size={18} />Documents</button>
  <button style={activeNav}><BarChart3 size={18} />Usage</button>
  <button onClick={() => router.push("/pricing")} style={navItem}><CreditCard size={18} />Pricing</button>
  <button onClick={() => router.push("/settings")} style={navItem}><Settings size={18} />Settings</button>
  <button onClick={() => router.push("/support")} style={navItem}><LifeBuoy size={18} />Support</button>
</nav>

        <div style={upgradeBox}>
          <Crown size={22} color="#7c3aed" />
          <h3>Upgrade to Pro</h3>
          <p style={mutedSmall}>Unlock unlimited usage and premium humanization modes.</p>
          <button onClick={() => router.push("/pricing")} style={upgradeButton}>Upgrade Now →</button>
        </div>
      </aside>

      <section style={content}>
        <header style={topbar}>
          <div>
            <h1 style={title}>Usage Analytics</h1>
            <p style={subtitle}>Track your humanization activity, limits, and plan usage.</p>
          </div>

          <button onClick={() => (window.location.href = "/pricing")} style={upgradeTopButton}>
            Upgrade Plan
          </button>
        </header>

        <section style={statsGrid}>
        <Stat
  icon={<Activity />}
  label="Daily Uses"
  value={`${todayUsage} / 10`}
  note={`${Math.round((todayUsage / 10) * 100)}% used today`}
/>
<Stat
  icon={<TrendingUp />}
  label="Saved Documents"
  value={documentsCount}
  note="Total documents"
  green
/>
          <Stat icon={<Zap />} label="Monthly Uses" value="156" note="+34 this month" orange />
          <Stat
  icon={<FileText />}
  label="Words Processed"
  value={wordsProcessed}
  note="All time"
  blue
/>
        </section>

        <section style={mainGrid}>
          <div style={chartCard}>
            <div style={cardHeader}>
              <h2>Humanizations This Week</h2>
              <button style={filterButton}>7 Days⌄</button>
            </div>

            <div style={barChart}>
              {[
                ["Mon", 30],
                ["Tue", 50],
                ["Wed", 70],
                ["Thu", 40],
                ["Fri", 80],
                ["Sat", 60],
                ["Sun", 90],
              ].map(([day, height]) => (
                <div key={day} style={barItem}>
                  <div style={{ ...bar, height: `${height}%` }}></div>
                  <span style={mutedSmall}>{day}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={planCard}>
            <h2>Current Plan</h2>
            <span style={planBadge}>Free Plan</span>

            <div style={planList}>
              <p>✓ 10 humanizations per day</p>
              <p>✓ Free mode access</p>
              <p>✓ Standard processing speed</p>
              <p>✓ Basic document saving</p>
            </div>

            <button onClick={() => (window.location.href = "/pricing")} style={upgradeButton}>
              Upgrade to Pro →
            </button>
          </div>
        </section>

        <section style={bottomGrid}>
          <div style={progressCard}>
            <div style={cardHeader}>
              <h2>Daily Limit Progress</h2>
              <Clock size={22} color="#7c3aed" />
            </div>

            <div style={progressTrack}>
            <div
  style={{
    ...progressFill,
    width: `${(todayUsage / 10) * 100}%`,
  }}
></div>
            </div>

            <h3>{todayUsage} of 10 uses used today</h3>
            <p style={mutedSmall}>
  Your daily limit resets at midnight.
</p>
          </div>

          <div style={breakdownCard}>
            <h2>Usage Breakdown</h2>

            {[
              ["Natural Mode", "42%"],
              ["Academic Mode", "28%"],
              ["Professional Mode", "20%"],
              ["Creative Mode", "10%"],
            ].map(([label, value]) => (
              <div key={label} style={breakdownRow}>
                <span>{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Stat({ icon, label, value, note, green, orange, blue }: any) {
  return (
    <div style={statCard}>
      <div style={{
        ...statIcon,
        color: green ? "#16a34a" : orange ? "#f59e0b" : blue ? "#2563eb" : "#7c3aed",
        background: green ? "#dcfce7" : orange ? "#fef3c7" : blue ? "#dbeafe" : "#f3e8ff",
      }}>
        {icon}
      </div>
      <div>
        <p style={mutedSmall}>{label}</p>
        <h2>{value}</h2>
        <p style={{ color: green ? "#16a34a" : orange ? "#f59e0b" : "#7c3aed", fontWeight: "bold" }}>{note}</p>
      </div>
    </div>
  );
}

const page = { minHeight: "100vh", display: "flex", background: "#f8fafc", color: "#0f172a", fontFamily: "Arial, sans-serif" };
const sidebar = { width: "250px", background: "#fff", borderRight: "1px solid #e5e7eb", padding: "28px 20px", height: "100vh", position: "sticky" as const, top: 0, display: "flex", flexDirection: "column" as const };
const logo = { fontSize: "26px", fontWeight: 800, marginBottom: "35px" };
const nav = { display: "grid", gap: "10px" };
const activeNav = { display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderRadius: "12px", border: "none", background: "#f3e8ff", color: "#7c3aed", fontWeight: "bold" as const, cursor: "pointer", fontSize: "15px" };
const navItem = { ...activeNav, background: "transparent", color: "#334155" };
const upgradeBox = { marginTop: "auto", background: "#faf5ff", border: "1px solid #eadcff", borderRadius: "16px", padding: "20px" };
const upgradeButton = { padding: "12px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "white", fontWeight: "bold" as const, cursor: "pointer", width: "100%" };
const content = { flex: 1, padding: "50px 36px", maxWidth: "1250px", margin: "0 auto" };
const topbar = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" };
const title = { fontSize: "38px", margin: 0 };
const subtitle = { color: "#64748b", marginTop: "8px" };
const upgradeTopButton = { padding: "12px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "white", fontWeight: "bold" as const, cursor: "pointer" };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px" };
const statCard = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "24px", display: "flex", gap: "18px", alignItems: "center", boxShadow: "0 10px 25px rgba(15,23,42,0.05)" };
const statIcon = { width: "54px", height: "54px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" };
const mainGrid = { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", marginBottom: "24px" };
const chartCard = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "20px", padding: "24px", boxShadow: "0 12px 30px rgba(15,23,42,0.05)" };
const planCard = { ...chartCard };
const cardHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" };
const filterButton = { padding: "10px 14px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fff" };
const barChart = { height: "300px", display: "flex", alignItems: "end", justifyContent: "space-around", background: "linear-gradient(180deg,#fff,#faf5ff)", borderRadius: "16px", padding: "24px" };
const barItem = { height: "100%", display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "end", gap: "10px" };
const bar = { width: "34px", borderRadius: "999px 999px 8px 8px", background: "linear-gradient(180deg,#a855f7,#7c3aed)" };
const planBadge = { display: "inline-block", background: "#f3e8ff", color: "#7c3aed", padding: "9px 14px", borderRadius: "999px", fontWeight: "bold" as const, marginBottom: "18px" };
const planList = { color: "#334155", lineHeight: "1.9", marginBottom: "24px" };
const bottomGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" };
const progressCard = { ...chartCard };
const breakdownCard = { ...chartCard };
const progressTrack = { height: "14px", background: "#e5e7eb", borderRadius: "999px", margin: "22px 0" };
const progressFill = { height: "14px", width: "80%", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", borderRadius: "999px" };
const breakdownRow = { display: "flex", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #e5e7eb" };
const mutedSmall = { color: "#64748b", fontSize: "14px", margin: "4px 0" };