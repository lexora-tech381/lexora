"use client";

import type { Session } from "@supabase/supabase-js";
import BrandLogo from "@/components/BrandLogo";

type HeaderProps = {
  isMobile: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onNavigate: (path: string) => void;
  session: Session | null;
  uses: number;
  getUserInitial: (user: Session["user"]) => string;
};

const MOBILE_LINKS = [
  { label: "Humanizer", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Documents", path: "/documents" },
  { label: "Usage", path: "/usage" },
  { label: "Pricing", path: "/pricing" },
  { label: "Settings", path: "/settings" },
  { label: "Support", path: "/support" },
] as const;

export default function Header({
  isMobile,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onNavigate,
  session,
  uses,
  getUserInitial,
}: HeaderProps) {
  return (
    <>
      <style>{`
        .lexora-header-btn:hover {
          background: #f1f5f9;
        }
        .lexora-header-cta:hover {
          filter: brightness(1.06);
        }
        .lexora-mobile-item:hover {
          background: #f3e8ff;
          color: #6d28d9;
        }
      `}</style>

      <header
        style={{
          ...topbar,
          left: isMobile ? 0 : "248px",
          padding: isMobile ? "12px 16px" : "12px 28px",
        }}
      >
        <div style={topRow}>
          {isMobile ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={onToggleMenu}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                style={menuButton}
              >
                {menuOpen ? "✕" : "☰"}
              </button>
              <BrandLogo size="sm" />
            </div>
          ) : (
            <div style={metaGroup}>
              <span style={planBadge}>Free Plan</span>
              <span style={usageBadge}>
                <span style={usageCount}>{uses}</span> / 10 uses today
              </span>
            </div>
          )}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            {isMobile && (
              <span style={usageBadgeCompact}>{uses}/10</span>
            )}
            {session ? (
              <div style={avatar} title="Account">
                {getUserInitial(session.user)}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="lexora-header-btn"
                  onClick={() => onNavigate("/login")}
                  style={smallButton}
                >
                  Login
                </button>
                <button
                  type="button"
                  className="lexora-header-cta"
                  onClick={() => onNavigate("/signup")}
                  style={purpleSmall}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {isMobile && menuOpen && (
        <nav style={mobileMenu} aria-label="Mobile navigation">
          {MOBILE_LINKS.map(({ label, path }) => (
            <button
              key={path}
              type="button"
              className="lexora-mobile-item"
              onClick={() => {
                onCloseMenu();
                onNavigate(path);
              }}
              style={mobileMenuItem}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}

const topbar = {
  position: "fixed" as const,
  top: 0,
  right: 0,
  zIndex: 9999,
  background: "rgba(248, 250, 252, 0.92)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid #e8eaf0",
  pointerEvents: "auto" as const,
};

const topRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  minHeight: "44px",
};

const metaGroup = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const planBadge = {
  background: "#f5f3ff",
  color: "#5b21b6",
  padding: "6px 11px",
  borderRadius: "999px",
  fontWeight: 600 as const,
  fontSize: "12px",
  letterSpacing: "0.02em",
  whiteSpace: "nowrap" as const,
};

const usageBadge = {
  color: "#64748b",
  fontWeight: 500 as const,
  fontSize: "13px",
  whiteSpace: "nowrap" as const,
};

const usageCount = {
  color: "#0f172a",
  fontWeight: 700 as const,
};

const usageBadgeCompact = {
  background: "#f1f5f9",
  color: "#334155",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 600 as const,
};

const smallButton = {
  padding: "8px 14px",
  borderRadius: "9px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "13px",
  transition: "background 0.15s ease",
};

const purpleSmall = {
  padding: "8px 14px",
  borderRadius: "9px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "13px",
  transition: "filter 0.15s ease",
};

const avatar = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700 as const,
  fontSize: "14px",
};

const menuButton = {
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  fontSize: "18px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#0f172a",
};

const mobileMenu = {
  position: "fixed" as const,
  top: "68px",
  left: "12px",
  right: "12px",
  zIndex: 99999,
  background: "#ffffff",
  border: "1px solid #e8eaf0",
  borderRadius: "16px",
  padding: "10px",
  display: "grid",
  gap: "4px",
  boxShadow: "0 20px 50px rgba(15,23,42,0.14)",
};

const mobileMenuItem = {
  padding: "14px 14px",
  borderRadius: "10px",
  border: "none",
  background: "transparent",
  color: "#334155",
  fontWeight: 600 as const,
  textAlign: "left" as const,
  cursor: "pointer",
  fontSize: "15px",
  transition: "background 0.15s ease, color 0.15s ease",
};
