"use client";

type FooterProps = {
  onNavigate: (path: string) => void;
};

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer style={footer}>
      <style>{`
        .lexora-footer-link:hover {
          color: #6d28d9;
        }
      `}</style>

      <div style={brandRow}>
        <span style={brand}>Lexora</span>
        <span style={copy}>© 2026 Lexora</span>
      </div>

      <div style={links}>
        <button
          type="button"
          className="lexora-footer-link"
          onClick={() => onNavigate("/privacy")}
          style={footerLink}
        >
          Privacy Policy
        </button>
        <button
          type="button"
          className="lexora-footer-link"
          onClick={() => onNavigate("/terms")}
          style={footerLink}
        >
          Terms of Service
        </button>
        <button
          type="button"
          className="lexora-footer-link"
          onClick={() => onNavigate("/support")}
          style={footerLink}
        >
          Contact Us
        </button>
      </div>
    </footer>
  );
}

const footer = {
  marginTop: "48px",
  padding: "28px 0 8px",
  borderTop: "1px solid #e8eaf0",
  display: "flex",
  flexWrap: "wrap" as const,
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
};

const brandRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const brand = {
  fontWeight: 700 as const,
  color: "#0f172a",
  fontSize: "14px",
};

const copy = {
  color: "#94a3b8",
  fontSize: "13px",
};

const links = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px 18px",
};

const footerLink = {
  border: "none",
  background: "transparent",
  color: "#64748b",
  fontSize: "13px",
  cursor: "pointer",
  padding: 0,
  fontWeight: 500 as const,
  transition: "color 0.15s ease",
};
