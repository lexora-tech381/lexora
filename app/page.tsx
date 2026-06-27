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
} from "lucide-react";

import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [mode, setMode] = useState("Free");
  const [uses, setUses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedUses = localStorage.getItem("lexora_uses");
    if (savedUses) setUses(Number(savedUses));
  }, []);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const resultWords = result.trim() ? result.trim().split(/\s+/).length : 0;
  const resultChars = result.length;
  const remaining = Math.max(10 - uses, 0);

  const humanizeText = async () => {
    if (!text.trim()) {
      alert("Please paste text first.");
      return;
    }

    if (uses >= 10) {
      setResult("You have reached your free limit of 10 humanizations today.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });

      const data = await response.json();
      setResult(data.result || data.text || "Unable to humanize text.");
    } catch {
      setResult(
        "This is a clearer and more natural version of your text. The meaning is kept the same, but the wording is smoother and easier to read."
      );
    }

    const newUses = uses + 1;
    setUses(newUses);
    localStorage.setItem("lexora_uses", String(newUses));
    setLoading(false);
  };

  const clearText = () => {
    setText("");
    setResult("");
    setCopied(false);
  };

  const copyResult = () => {
    if (!result.trim()) {
      alert("Nothing to copy yet.");
      return;
    }

    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveDocument = () => {
    if (!result.trim()) {
      alert("Please humanize text first before saving.");
      return;
    }

    const savedDocs = JSON.parse(localStorage.getItem("lexora_docs") || "[]");

    const newDoc = {
      id: Date.now(),
      title: "Humanized Document",
      date: new Date().toLocaleDateString(),
      words: result.trim().split(/\s+/).length,
      content: result,
    };

    localStorage.setItem("lexora_docs", JSON.stringify([newDoc, ...savedDocs]));
    alert("Document saved!");
  };

  return (
    <main style={page}>
      <aside style={sidebar}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  
  <h2 style={logo}>Lexora</h2>
</div>

<nav style={nav}>
  <button style={activeNav}>
    <PenSquare size={18} />
    Humanizer
  </button>

  <button onClick={() => router.push("/dashboard")} style={navItem}>
    <LayoutDashboard size={18} />
    Dashboard
  </button>

  <button onClick={() => ( "/documents")} style={navItem}>
    <FileText size={18} />
    Documents
  </button>

  <button onClick={() => router.push( "/usage")} style={navItem}>
    <BarChart3 size={18} />
    Usage
  </button>

  <button onClick={() => router.push( "/pricing")} style={navItem}>
    <CreditCard size={18} />
    Pricing
  </button>

  <button onClick={() => router.push( "/settings")} style={navItem}>
    <Settings size={18} />
    Settings
  </button>

  <button onClick={() => router.push( "/support")} style={navItem}>
    <LifeBuoy size={18} />
    Support
  </button>
</nav>

        <div style={upgradeBox}>
          <h3 style={{ margin: "0 0 8px" }}>Upgrade to Pro</h3>
          <p style={mutedSmall}>More words, faster rewriting, and premium modes.</p>
          <button onClick={() => router.push( "/pricing")} style={purpleButtonSmall}>
            Upgrade
          </button>
        </div>
      </aside>

      <section style={content}>
      <header style={topbar}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  
  <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    position: "relative",
  }}
>
  <div
  style={{
    width: "56px",
    height: "56px",
    background: "linear-gradient(135deg,#5b21b6,#c084fc)",
    clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
>
  <div
    style={{
      width: "22px",
      height: "30px",
      borderLeft: "8px solid white",
      borderBottom: "8px solid white",
      borderBottomLeftRadius: "10px",
      transform: "translateY(-2px)",
    }}
  />

  <span
  style={{
    position: "absolute",
    top: "-14px",
    right: "-16px",
    color: "#a855f7",
    fontSize: "28px",
    fontWeight: "bold",
    zIndex: 999,
  }}
>
  ✦
</span>
  
</div>

  <h2 style={headerLogo}>Lexora</h2>
</div>
</div>

  <div style={topActions}>
    <span style={planBadge}>★ Free Plan</span>
    <span style={usageBadge}>{uses} / 10 uses</span>

    <button
      onClick={() => (router.push("/login"))}
      style={smallButton}
    >
      Login
    </button>

    <button
      onClick={() => (router.push("/signup"))}
      style={purpleSmall}
    >
      Sign Up
    </button>
  </div>
</header>
<div style={heroSection}>
  <h1 style={title}>Humanize AI Text</h1>

  <p style={subtitle}>
    Rewrite AI-generated content into clear, natural, human-like writing.
  </p>
</div>

        <section style={toolCard}>
          <div style={controlsRow}>
            <div>
              <p style={label}>CHOOSE MODE</p>
              <div style={buttonGroup}>
                {["Free", "Fast", "Creative", "Enhanced"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setMode(item)}
                    style={mode === item ? activeMode : modeButton}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={label}>TONE</p>
              <select style={selectBox}>
                <option>Natural</option>
                <option>Academic</option>
                <option>Professional</option>
                <option>Friendly</option>
              </select>
            </div>
          </div>

          <div style={statusRow}>
            <span>Current Plan: Free</span>
            <span style={freePill}>{remaining} / 10 uses left</span>
            <span style={secure}>✓ Secure & Private</span>
          </div>

          <div style={panels}>
            <div style={panel}>
              <div style={panelHeader}>
                <h3 style={panelTitle}>Your AI Text</h3>
                <button onClick={clearText} style={miniButton}>
                  Clear
                </button>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your AI-generated text here..."
                style={textarea}
              />

              <p style={counter}>{wordCount} words • {charCount} characters</p>
            </div>

            <div style={panel}>
              <div style={panelHeader}>
                <h3 style={panelTitle}>Humanized Result</h3>
                <button onClick={copyResult} style={miniButton}>
                  Copy
                </button>
              </div>

              <div style={resultBox}>
                {result || "Your humanized text will appear here..."}
              </div>

              <p style={counter}>{resultWords} words • {resultChars} characters</p>
            </div>
          </div>

          <div style={mainActionRow}>
            <button onClick={humanizeText} style={humanizeButton}>
              {loading ? "Humanizing..." : "✦ Humanize Text"}
            </button>

            <button onClick={copyResult} style={copyButton}>
              Copy Result
            </button>

            <button onClick={saveDocument} style={saveButton}>
              Save Document
            </button>
          </div>

          {copied && <p style={copiedText}>✓ Copied!</p>}
</section>

<div style={landingArea}>
  <section>
    <h2 style={sectionTitle}>How Lexora Works</h2>
    <p style={sectionSubtitle}>
      Transform AI-generated content in four simple steps.
    </p>

    <div style={fourGrid}>
      <div style={featureCard}>📝<h3>Paste Text</h3><p style={mutedSmall}>Paste AI-generated content into the editor.</p></div>
      <div style={featureCard}>⚙️<h3>Choose Mode</h3><p style={mutedSmall}>Select the rewriting style that fits your needs.</p></div>
      <div style={featureCard}>✨<h3>Humanize</h3><p style={mutedSmall}>Convert robotic AI writing into natural language.</p></div>
      <div style={featureCard}>📥<h3>Save</h3><p style={mutedSmall}>Copy or save your result for future use.</p></div>
    </div>
  </section>

  <section style={sectionBlock}>
    <h2 style={sectionTitle}>Why Choose Lexora?</h2>
    <p style={sectionSubtitle}>Built to make writing clearer, natural, and professional.</p>

    <div style={fourGrid}>
      <div style={featureCard}>🛡️<h3>Advanced Humanization</h3><p style={mutedSmall}>Makes AI content sound natural and human-written.</p></div>
      <div style={featureCard}>💜<h3>Multiple Modes</h3><p style={mutedSmall}>Use Free, Fast, Creative, and Enhanced modes.</p></div>
      <div style={featureCard}>🔒<h3>Private & Secure</h3><p style={mutedSmall}>Your content is never shared publicly.</p></div>
      <div style={featureCard}>⚡<h3>Fast & Efficient</h3><p style={mutedSmall}>Get rewritten content in seconds.</p></div>
    </div>
  </section>

  <section style={lastSection}>
    <div style={testimonialBox}>
      <h3>What Our Users Say</h3>

      <div style={reviewCard}>
        <p style={stars}>★★★★★</p>
        <p style={mutedSmall}>“Lexora makes my essays sound much more natural. It is a lifesaver.”</p>
        <p style={userName}>— Sarah M., Student</p>
      </div>

      <div style={reviewCard}>
        <p style={stars}>★★★★★</p>
        <p style={mutedSmall}>“The Creative mode is amazing. My content sounds human every time.”</p>
        <p style={userName}>— James T., Freelancer</p>
      </div>
    </div>

    <div style={pricingBox}>
  <h3 style={{ textAlign: "center", marginTop: 0 }}>Pricing Made Simple</h3>

  <div style={pricingCards}>
    <div style={priceCard}>
      <h3>Free Plan</h3>
      <h2>$0 <span style={priceSmall}>/ month</span></h2>
      <p>✓ 10 uses per day</p>
      <p>✓ Standard modes</p>
      <p>✓ Basic rewriting</p>
      <button
  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
  style={purpleButtonSmall}
>
  Current Plan
</button>
    </div>

    <div style={proCard}>
      <p style={popularBadge}>Most Popular</p>
      <h3>Pro Plan</h3>
      <h2>$9.99 <span style={priceSmall}>/ month</span></h2>
      <p>✓ Unlimited uses</p>
      <p>✓ Premium modes</p>
      <p>✓ Priority support</p>
      <button onClick={() => router.push( "/pricing")} style={purpleButtonSmall}>
        Upgrade
      </button>
    </div>
  </div>
</div>

    <div style={faqBox}>
      <h3>Frequently Asked Questions</h3>
      <div style={faqItem}>Is my content stored? <span>⌄</span></div>
      <div style={faqItem}>Can I use Lexora for assignments? <span>⌄</span></div>
      <div style={faqItem}>Which mode should I choose? <span>⌄</span></div>
      <div style={faqItem}>Is Lexora free to use? <span>⌄</span></div>

      <button onClick={() => router.push( "/support")} style={faqButton}>
        View all FAQs →
      </button>
    </div>
  </section>

  <footer style={footer}>
    <b>✦ Lexora </b>
    <span>© 2026 Lexora </span>
    <span>Privacy Policy</span>
    <span>Terms of Service</span>
    <span>Contact Us</span>
  </footer>
</div>
</section>
</main>
  );
}

const landingArea = {
  marginTop: "34px",
  padding: "55px 45px",
  background: "linear-gradient(180deg, #faf5ff 0%, #f8fafc 100%)",
  borderTop: "1px solid #eadcff",
  borderRadius: "0",
  width: "calc(100% + 64px)",
  marginLeft: "-32px",
  marginRight: "-32px",
  boxSizing: "border-box" as const,
};
const page = {
  minHeight: "100vh",
  background: "#f8fafc",
  color: "#0f172a",
  display: "flex",
  fontFamily: "Arial, sans-serif",
};

const sidebar = {
  width: "270px",
  paddingBottom: "30px",
  minWidth: "250px",
  background: "#ffffff",
  borderRight: "1px solid #e5e7eb",
  padding: "24px 20px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  height: "100vh",
  position: "sticky" as const,
  top: 0,
};

const logo = {
  margin: "0 0 28px",
  fontSize: "26px",
  color: "#0f172a",
};

const nav = {
  display: "grid",
  gap: "8px",
};

const activeNav = {
  display: "flex",
  alignItems: "center",
  gap: "10px",

  textAlign: "left" as const,
  padding: "13px 15px",
  borderRadius: "12px",
  border: "none",
  background: "#f3e8ff",
  color: "#7c3aed",
  fontWeight: "bold" as const,
  cursor: "pointer",
  fontSize: "15px",
  width: "100%",
};

const navItem = {
  ...activeNav,
  background: "transparent",
  color: "#475569",
};

const upgradeBox = {
  marginTop: "auto",
  marginBottom: "20px",
  background: "#faf5ff",
  border: "1px solid #eadcff",
  borderRadius: "16px",
  padding: "18px",
  textAlign: "center" as const,
};

const content = {
  flex: 1,
  padding: "32px",
  maxWidth: "1200px",
  margin: "0 auto",
};

const topbar = {
  position: "sticky" as const,
  top: 0,
  zIndex: 1000,
  background: "#f8fafc",
  padding: "18px 0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};


const title = {
  fontSize: "52px",
  fontWeight: "700",
  margin: 0,
  letterSpacing: "-0.5px",
};

const subtitle = {
  color: "#64748b",
  marginTop: "8px",
  marginBottom: 0,
};

const topActions = {
  position: "absolute" as const,
  top: "30px",
  right: "30px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const planBadge = {
  background: "#f5f3ff",
  color: "#4c1d95",
  padding: "9px 13px",
  borderRadius: "999px",
  fontWeight: "bold" as const,
  whiteSpace: "nowrap" as const,
};

const usageBadge = {
  color: "#334155",
  fontWeight: "bold" as const,
  whiteSpace: "nowrap" as const,
};

const smallButton = {
  padding: "10px 17px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#111827",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const purpleSmall = {
  ...smallButton,
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  border: "none",
};

const toolCard = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 16px 35px rgba(15,23,42,0.06)",
};

const controlsRow = {
  display: "grid",
  gridTemplateColumns: "1fr 220px",
  gap: "22px",
  alignItems: "end",
  paddingBottom: "20px",
  borderBottom: "1px solid #e5e7eb",
};

const label = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "bold" as const,
  marginBottom: "9px",
};

const buttonGroup = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const modeButton = {
  padding: "12px 26px",
  borderRadius: "13px",
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#334155",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const activeMode = {
  ...modeButton,
  border: "2px solid #8b5cf6",
  color: "#7c3aed",
};

const selectBox = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#111827",
  fontSize: "15px",
};

const statusRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  margin: "18px 0",
  color: "#475569",
  flexWrap: "wrap" as const,
};

const freePill = {
  background: "#f3e8ff",
  color: "#7c3aed",
  padding: "8px 13px",
  borderRadius: "999px",
  fontWeight: "bold" as const,
};

const secure = {
  marginLeft: "auto",
  color: "#059669",
  fontWeight: "bold" as const,
};

const panels = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "22px",
};

const panel = {
  border: "1px solid #e5e7eb",
  borderRadius: "17px",
  padding: "16px",
  background: "#ffffff",
};

const panelHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
};

const panelTitle = {
  margin: 0,
  fontSize: "18px",
};

const miniButton = {
  padding: "8px 13px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
  fontWeight: "bold" as const,
};

const textarea = {
  width: "100%",
  height: "420px",
  border: "2px solid #a855f7",
  borderRadius: "15px",
  padding: "16px",
  fontSize: "16px",
  color: "#111827",
  background: "#ffffff",
  resize: "none" as const,
  outline: "none",
};

const resultBox = {
  height: "420px",
  overflowY: "auto" as const,
  border: "2px solid #a855f7",
  borderRadius: "15px",
  padding: "16px",
  fontSize: "16px",
  color: "#334155",
  background: "#ffffff",
  whiteSpace: "pre-wrap" as const,
};

const counter = {
  color: "#64748b",
  fontSize: "14px",
  margin: "10px 0 0",
};

const mainActionRow = {
  display: "flex",
  justifyContent: "center",
  gap: "16px",
  marginTop: "28px",
  paddingTop: "20px",
  borderTop: "1px solid #e5e7eb",
};

const humanizeButton = {
  padding: "12px 32px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: "bold" as const,
  cursor: "pointer",
  fontSize: "15px",
};

const copyButton = {
  ...humanizeButton,
  background: "#111827",
};

const saveButton = {
  ...humanizeButton,
  background: "#ffffff",
  color: "#111827",
  border: "1px solid #e5e7eb",
};

const purpleButtonSmall = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: "bold" as const,
  cursor: "pointer",
  width: "100%",
  marginTop: "18px",
  whiteSpace: "nowrap" as const,
};

const copiedText = {
  color: "#22c55e",
  textAlign: "center" as const,
  marginTop: "12px",
};

const mutedSmall = {
  color: "#64748b",
  lineHeight: "1.5",
  fontSize: "14px",
};
const featureCard = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "28px",
  textAlign: "center" as const,
  boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
  minHeight: "155px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
};
const sectionBlock = {
  marginTop: "70px",
};

const sectionTitle = {
  textAlign: "center" as const,
  fontSize: "32px",
  marginBottom: "8px",
};

const sectionSubtitle = {
  textAlign: "center" as const,
  color: "#64748b",
  marginBottom: "35px",
};

const fourGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "24px",
  maxWidth: "1180px",
  margin: "0 auto",
};

const featureCard2 = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "30px",
  textAlign: "center" as const,
  boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
  minHeight: "160px",
};

const bottomGrid = {
  marginTop: "35px",
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
};

const bottomCard = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "28px",
  boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
};

const footer = {
  marginTop: "40px",
  padding: "25px 0",
  display: "flex",
  justifyContent: "center",
  gap: "25px",
  color: "#64748b",
  fontSize: "14px",
};
const lastSection = {
  marginTop: "55px",
  display: "grid",
  gridTemplateColumns: "1fr 1.2fr 1fr",
  gap: "28px",
  maxWidth: "1180px",
  marginLeft: "auto",
  marginRight: "auto",
  alignItems: "stretch",
};

const testimonialBox = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "22px",
  padding: "32px",
  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  minHeight: "430px",
};

const reviewCard = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  marginTop: "16px",
  background: "#ffffff",
};

const stars = {
  color: "#f59e0b",
  margin: "0 0 8px",
};

const userName = {
  color: "#64748b",
  fontSize: "14px",
  marginTop: "10px",
};

const pricingBox = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "22px",
  padding: "32px",
  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  minHeight: "430px",
};

const pricingCards = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "18px",
  marginTop: "24px",
};

const priceCard = {
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "24px",
  minHeight: "300px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
};

const proCard = {
  ...priceCard,
  border: "2px solid #8b5cf6",
  position: "relative" as const,
};

const popularBadge = {
  position: "absolute" as const,
  top: "-14px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#8b5cf6",
  color: "white",
  padding: "4px 12px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "bold" as const,
  whiteSpace: "nowrap" as const,
};

const priceSmall = {
  fontSize: "14px",
  color: "#64748b",
  fontWeight: "normal" as const,
};

const faqBox = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "22px",
  padding: "32px",
  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  minHeight: "430px",
};

const faqItem = {
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "14px 16px",
  marginTop: "12px",
  display: "flex",
  justifyContent: "space-between",
  fontWeight: "bold" as const,
};

const faqButton = {
  marginTop: "18px",
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  background: "transparent",
  color: "#7c3aed",
  fontWeight: "bold" as const,
  cursor: "pointer",
};
const proPlanFull = {
  margin: "25px auto 0",
  maxWidth: "260px",
  border: "2px solid #8b5cf6",
  borderRadius: "16px",
  padding: "24px",
  position: "relative" as const,
  lineHeight: "1.5",
};
const stickyHeader = {
  position: "sticky" as const,
  top: 0,
  zIndex: 1000,
  background: "#f8fafc",
  padding: "18px 0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const headerLogo = {
  margin: 0,
  fontSize: "26px",
  fontWeight: 800,
  color: "#0f172a",
};

const heroSection = {
  textAlign: "center" as const,
  padding: "45px 20px 60px",
};

const heroTitle = {
  fontSize: "80px",
  fontWeight: 800,
  color: "#0f172a",
  margin: 0,
  lineHeight: "1.05",
};

const heroDescription = {
  fontSize: "22px",
  color: "#64748b",
  marginTop: "18px",
};