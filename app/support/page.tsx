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
  Mail,
  MessageCircle,
  Clock,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

export default function SupportPage() {
  const router = useRouter();

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
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

          <button onClick={() => router.push("/settings")} style={navItem}>
            <Settings size={18} /> Settings
          </button>

          <button style={activeNav}>
            <LifeBuoy size={18} /> Support
          </button>
        </nav>

        <div style={upgradeBox}>
          <Crown size={22} color="#7c3aed" />
          <h3>Upgrade to Pro</h3>
          <p style={mutedSmall}>Get priority support with premium plans.</p>
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
              Support Center
            </h1>
            <p style={subtitle}>
              Need help? Our team usually replies within 24 hours.
            </p>
          </div>

          <button
            onClick={() => {
              window.open(
                "https://mail.google.com/mail/?view=cm&fs=1&to=supportlexora@gmail.com&su=Lexora%20AI%20Support",
                "_blank"
              );
            }}
            style={contactTopButton}
          >
            <Mail size={18} /> Email Support
          </button>
        </header>

        <section
          style={{
            ...supportGrid,
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          }}
        >
          <div style={infoCard}>
            <Mail color="#7c3aed" />
            <h3>Email Support</h3>
            <p style={mutedSmall}>supportlexora@gmail.com</p>
          </div>

          <div style={infoCard}>
            <Clock color="#16a34a" />
            <h3>Response Time</h3>
            <p style={mutedSmall}>Usually within 24 hours</p>
          </div>

          <div style={infoCard}>
            <ShieldCheck color="#2563eb" />
            <h3>Secure Help</h3>
            <p style={mutedSmall}>Your messages are handled privately.</p>
          </div>
        </section>

        <section
          style={{
            ...mainGrid,
            gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1fr",
          }}
        >
          <div style={messageCard}>
            <div style={cardTitleRow}>
              <MessageCircle color="#7c3aed" />
              <h2>Send us a message</h2>
            </div>

            <input placeholder="Your name" style={inputStyle} />
            <input placeholder="Your email" style={inputStyle} />

            <select style={inputStyle}>
              <option>Choose issue type</option>
              <option>Billing issue</option>
              <option>Technical problem</option>
              <option>Account support</option>
              <option>General question</option>
            </select>

            <textarea
              placeholder="Describe your issue..."
              rows={6}
              style={{ ...inputStyle, resize: "none" as const }}
            />

            <button
              onClick={() => alert("Message submitted successfully!")}
              style={sendButton}
            >
              Send Message
            </button>
          </div>

          <div style={faqCard}>
            <div style={cardTitleRow}>
              <HelpCircle color="#7c3aed" />
              <h2>Frequently Asked Questions</h2>
            </div>

            {[
              ["How many free humanizations do I get?", "Free users receive 10 humanizations per day."],
              ["How do I upgrade?", "Visit the Pricing page and choose the plan that fits your needs."],
              ["Is my content private?", "Yes. Your content is processed securely and is not shared publicly."],
              ["When will support reply?", "Most support replies arrive within 24 hours."],
            ].map(([q, a]) => (
              <div key={q} style={faqItem}>
                <h3>{q}</h3>
                <p style={mutedSmall}>{a}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
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

const topbar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "28px",
};

const title = {
  fontSize: "38px",
  margin: 0,
};

const subtitle = {
  color: "#64748b",
  marginTop: "8px",
};

const contactTopButton = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "12px 20px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const supportGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginBottom: "24px",
};

const infoCard = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "24px",
  boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1.1fr 1fr",
  gap: "24px",
};

const messageCard = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "22px",
  padding: "28px",
  boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
};

const faqCard = { ...messageCard };

const cardTitleRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "20px",
};

const inputStyle = {
  width: "100%",
  padding: "15px",
  borderRadius: "13px",
  border: "1px solid #dbe3ef",
  outline: "none",
  fontSize: "15px",
  marginBottom: "14px",
  boxSizing: "border-box" as const,
  background: "#fff",
  color: "#0f172a",
};

const sendButton = {
  width: "100%",
  padding: "14px",
  borderRadius: "13px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: "bold" as const,
  cursor: "pointer",
  fontSize: "15px",
};

const faqItem = {
  borderTop: "1px solid #e5e7eb",
  padding: "18px 0",
};

const mutedSmall = {
  color: "#64748b",
  fontSize: "14px",
  margin: "4px 0",
  lineHeight: "1.5",
};