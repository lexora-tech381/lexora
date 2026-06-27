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
  Search,
  Plus,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Crown,
} from "lucide-react";

export default function DocumentsPage() {
  const router = useRouter();
  const documents = [
    { title: "Marketing Strategy Overview", words: "420 words", date: "2h ago", mode: "Creative" },
    { title: "Product Launch Plan", words: "780 words", date: "5h ago", mode: "Professional" },
    { title: "Blog Post - AI Humanization", words: "650 words", date: "1d ago", mode: "Natural" },
    { title: "Academic Essay Draft", words: "1,200 words", date: "2d ago", mode: "Academic" },
  ];

  return (
    <main style={page}>
      <aside style={sidebar}>
        <h2 style={logo}>Lexora</h2>

        <nav style={nav}>
          <button onClick={() => router.push("/dashboard")} style={navItem}><LayoutDashboard size={18} />Dashboard</button>
          <button onClick={() => router.push("/")} style={navItem}><PenSquare size={18} />Humanizer</button>
          <button style={activeNav}><FileText size={18} />Documents</button>
          <button onClick={() => router.push("/usage")} style={navItem}><BarChart3 size={18} />Usage</button>
          <button onClick={() => (window.location.href = "/pricing")} style={navItem}><CreditCard size={18} />Pricing</button>
          <button onClick={() => (window.location.href = "/settings")} style={navItem}><Settings size={18} />Settings</button>
          <button onClick={() => (window.location.href = "/support")} style={navItem}><LifeBuoy size={18} />Support</button>
        </nav>

        <div style={upgradeBox}>
          <Crown size={22} color="#7c3aed" />
          <h3>Upgrade to Pro</h3>
          <p style={mutedSmall}>Save unlimited documents and unlock premium modes.</p>
          <button onClick={() => (window.location.href = "/pricing")} style={upgradeButton}>Upgrade Now →</button>
        </div>
      </aside>

      <section style={content}>
        <header style={topbar}>
          <div>
            <h1 style={title}>Documents</h1>
            <p style={subtitle}>Manage, review, and reuse your humanized content.</p>
          </div>

          <button onClick={() => (window.location.href = "/")} style={newButton}>
            <Plus size={18} /> New Document
          </button>
        </header>

        <section style={summaryGrid}>
          <div style={summaryCard}><FileText color="#7c3aed" /><p>Total Documents</p><h2>12</h2></div>
          <div style={summaryCard}><BarChart3 color="#16a34a" /><p>Total Words</p><h2>4,250</h2></div>
          <div style={summaryCard}><PenSquare color="#f59e0b" /><p>Saved This Week</p><h2>3</h2></div>
        </section>

        <div style={toolbar}>
          <div style={searchBox}>
            <Search size={18} />
            <input placeholder="Search documents..." style={searchInput} />
          </div>

          <select style={filterSelect}>
            <option>All Modes</option>
            <option>Natural</option>
            <option>Academic</option>
            <option>Professional</option>
            <option>Creative</option>
          </select>
        </div>

        <section style={documentsCard}>
          <div style={tableHeader}>
            <span>Document</span>
            <span>Mode</span>
            <span>Words</span>
            <span>Date</span>
            <span>Actions</span>
          </div>

          {documents.map((doc, index) => (
            <div key={index} style={docRow}>
              <div style={docTitle}>
                <div style={docIcon}><FileText size={18} /></div>
                <div>
                  <b>{doc.title}</b>
                  <p style={mutedSmall}>Humanized document</p>
                </div>
              </div>

              <span style={modeBadge}>{doc.mode}</span>
              <span>{doc.words}</span>
              <span style={mutedSmall}>{doc.date}</span>

              <div style={actions}>
                <button style={iconButton}><Eye size={17} /></button>
                <button style={iconButton}><Download size={17} /></button>
                <button style={deleteButton}><Trash2 size={17} /></button>
                <MoreVertical size={18} />
              </div>
            </div>
          ))}
        </section>
      </section>
    </main>
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
const newButton = { display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "white", fontWeight: "bold" as const, cursor: "pointer" };
const summaryGrid = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "24px" };
const summaryCard = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "24px", boxShadow: "0 10px 25px rgba(15,23,42,0.05)" };
const toolbar = { display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "22px" };
const searchBox = { flex: 1, display: "flex", alignItems: "center", gap: "10px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "0 16px" };
const searchInput = { flex: 1, padding: "14px 0", border: "none", outline: "none", fontSize: "15px" };
const filterSelect = { padding: "14px", borderRadius: "14px", border: "1px solid #e5e7eb", background: "#fff" };
const documentsCard = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "20px", overflow: "hidden", boxShadow: "0 12px 30px rgba(15,23,42,0.05)" };
const tableHeader = { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "18px 24px", background: "#f8fafc", color: "#64748b", fontWeight: "bold" as const };
const docRow = { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", alignItems: "center", padding: "18px 24px", borderTop: "1px solid #e5e7eb" };
const docTitle = { display: "flex", alignItems: "center", gap: "14px" };
const docIcon = { width: "42px", height: "42px", borderRadius: "12px", background: "#f3e8ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" };
const modeBadge = { background: "#f3e8ff", color: "#7c3aed", padding: "7px 11px", borderRadius: "999px", fontWeight: "bold" as const, width: "fit-content" };
const actions = { display: "flex", alignItems: "center", gap: "8px" };
const iconButton = { border: "1px solid #e5e7eb", background: "#fff", borderRadius: "9px", padding: "7px", cursor: "pointer" };
const deleteButton = { ...iconButton, color: "#ef4444" };
const mutedSmall = { color: "#64748b", fontSize: "14px", margin: "4px 0" };