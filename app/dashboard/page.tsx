"use client";
import { useRouter } from "next/navigation";

import {
  LayoutDashboard,
  PenSquare,
  FileText,
  BarChart3,
  CreditCard,
  Settings,
  LifeBuoy,
  Bell,
  Crown,
  Clock,
  Zap,
  TrendingUp,
  MoreVertical,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <main style={page}>
      <aside style={sidebar}>
        <h2 style={logo}>Lexora</h2>

        <nav style={nav}>
          <button style={activeNav}><LayoutDashboard size={18} />Dashboard</button>
          <button onClick={() => router.push("/")} style={navItem}><PenSquare size={18} />Humanizer</button>
          <button onClick={() => router.push("/documents")} style={navItem}><FileText size={18} />Documents</button>
          <button onClick={() => (window.location.href = "/usage")} style={navItem}><BarChart3 size={18} />Usage</button>
          <button onClick={() => (window.location.href = "/pricing")} style={navItem}><CreditCard size={18} />Pricing</button>
          <button onClick={() => (window.location.href = "/settings")} style={navItem}><Settings size={18} />Settings</button>
          <button onClick={() => (window.location.href = "/support")} style={navItem}><LifeBuoy size={18} />Support</button>
        </nav>

        <div style={upgradeBox}>
          <Crown size={22} color="#7c3aed" />
          <h3>Upgrade to Pro</h3>
          <p style={mutedSmall}>Unlock unlimited words, premium modes and faster processing.</p>
          <button onClick={() => (window.location.href = "/pricing")} style={upgradeButton}>
            Upgrade Now →
          </button>
        </div>
      </aside>

      <section style={content}>
        <header style={topbar}>
          <div>
            <h1 style={title}>Dashboard</h1>
            <p style={subtitle}>Welcome back! Here's what's happening with your content.</p>
          </div>

          <div style={topActions}>
            <span style={planBadge}>★ Free Plan</span>
            <span style={usageBadge}>8 / 10 uses</span>
            <Bell size={22} />
            <div style={avatar}>C</div>
          </div>
        </header>

        <section style={statsGrid}>
          <Card icon={<FileText />} title="Total Documents" value="12" note="+3 this week" />
          <Card icon={<TrendingUp />} title="Total Words" value="4,250" note="+1,250 this week" green />
          <Card icon={<Zap />} title="Humanizations" value="28" note="+6 this week" orange />
          <Card icon={<Clock />} title="Remaining Uses" value="2 / 10" note="Resets in 12h 46m" blue />
        </section>

        <section style={mainGrid}>
          <div style={chartCard}>
            <div style={cardHeader}>
              <h2>Humanizations Over Time</h2>
              <button style={filterButton}>7 Days⌄</button>
            </div>

            <div style={chartBox}>
  <svg width="100%" height="300" viewBox="0 0 720 300">
    {[50, 100, 150, 200, 250].map((y, i) => (
      <line key={i} x1="60" y1={y} x2="680" y2={y} stroke="#e5e7eb" strokeWidth="1" />
    ))}

    {[20, 15, 10, 5, 0].map((num, i) => (
      <text key={i} x="25" y={55 + i * 50} fontSize="13" fill="#64748b">{num}</text>
    ))}

    {["Jun 18", "Jun 19", "Jun 20", "Jun 21", "Jun 22", "Jun 23", "Jun 24"].map((date, i) => (
      <text key={i} x={55 + i * 100} y="285" fontSize="13" fill="#64748b">{date}</text>
    ))}

    <polyline
      points="60,230 160,180 260,150 360,195 460,100 560,155 660,215"
      fill="none"
      stroke="#7c3aed"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {[["60","230"],["160","180"],["260","150"],["360","195"],["460","100"],["560","155"],["660","215"]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="6" fill="#7c3aed" stroke="#ffffff" strokeWidth="3" />
    ))}

    <text x="315" y="298" fontSize="13" fill="#7c3aed">● Humanizations</text>
  </svg>
</div>
</div>
          <div style={recentCard}>
            <div style={cardHeader}>
              <h2>Recent Documents</h2>
              <button style={linkButton}>View all</button>
            </div>

            {["Marketing Strategy Overview", "Product Launch Plan", "Blog Post - AI Humanization", "Academic Essay Draft"].map((doc, i) => (
              <div key={i} style={docItem}>
                <div style={docIcon}><FileText size={18} /></div>
                <div style={{ flex: 1 }}>
                  <b>{doc}</b>
                  <p style={mutedSmall}>{[420, 780, 650, 1200][i]} words • {["2h ago", "5h ago", "1d ago", "2d ago"][i]}</p>
                </div>
                <MoreVertical size={18} />
              </div>
            ))}
          </div>
        </section>

        <section style={bottomGrid}>
          <div style={usageCard}>
            <div style={circle}>80%</div>
            <div>
              <h3>8 of 10 uses</h3>
              <p style={mutedSmall}>You've used 8 of your 10 daily humanizations.</p>
              <p style={{ color: "#7c3aed", fontWeight: "bold" }}>Resets in 12h 46m</p>
            </div>
          </div>

          <div style={planCard}>
            <div style={cardHeader}>
              <h2>Plan Information</h2>
              <span style={planBadge}>Free Plan</span>
            </div>
            <p>✓ 10 humanizations per day</p>
            <p>✓ Access to Free mode</p>
            <p>✓ Standard processing speed</p>
            <button onClick={() => (window.location.href = "/pricing")} style={upgradeButton}>
              Upgrade Now →
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

function Card({ icon, title, value, note, green, orange, blue }: any) {
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
        <p style={mutedSmall}>{title}</p>
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
const upgradeButton = { padding: "12px 22px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "white", fontWeight: "bold" as const, cursor: "pointer" };
const content = { flex: 1, padding: "100px 36px 36px", maxWidth: "1250px", margin: "0 auto" };
const topbar = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" };
const title = { fontSize: "34px", margin: 0 };
const subtitle = { color: "#64748b", marginTop: "8px" };
const topActions = { display: "flex", alignItems: "center", gap: "18px" };
const planBadge = { background: "#f3e8ff", color: "#7c3aed", padding: "9px 14px", borderRadius: "999px", fontWeight: "bold" as const };
const usageBadge = { fontWeight: "bold" as const, color: "#334155" };
const avatar = { width: "38px", height: "38px", borderRadius: "50%", background: "#7c3aed", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" as const };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px" };
const statCard = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "24px", display: "flex", gap: "18px", alignItems: "center", boxShadow: "0 10px 25px rgba(15,23,42,0.05)" };
const statIcon = { width: "54px", height: "54px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" };
const mainGrid = { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px", marginBottom: "24px" };
const chartCard = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "24px" };
const recentCard = { ...chartCard };
const cardHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" };
const filterButton = { padding: "10px 14px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fff" };
const linkButton = { border: "none", background: "transparent", color: "#7c3aed", fontWeight: "bold" as const };
const chartBox = { height: "320px", background: "linear-gradient(180deg,#ffffff,#faf5ff)", borderRadius: "14px", padding: "10px" };
const docItem = { display: "flex", alignItems: "center", gap: "14px", padding: "14px 0", borderBottom: "1px solid #e5e7eb" };
const docIcon = { width: "40px", height: "40px", borderRadius: "10px", background: "#f3e8ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" };
const bottomGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" };
const usageCard = { ...chartCard, display: "flex", alignItems: "center", gap: "26px" };
const planCard = { ...chartCard };
const circle = { width: "90px", height: "90px", borderRadius: "50%", border: "12px solid #8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" as const, fontSize: "22px" };
const mutedSmall = { color: "#64748b", fontSize: "14px", margin: "4px 0" };