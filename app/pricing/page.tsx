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
  Check,
  Star,
  Shield,
} from "lucide-react";

export default function PricingPage() {
  const router = useRouter();

  const [billing, setBilling] = useState("monthly");
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const isYearly = billing === "yearly";

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

  const checkoutLinks = {
    silver:
      "https://buy.polar.sh/polar_cl_A7Nr0bKmhPcczc9dMY1ZTgA8z13e6ggrmuLxk1cj5Ab",
    gold:
      "https://buy.polar.sh/polar_cl_GbQaVEWBGt7jhATZjNFVdiarBKQlf6jvL613J3XSKAW",
      platinum:
      "https://buy.polar.sh/polar_cl_aqCr5DXtBm8ZlsWlWucMFte1AxjeIBu00EI0d2pgTWV",
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      desc: "For trying Lexora.",
      features: [
        "10 humanizations per day",
        "Free mode",
        "Basic rewriting",
        "Standard speed",
      ],
      button: "Current Plan",
    },
    {
      name: "Silver",
      price: isYearly ? "$29/year" : "$2.99/month",
      desc: "For light monthly use.",
      features: [
        "10,000 words/month",
        "Faster processing",
        "Better humanization",
        "Email support",
      ],
      button: "Get Silver",
      path: checkoutLinks.silver,
    },
    {
      name: "Gold",
      price: isYearly ? "$99/year" : "$9.99/month",
      desc: "Best for students and creators.",
      features: [
        "30,000 words/month",
        "Fast mode",
        "Creative mode",
        "Priority support",
      ],
      button: "Get Gold",
      popular: true,
      path: checkoutLinks.gold,
    },
    {
      name: "Platinum",
      price: isYearly ? "$189/year" : "$19.99/month",
      desc: "For heavy professional use.",
      features: [
        "60,000 words/month",
        "Platinum humanization",
        "Maximum speed",
        "Early access features",
      ],
      button: "Get Platinum",
      path: checkoutLinks.platinum,
    },
  ];

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

          <button style={activeNav}>
            <CreditCard size={18} /> Pricing
          </button>

          <button onClick={() => router.push("/settings")} style={navItem}>
            <Settings size={18} /> Settings
          </button>

          <button onClick={() => router.push("/support")} style={navItem}>
            <LifeBuoy size={18} /> Support
          </button>
        </nav>

        <div style={upgradeBox}>
          <Crown size={22} color="#7c3aed" />
          <h3>Upgrade to Pro</h3>
          <p style={mutedSmall}>Choose a plan that fits your writing needs.</p>
          <button style={upgradeButton}>View Plans</button>
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
            <button onClick={() => { setMenuOpen(false); router.push("/dashboard"); }} style={mobileMenuItem}>Dashboard</button>
            <button onClick={() => { setMenuOpen(false); router.push("/"); }} style={mobileMenuItem}>Humanizer</button>
            <button onClick={() => { setMenuOpen(false); router.push("/documents"); }} style={mobileMenuItem}>Documents</button>
            <button onClick={() => { setMenuOpen(false); router.push("/usage"); }} style={mobileMenuItem}>Usage</button>
            <button onClick={() => { setMenuOpen(false); router.push("/pricing"); }} style={mobileMenuItem}>Pricing</button>
            <button onClick={() => { setMenuOpen(false); router.push("/settings"); }} style={mobileMenuItem}>Settings</button>
            <button onClick={() => { setMenuOpen(false); router.push("/support"); }} style={mobileMenuItem}>Support</button>
          </div>
        )}

        <header style={hero}>
          <span style={heroBadge}>
            <Star size={16} /> Flexible Pricing
          </span>

          <h1 style={{ ...title, fontSize: isMobile ? "34px" : "48px" }}>
            Simple pricing for better writing
          </h1>

          <p style={subtitle}>
            Choose the plan that helps you humanize AI text faster, more
            naturally, and more professionally.
          </p>

          <p style={comingSoon}>
          🚀 Upgrade anytime and unlock more writing power with Lexora.
      
        </p>

          <div style={toggleWrapper}>
            <button
              onClick={() => setBilling("monthly")}
              style={billing === "monthly" ? activeToggle : inactiveToggle}
            >
              Monthly
            </button>

            <button
              onClick={() => setBilling("yearly")}
              style={billing === "yearly" ? activeToggle : inactiveToggle}
            >
              Yearly
            </button>
          </div>

          {isYearly && <p style={saveText}>Save more with yearly billing.</p>}
        </header>

        <section
          style={{
            ...cardsGrid,
            gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
          }}
        >
          {plans.map((plan) => (
            <div key={plan.name} style={plan.popular ? popularCard : card}>
              {plan.popular && <div style={popularBadge}>⭐ Most Popular</div>}

              <h2 style={planName}>{plan.name}</h2>
              <p style={mutedSmall}>{plan.desc}</p>
              <h1 style={price}>{plan.price}</h1>

              <div style={features}>
                {plan.features.map((feature) => (
                  <p key={feature} style={featureItem}>
                    <Check size={17} color="#16a34a" /> {feature}
                  </p>
                ))}
              </div>

              <button
  onClick={() => {
    if (plan.name === "Free") {
      router.push("/");
    } else {
      window.location.href = plan.path as string;
    }
  }}
  style={plan.popular ? popularButton : planButton}
>
  {plan.button}
</button>
            </div>
          ))}
        </section>

        <section
          style={{
            ...trustGrid,
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          }}
        >
          <div style={trustCard}>
            <Shield color="#7c3aed" />
            <h3>Secure Processing</h3>
            <p style={mutedSmall}>
              Your content is handled privately and securely.
            </p>
          </div>

          <div style={trustCard}>
            <Crown color="#7c3aed" />
            <h3>Platinum Modes</h3>
            <p style={mutedSmall}>
              Unlock faster and more advanced rewriting modes.
            </p>
          </div>

          <div style={trustCard}>
            <LifeBuoy color="#7c3aed" />
            <h3>Reliable Support</h3>
            <p style={mutedSmall}>
              Get support when you need help with your plan.
            </p>
          </div>
        </section>

        <section style={faqWrapper}>
          <h2 style={sectionTitle}>Frequently Asked Questions</h2>

          {[
            ["Can I cancel anytime?", "Yes. You can cancel your subscription at any time."],
            ["Do unused words roll over?", "No. Monthly word limits reset at the beginning of each billing cycle."],
            ["Is my content private?", "Yes. Your text is processed securely and is not shared publicly."],
            ["Which plan is best?", "Gold is the best option for regular students, creators, and freelancers."],
          ].map(([q, a]) => (
            <div key={q} style={faqBox}>
              <h3>{q}</h3>
              <p style={mutedSmall}>{a}</p>
            </div>
          ))}
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
};

const hero = {
  textAlign: "center" as const,
  marginBottom: "42px",
};

const heroBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "#f3e8ff",
  color: "#7c3aed",
  padding: "9px 15px",
  borderRadius: "999px",
  fontWeight: "bold" as const,
  marginBottom: "18px",
};

const title = {
  fontSize: "48px",
  margin: "0 auto 14px",
  maxWidth: "760px",
  lineHeight: "1.1",
};

const subtitle = {
  color: "#64748b",
  maxWidth: "680px",
  margin: "0 auto 28px",
  fontSize: "17px",
  lineHeight: "1.6",
};

const comingSoon = {
  color: "#7c3aed",
  fontWeight: "bold" as const,
  marginTop: "10px",
};

const toggleWrapper = {
  display: "inline-flex",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "999px",
  padding: "6px",
  gap: "6px",
};

const activeToggle = {
  padding: "10px 24px",
  borderRadius: "999px",
  border: "none",
  background: "#7c3aed",
  color: "white",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const inactiveToggle = {
  ...activeToggle,
  background: "transparent",
  color: "#334155",
};

const saveText = {
  color: "#16a34a",
  fontWeight: "bold" as const,
  marginTop: "14px",
};

const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "22px",
  marginBottom: "34px",
};

const card = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "22px",
  padding: "28px",
  boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
  position: "relative" as const,
};

const popularCard = {
  ...card,
  border: "2px solid #8b5cf6",
  boxShadow: "0 18px 45px rgba(124,58,237,0.18)",
  transform: "translateY(-8px)",
};

const popularBadge = {
  position: "absolute" as const,
  top: "-15px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#7c3aed",
  color: "white",
  padding: "6px 14px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "bold" as const,
};

const planName = {
  marginTop: "12px",
  fontSize: "24px",
};

const price = {
  fontSize: "32px",
  margin: "18px 0",
};

const features = {
  minHeight: "170px",
};

const featureItem = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#334155",
};

const planButton = {
  width: "100%",
  padding: "13px",
  borderRadius: "12px",
  border: "1px solid #e9d5ff",
  background: "#faf5ff",
  color: "#7c3aed",
  fontWeight: "bold" as const,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(124,58,237,0.12)",
};

const popularButton = {
  ...planButton,
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
};

const trustGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginBottom: "36px",
};

const trustCard = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "24px",
  boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
};

const faqWrapper = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "22px",
  padding: "30px",
  boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
};

const sectionTitle = {
  textAlign: "center" as const,
  marginTop: 0,
  marginBottom: "20px",
};

const faqBox = {
  borderTop: "1px solid #e5e7eb",
  padding: "18px 0",
};

const mutedSmall = {
  color: "#64748b",
  fontSize: "14px",
  margin: "4px 0",
  lineHeight: "1.5",
};