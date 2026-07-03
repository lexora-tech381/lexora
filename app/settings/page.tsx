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
  User,
  Bell,
  Shield,
  Palette,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

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
    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);
      setEmail(session.user.email || "");
      setFullName(session.user.user_metadata?.full_name || "");
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const saveProfile = async () => {
    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
      },
    });

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Settings saved successfully!");
  };

  return (
    <main style={{ ...page, flexDirection: isMobile ? "column" : "row" }}>
      <aside style={{ ...sidebar, display: isMobile ? "none" : "flex" }}>
        <h2 style={logo}>Lexora</h2>

        <nav style={nav}>
          <button onClick={() => router.push("/dashboard")} style={navItem}>
            <LayoutDashboard size={18} /> Dashboard
          </button>

          <button onClick={() => router.push("/")} style={navItem}>
            <PenSquare size={18} /> Humanizer
          </button>

          <button onClick={() => router.push("/documents")} style={navItem}>
            <FileText size={18} /> Documents
          </button>

          <button onClick={() => router.push("/usage")} style={navItem}>
            <BarChart3 size={18} /> Usage
          </button>

          <button onClick={() => router.push("/pricing")} style={navItem}>
            <CreditCard size={18} /> Pricing
          </button>

          <button style={activeNav}>
            <Settings size={18} /> Settings
          </button>

          <button onClick={() => router.push("/support")} style={navItem}>
            <LifeBuoy size={18} /> Support
          </button>
        </nav>

        <div style={upgradeBox}>
          <Crown size={22} color="#7c3aed" />
          <h3>Upgrade to Pro</h3>
          <p style={mutedSmall}>Unlock advanced settings and premium modes.</p>
          <button onClick={() => router.push("/pricing")} style={upgradeButton}>
            Upgrade Now →
          </button>
        </div>
      </aside>

      <section
        style={{
          flex: 1,
          width: "100%",
          maxWidth: isMobile ? "100%" : "1250px",
          margin: isMobile ? "0" : "0 auto",
          padding: isMobile ? "88px 16px 24px" : "50px 36px",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        {isMobile && (
          <header style={mobileHeader}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              style={menuButton}
            >
              ☰
            </button>

            <div style={brandWrap}>
              <div style={brandIcon}>
                <div style={brandMark} />
              </div>
              <h2 style={headerLogo}>Lexora</h2>
            </div>

            <div style={headerActions}>
              {user ? (
                <div style={avatar}>
                  {(
                    user.user_metadata?.full_name?.[0] ||
                    user.email?.[0] ||
                    "U"
                  ).toUpperCase()}
                </div>
              ) : (
                <>
                  <button onClick={() => router.push("/login")} style={headerSmallButton}>
                    Login
                  </button>

                  <button onClick={() => router.push("/signup")} style={headerPurpleButton}>
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
            gap: isMobile ? "16px" : "0",
          }}
        >
          <div>
            <h1 style={{ ...title, fontSize: isMobile ? "34px" : "38px" }}>
              Settings
            </h1>
            <p style={subtitle}>
              Manage your account preferences and Lexora experience.
            </p>
          </div>

          <button onClick={saveProfile} style={saveButton}>
            <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </header>
        <div
          style={{
            ...settingsGrid,
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          }}
        >
          <section style={settingsCard}>
            <div style={cardHeading}>
              <div style={cardIcon}>
                <User size={20} />
              </div>
              <div>
                <h2 style={cardTitle}>Profile</h2>
                <p style={cardText}>Update your personal information.</p>
              </div>
            </div>

            <label style={label}>Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              style={input}
            />

            <label style={label}>Email Address</label>
            <input value={email} disabled style={{ ...input, opacity: 0.65 }} />

            <p style={helpText}>Your email address cannot be changed here.</p>
          </section>

          <section style={settingsCard}>
            <div style={cardHeading}>
              <div style={cardIcon}>
                <Bell size={20} />
              </div>
              <div>
                <h2 style={cardTitle}>Notifications</h2>
                <p style={cardText}>Choose what updates you want to receive.</p>
              </div>
            </div>

            <SettingToggle
              title="Product updates"
              text="Receive news about Lexora features and improvements."
            />

            <SettingToggle
              title="Usage reminders"
              text="Get notified when you are close to your plan limit."
            />

            <SettingToggle
              title="Tips and writing advice"
              text="Receive helpful tips to improve your writing."
            />
          </section>

          <section style={settingsCard}>
            <div style={cardHeading}>
              <div style={cardIcon}>
                <Palette size={20} />
              </div>
              <div>
                <h2 style={cardTitle}>Writing Preferences</h2>
                <p style={cardText}>Set your default humanizer preferences.</p>
              </div>
            </div>

            <label style={label}>Default Tone</label>
            <select style={input} defaultValue="Natural">
              <option>Natural</option>
              <option>Professional</option>
              <option>Academic</option>
              <option>Friendly</option>
              <option>Creative</option>
            </select>

            <label style={label}>Default Mode</label>
            <select style={input} defaultValue="Free">
              <option>Free</option>
              <option>Fast</option>
              <option>Creative</option>
              <option>Enhanced</option>
            </select>
          </section>

          <section style={settingsCard}>
            <div style={cardHeading}>
              <div style={cardIcon}>
                <Shield size={20} />
              </div>
              <div>
                <h2 style={cardTitle}>Account & Security</h2>
                <p style={cardText}>Manage your account security options.</p>
              </div>
            </div>

            <div style={securityRow}>
              <div>
                <h3 style={securityTitle}>Password</h3>
                <p style={cardText}>Keep your account secure with a strong password.</p>
              </div>

              <button
                onClick={() => router.push("/login")}
                style={outlineButton}
              >
                Change Password
              </button>
            </div>

            <div style={line} />

            <div style={securityRow}>
              <div>
                <h3 style={securityTitle}>Current Plan</h3>
                <p style={cardText}>You are currently using the Free plan.</p>
              </div>

              <button
                onClick={() => router.push("/pricing")}
                style={outlineButton}
              >
                View Plans
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function SettingToggle({ title, text }: { title: string; text: string }) {
  const [enabled, setEnabled] = useState(true);

  return (
    <div style={toggleRow}>
      <div>
        <h3 style={toggleTitle}>{title}</h3>
        <p style={cardText}>{text}</p>
      </div>

      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        style={{
          ...toggle,
          background: enabled ? "#7c3aed" : "#d1d5db",
        }}
      >
        <span
          style={{
            ...toggleCircle,
            transform: enabled ? "translateX(20px)" : "translateX(2px)",
          }}
        />
      </button>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f8fafc",
  color: "#0f172a",
  fontFamily: "Arial, sans-serif",
  display: "flex",
};

const sidebar = {
  width: "270px",
  minHeight: "100vh",
  background: "#ffffff",
  borderRight: "1px solid #e5e7eb",
  padding: "32px 20px",
  boxSizing: "border-box" as const,
  flexDirection: "column" as const,
};

const logo = {
  fontSize: "28px",
  margin: "0 0 40px",
  fontWeight: "800",
};

const nav = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
};

const navItem = {
  border: "none",
  background: "transparent",
  padding: "14px 16px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  color: "#334155",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer",
  textAlign: "left" as const,
};

const activeNav = {
  ...navItem,
  background: "#f0e4ff",
  color: "#7c3aed",
};

const upgradeBox = {
  marginTop: "auto",
  background: "#faf5ff",
  border: "1px solid #e9d5ff",
  borderRadius: "16px",
  padding: "20px",
};

const mutedSmall = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.5",
};

const upgradeButton = {
  width: "100%",
  border: "none",
  borderRadius: "10px",
  padding: "12px",
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  color: "#ffffff",
  fontWeight: "800",
  cursor: "pointer",
};

const mobileHeader = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  height: "64px",
  background: "#ffffff",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 14px",
  zIndex: 1000,
  boxSizing: "border-box" as const,
};

const menuButton = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  fontSize: "20px",
  cursor: "pointer",
};

const brandWrap = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const brandIcon = {
  width: "30px",
  height: "30px",
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const brandMark = {
  width: "11px",
  height: "14px",
  borderLeft: "4px solid white",
  borderBottom: "4px solid white",
};

const headerLogo = {
  margin: 0,
  fontSize: "21px",
  fontWeight: "800",
};

const headerActions = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
};

const headerSmallButton = {
  border: "none",
  background: "transparent",
  fontWeight: "700",
  cursor: "pointer",
  padding: "8px",
};

const headerPurpleButton = {
  border: "none",
  background: "#7c3aed",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "8px 10px",
  fontWeight: "700",
  cursor: "pointer",
};

const avatar = {
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  background: "#7c3aed",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
};

const mobileMenu = {
  position: "fixed" as const,
  top: "72px",
  left: "12px",
  right: "12px",
  background: "#ffffff",
  borderRadius: "16px",
  padding: "10px",
  boxShadow: "0 16px 35px rgba(15,23,42,0.18)",
  zIndex: 999,
};

const mobileMenuItem = {
  width: "100%",
  textAlign: "left" as const,
  border: "none",
  background: "#f8fafc",
  padding: "14px 12px",
  marginBottom: "8px",
  borderRadius: "10px",
  color: "#0f172a",
  fontWeight: "700",
  cursor: "pointer",
};

const topbar = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "30px",
};

const title = {
  margin: 0,
  fontWeight: "800",
};

const subtitle = {
  color: "#64748b",
  fontSize: "16px",
  marginTop: "10px",
};

const saveButton = {
  border: "none",
  borderRadius: "10px",
  padding: "13px 18px",
  background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  color: "#ffffff",
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
};

const settingsGrid = {
  display: "grid",
  gap: "22px",
};

const settingsCard = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "24px",
  boxSizing: "border-box" as const,
};

const cardHeading = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "24px",
};

const cardIcon = {
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  background: "#f3e8ff",
  color: "#7c3aed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardTitle = {
  margin: 0,
  fontSize: "19px",
};

const cardText = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.5",
};

const label = {
  display: "block",
  margin: "18px 0 8px",
  fontWeight: "700",
  fontSize: "14px",
};

const input = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #dbe2ea",
  fontSize: "15px",
  outline: "none",
  background: "#ffffff",
};

const helpText = {
  margin: "8px 0 0",
  color: "#94a3b8",
  fontSize: "12px",
};

const toggleRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "15px",
  padding: "16px 0",
  borderBottom: "1px solid #eef2f7",
};

const toggleTitle = {
  margin: 0,
  fontSize: "15px",
};

const toggle = {
  width: "44px",
  height: "24px",
  borderRadius: "99px",
  border: "none",
  padding: 0,
  cursor: "pointer",
  transition: "0.2s",
};

const toggleCircle = {
  display: "block",
  width: "20px",
  height: "20px",
  borderRadius: "50%",
  background: "#ffffff",
  transition: "0.2s",
};

const securityRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
};

const securityTitle = {
  margin: 0,
  fontSize: "15px",
};

const outlineButton = {
  border: "1px solid #d8b4fe",
  background: "#faf5ff",
  color: "#7c3aed",
  borderRadius: "9px",
  padding: "10px 12px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const line = {
  height: "1px",
  background: "#eef2f7",
  margin: "20px 0",
};