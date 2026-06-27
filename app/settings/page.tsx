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
  Crown,
  User,
  Bell,
  Shield,
  Palette,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  return (
    <main style={page}>
      <aside style={sidebar}>
        <h2 style={logo}>Lexora</h2>

        <nav style={nav}>
  <button onClick={() => router.push("/dashboard")} style={navItem}><LayoutDashboard size={18} />Dashboard</button>
  <button onClick={() => router.push("/")} style={navItem}><PenSquare size={18} />Humanizer</button>
  <button onClick={() => router.push("/documents")} style={navItem}><FileText size={18} />Documents</button>
  <button onClick={() => router.push("/usage")} style={navItem}><BarChart3 size={18} />Usage</button>
  <button onClick={() => router.push("/pricing")} style={navItem}><CreditCard size={18} />Pricing</button>
  <button style={activeNav}><Settings size={18} />Settings</button>
  <button onClick={() => router.push("/support")} style={navItem}><LifeBuoy size={18} />Support</button>
</nav>

        <div style={upgradeBox}>
          <Crown size={22} color="#7c3aed" />
          <h3>Upgrade to Pro</h3>
          <p style={mutedSmall}>Unlock advanced settings and premium modes.</p>
          <button onClick={() => (router.push("/pricing"))} style={upgradeButton}>Upgrade Now →</button>
        </div>
      </aside>

      <section style={content}>
        <header style={topbar}>
          <div>
            <h1 style={title}>Settings</h1>
            <p style={subtitle}>Manage your account preferences and Lexora experience.</p>
          </div>

          <button onClick={() => alert("Settings saved successfully!")} style={saveButton}>
            <Save size={18} /> Save Changes
          </button>
        </header>

        <section style={mainGrid}>
          <div style={leftColumn}>
            <div style={card}>
              <div style={cardTitleRow}>
                <User color="#7c3aed" />
                <h2>Profile Settings</h2>
              </div>

              <label style={label}>Full Name</label>
              <input style={input} defaultValue="Christina" />

              <label style={label}>Email Address</label>
              <input style={input} defaultValue="christina@example.com" />

              <label style={label}>Role</label>
              <select style={input}>
                <option>Student</option>
                <option>Freelancer</option>
                <option>Business Owner</option>
                <option>Content Creator</option>
              </select>
            </div>

            <div style={card}>
              <div style={cardTitleRow}>
                <Palette color="#7c3aed" />
                <h2>Writing Preferences</h2>
              </div>

              <label style={label}>Default Tone</label>
              <select style={input}>
                <option>Natural</option>
                <option>Academic</option>
                <option>Professional</option>
                <option>Friendly</option>
              </select>

              <label style={label}>Default Mode</label>
              <select style={input}>
                <option>Free</option>
                <option>Fast</option>
                <option>Creative</option>
                <option>Enhanced</option>
              </select>

              <div style={toggleRow}>
                <div>
                  <b>Save documents automatically</b>
                  <p style={mutedSmall}>Automatically save every humanized result.</p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </div>

          <div style={rightColumn}>
            <div style={card}>
              <div style={cardTitleRow}>
                <Bell color="#7c3aed" />
                <h2>Notifications</h2>
              </div>

              <div style={toggleRow}>
                <div>
                  <b>Email updates</b>
                  <p style={mutedSmall}>Receive account and product updates.</p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>

              <div style={toggleRow}>
                <div>
                  <b>Usage reminders</b>
                  <p style={mutedSmall}>Notify me when I am close to my daily limit.</p>
                </div>
                <input type="checkbox" />
              </div>

              <div style={toggleRow}>
                <div>
                  <b>Billing alerts</b>
                  <p style={mutedSmall}>Receive alerts about payments and renewals.</p>
                </div>
                <input type="checkbox" defaultChecked />
              </div>
            </div>

            <div style={card}>
              <div style={cardTitleRow}>
                <Shield color="#7c3aed" />
                <h2>Privacy & Security</h2>
              </div>

              <div style={securityItem}>
                <b>Password</b>
                <button style={smallButton}>Change</button>
              </div>

              <div style={securityItem}>
                <b>Two-factor authentication</b>
                <button style={smallButton}>Enable</button>
              </div>

              <div style={securityItem}>
                <b>Delete account data</b>
                <button style={dangerButton}>Delete</button>
              </div>
            </div>

            <div style={planCard}>
              <h2>Current Plan</h2>
              <span style={planBadge}>Free Plan</span>
              <p style={mutedSmall}>You have 10 free humanizations per day.</p>
              <button onClick={() => (window.location.href = "/pricing")} style={upgradeButton}>
                Upgrade Plan →
              </button>
            </div>
          </div>
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
const saveButton = { display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "white", fontWeight: "bold" as const, cursor: "pointer" };

const mainGrid = { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" };
const leftColumn = { display: "grid", gap: "24px" };
const rightColumn = { display: "grid", gap: "24px" };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "22px", padding: "28px", boxShadow: "0 12px 30px rgba(15,23,42,0.05)" };
const cardTitleRow = { display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" };

const label = { display: "block", fontWeight: "bold" as const, color: "#334155", marginBottom: "8px", marginTop: "14px" };
const input = { width: "100%", padding: "14px", borderRadius: "13px", border: "1px solid #dbe3ef", outline: "none", fontSize: "15px", boxSizing: "border-box" as const };
const toggleRow = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px", padding: "16px 0", borderTop: "1px solid #e5e7eb" };
const securityItem = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: "1px solid #e5e7eb" };

const smallButton = { padding: "9px 14px", borderRadius: "10px", border: "1px solid #e5e7eb", background: "#fff", color: "#7c3aed", fontWeight: "bold" as const, cursor: "pointer" };
const dangerButton = { ...smallButton, color: "#ef4444" };
const planCard = { ...card, background: "linear-gradient(135deg,#faf5ff,#ffffff)" };
const planBadge = { display: "inline-block", background: "#f3e8ff", color: "#7c3aed", padding: "9px 14px", borderRadius: "999px", fontWeight: "bold" as const, marginBottom: "14px" };
const mutedSmall = { color: "#64748b", fontSize: "14px", margin: "4px 0", lineHeight: "1.5" };