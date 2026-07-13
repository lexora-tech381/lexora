"use client";

import {
  LayoutDashboard,
  PenSquare,
  FileText,
  BarChart3,
  CreditCard,
  Settings,
  LifeBuoy,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

type SidebarProps = {
  isMobile: boolean;
  onNavigate: (path: string) => void;
};

const NAV_ITEMS = [
  { label: "Humanizer", path: "/", icon: PenSquare, active: true },
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Documents", path: "/documents", icon: FileText },
  { label: "Usage", path: "/usage", icon: BarChart3 },
  { label: "Pricing", path: "/pricing", icon: CreditCard },
  { label: "Settings", path: "/settings", icon: Settings },
  { label: "Support", path: "/support", icon: LifeBuoy },
] as const;

export default function Sidebar({ isMobile, onNavigate }: SidebarProps) {
  return (
    <aside
      style={{
        ...sidebar,
        display: isMobile ? "none" : "flex",
      }}
    >
      <style>{`
        .lexora-nav-item:hover:not(.lexora-nav-active) {
          background: #f8fafc;
          color: #0f172a;
        }
        .lexora-upgrade-btn:hover {
          filter: brightness(1.06);
          transform: translateY(-1px);
        }
      `}</style>

      <div>
        <div style={{ marginBottom: "28px", paddingLeft: "4px" }}>
          <BrandLogo />
        </div>

        <nav style={nav}>
          {NAV_ITEMS.map(({ label, path, icon: Icon, ...rest }) => {
            const isActive = "active" in rest && rest.active;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (!isActive) onNavigate(path);
                }}
                className={`lexora-nav-item${isActive ? " lexora-nav-active" : ""}`}
                style={isActive ? activeNav : navItem}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div style={upgradeBox}>
        <p style={upgradeEyebrow}>Pro</p>
        <h3 style={upgradeTitle}>Unlock unlimited rewriting</h3>
        <p style={mutedSmall}>
          More words, faster modes, and priority support.
        </p>
        <button
          type="button"
          className="lexora-upgrade-btn"
          onClick={() => onNavigate("/pricing")}
          style={purpleButtonSmall}
        >
          Upgrade
        </button>
      </div>
    </aside>
  );
}

const sidebar = {
  width: "248px",
  minWidth: "248px",
  background: "#ffffff",
  borderRight: "1px solid #e8eaf0",
  padding: "22px 16px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  height: "100vh",
  position: "sticky" as const,
  top: 0,
  boxSizing: "border-box" as const,
};

const nav = {
  display: "grid",
  gap: "4px",
};

const activeNav = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  textAlign: "left" as const,
  padding: "11px 12px",
  borderRadius: "10px",
  border: "none",
  background: "#f3e8ff",
  color: "#6d28d9",
  fontWeight: 600 as const,
  cursor: "default",
  fontSize: "14px",
  width: "100%",
  transition: "background 0.15s ease, color 0.15s ease",
};

const navItem = {
  ...activeNav,
  background: "transparent",
  color: "#64748b",
  fontWeight: 500 as const,
  cursor: "pointer",
};

const upgradeBox = {
  marginTop: "auto",
  background: "linear-gradient(160deg, #faf5ff 0%, #f5f3ff 100%)",
  border: "1px solid #e9d5ff",
  borderRadius: "14px",
  padding: "16px",
};

const upgradeEyebrow = {
  margin: "0 0 6px",
  fontSize: "11px",
  fontWeight: 700 as const,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "#7c3aed",
};

const upgradeTitle = {
  margin: "0 0 6px",
  fontSize: "15px",
  fontWeight: 700 as const,
  color: "#0f172a",
  lineHeight: 1.3,
};

const mutedSmall = {
  color: "#64748b",
  lineHeight: 1.45,
  fontSize: "13px",
  margin: "0 0 14px",
};

const purpleButtonSmall = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: 600 as const,
  cursor: "pointer",
  width: "100%",
  fontSize: "14px",
  transition: "filter 0.15s ease, transform 0.15s ease",
};
