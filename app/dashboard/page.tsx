"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  LogOut,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [todayUsage, setTodayUsage] = useState(0);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session.user);

      const today = new Date().toISOString().split("T")[0];

      const { count } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      setDocumentsCount(count || 0);

      const { data: usage } = await supabase
        .from("usage")
        .select("count")
        .eq("user_id", session.user.id)
        .eq("date", today)
        .maybeSingle();

      setTodayUsage(usage?.count || 0);

      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentDocuments(docs || []);
      setCheckingSession(false);
    }

    checkSession();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const page = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: isMobile ? "column" as const : "row" as const,
    background: "#f8fafc",
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
  };

  const sidebar = {
    width: isMobile ? "70px" : "250px",
    background: "#fff",
    borderRight: isMobile ? "none" : "1px solid #e5e7eb",
    borderBottom: isMobile ? "1px solid #e5e7eb" : "none",
    padding: isMobile ? "16px 10px" : "28px 20px",
    height: isMobile ? "auto" : "100vh",
    position: isMobile ? "relative" as const : "sticky" as const,
    top: 0,
    display: isMobile ? "none" : "flex",
    flexDirection: "column" as const,
  };

  const content = {
    flex: 1,
    width: "100%",
    boxSizing: "border-box" as const,
    padding: isMobile ? "92px 16px 24px" : "100px 36px 36px",
    maxWidth: "1250px",
    margin: "0 auto",
  };

  const topbar = {
    display: "flex",
    flexDirection: isMobile ? "column" as const : "row" as const,
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    gap: isMobile ? "16px" : "0",
    marginBottom: "30px",
  };

  const statsGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "24px",
  };

  const mainGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr",
    gap: "24px",
    marginBottom: "24px",
  };

  const bottomGrid = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: "24px",
  };

  const nav = {
    display: "grid",
    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "1fr",
    gap: "10px",
  };

  const title = {
    fontSize: isMobile ? "30px" : "34px",
    margin: 0,
  };

  const chartBox = {
    height: isMobile ? "220px" : "320px",
    background: "linear-gradient(180deg,#ffffff,#faf5ff)",
    borderRadius: "14px",
    padding: "10px",
    overflow: "hidden",
  };

  if (checkingSession) {
    return (
      <main style={{ ...page, alignItems: "center", justifyContent: "center" }}>
        <p style={loadingText}>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main style={page}>
      <aside style={sidebar}>
        <h2 style={logo}>Lexora</h2>

        <nav style={nav}>
          <button style={activeNav}><LayoutDashboard size={18} />Dashboard</button>
          <button onClick={() => router.push("/")} style={navItem}><PenSquare size={18} />Humanizer</button>
          <button onClick={() => router.push("/documents")} style={navItem}><FileText size={18} />Documents</button>
          <button onClick={() => router.push("/usage")} style={navItem}><BarChart3 size={18} />Usage</button>
          <button onClick={() => router.push("/pricing")} style={navItem}><CreditCard size={18} />Pricing</button>
          <button onClick={() => router.push("/settings")} style={navItem}><Settings size={18} />Settings</button>
          <button onClick={() => router.push("/support")} style={navItem}><LifeBuoy size={18} />Support</button>
          <button onClick={handleLogout} style={navItem}><LogOut size={18} />Logout</button>
        </nav>

        <div style={upgradeBox}>
          <Crown size={22} color="#7c3aed" />
          <h3>Upgrade to Pro</h3>
          <p style={mutedSmall}>Unlock unlimited words, premium modes and faster processing.</p>
          <button onClick={() => router.push("/pricing")} style={upgradeButton}>
            Upgrade Now →
          </button>
        </div>
      </aside>

      <section style={content}>
      {isMobile && (
<header style={mobileHeader}>
  <button
    onClick={() => setMenuOpen(!menuOpen)}
    style={menuButton}
  >
    ☰
  </button>

  <div style={brandWrap}>
    <div style={brandIcon}>
      <div style={brandMark}/>
    </div>

    <h2 style={headerLogo}>Lexora</h2>
  </div>

  <div style={headerActions}>
    {user ? (
      <div style={avatar}>
        {(user.user_metadata?.full_name?.[0] ||
          user.email?.[0] ||
          "U").toUpperCase()}
      </div>
    ) : (
      <>
        <button
          onClick={() => router.push("/login")}
          style={headerSmallButton}
        >
          Login
        </button>

        <button
          onClick={() => router.push("/signup")}
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
  <button onClick={() => {setMenuOpen(false); router.push("/dashboard");}} style={mobileMenuItem}>Dashboard</button>

  <button onClick={() => {setMenuOpen(false); router.push("/");}} style={mobileMenuItem}>Humanizer</button>

  <button onClick={() => {setMenuOpen(false); router.push("/documents");}} style={mobileMenuItem}>Documents</button>

  <button onClick={() => {setMenuOpen(false); router.push("/usage");}} style={mobileMenuItem}>Usage</button>

  <button onClick={() => {setMenuOpen(false); router.push("/pricing");}} style={mobileMenuItem}>Pricing</button>

  <button onClick={() => {setMenuOpen(false); router.push("/settings");}} style={mobileMenuItem}>Settings</button>

  <button onClick={() => {setMenuOpen(false); router.push("/support");}} style={mobileMenuItem}>Support</button>

  <button onClick={handleLogout} style={mobileMenuItem}>
    Logout
  </button>
</div>
)}
        <header style={topbar}>
          <div>
            <h1 style={title}>Dashboard</h1>
            <p style={subtitle}>Welcome back! Here's what's happening with your content.</p>
          </div>

          <div style={topActions}>
            <span style={planBadge}>★ Free Plan</span>
            <span style={usageBadge}>{todayUsage} / 10 uses</span>
            <Bell size={22} />
            <div style={avatar}>C</div>
          </div>
        </header>

        <section style={statsGrid}>
          <Card icon={<FileText />} title="Total Documents" value={documentsCount} note="Your saved documents" />
          <Card icon={<TrendingUp />} title="Total Words" value="4,250" note="All saved words" green />
          <Card icon={<Zap />} title="Today's Humanizations" value={todayUsage} note="Today's usage" orange />
          <Card icon={<Clock />} title="Remaining Uses" value={`${10 - todayUsage} / 10`} note="Resets tomorrow" blue />
        </section>

        <section style={mainGrid}>
          <div style={chartCard}>
            <div style={cardHeader}>
              <h2>Humanizations Over Time</h2>
              <button style={filterButton}>7 Days⌄</button>
            </div>

            <div style={chartBox}>
              <svg width="100%" height="100%" viewBox="0 0 720 300">
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

                {[["60", "230"], ["160", "180"], ["260", "150"], ["360", "195"], ["460", "100"], ["560", "155"], ["660", "215"]].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="6" fill="#7c3aed" stroke="#ffffff" strokeWidth="3" />
                ))}
              </svg>
            </div>
          </div>

          <div style={recentCard}>
            <div style={cardHeader}>
              <h2>Recent Documents</h2>
              <button onClick={() => router.push("/documents")} style={linkButton}>View all</button>
            </div>

            {recentDocuments.length === 0 ? (
              <p style={mutedSmall}>No documents saved yet.</p>
            ) : (
              recentDocuments.map((doc) => (
                <div key={doc.id} style={docItem}>
                  <div style={docIcon}><FileText size={18} /></div>

                  <div style={{ flex: 1 }}>
                    <b>{doc.title || doc.original_text?.slice(0, 35) || "Untitled"}</b>
                    <p style={mutedSmall}>
                      {doc.humanized_text?.trim().split(/\s+/).length || 0} words •{" "}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <MoreVertical size={18} />
                </div>
              ))
            )}
          </div>
        </section>

        <section style={bottomGrid}>
          <div style={usageCard}>
            <div style={circle}>{Math.round((todayUsage / 10) * 100)}%</div>
            <div>
              <h3>{todayUsage} of 10 uses</h3>
              <p style={mutedSmall}>You've used {todayUsage} of your 10 daily humanizations.</p>
              <p style={{ color: "#7c3aed", fontWeight: "bold" }}>Resets tomorrow</p>
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
            <button onClick={() => router.push("/pricing")} style={upgradeButton}>
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

const loadingText = { color: "#64748b", fontSize: "16px", margin: 0 };
const logo = { fontSize: "26px", fontWeight: 800, marginBottom: "28px" };

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
  marginTop: "24px",
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
};

const subtitle = { color: "#64748b", marginTop: "8px" };

const topActions = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap" as const,
};

const planBadge = {
  background: "#f3e8ff",
  color: "#7c3aed",
  padding: "9px 14px",
  borderRadius: "999px",
  fontWeight: "bold" as const,
};

const usageBadge = { fontWeight: "bold" as const, color: "#334155" };

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
};

const chartCard = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "24px",
};

const recentCard = { ...chartCard };

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
};

const linkButton = {
  border: "none",
  background: "transparent",
  color: "#7c3aed",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const docItem = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "14px 0",
  borderBottom: "1px solid #e5e7eb",
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
};

const usageCard = {
  ...chartCard,
  display: "flex",
  alignItems: "center",
  gap: "26px",
  flexWrap: "wrap" as const,
};

const planCard = { ...chartCard };

const circle = {
  width: "90px",
  height: "90px",
  borderRadius: "50%",
  border: "12px solid #8b5cf6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold" as const,
  fontSize: "22px",
};

const mutedSmall = {
  color: "#64748b",
  fontSize: "14px",
  margin: "4px 0",
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
};

const brandIcon = {
  width: "38px",
  height: "38px",
  background: "linear-gradient(135deg,#5b21b6,#c084fc)",
  clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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