"use client";

type HumanizerToolProps = {
  isMobile: boolean;
  text: string;
  result: string;
  mode: string;
  tone: string;
  loading: boolean;
  copied: boolean;
  errorMessage: string | null;
  remaining: number;
  wordCount: number;
  charCount: number;
  resultWords: number;
  resultChars: number;
  onTextChange: (value: string) => void;
  onModeChange: (mode: string) => void;
  onToneChange: (tone: string) => void;
  onHumanize: () => void;
  onClear: () => void;
  onCopy: () => void;
  onSave: () => void;
};

const MODES = ["Free", "Fast", "Creative", "Enhanced"] as const;
const TONES = ["Natural", "Academic", "Professional", "Friendly"] as const;

export default function HumanizerTool({
  isMobile,
  text,
  result,
  mode,
  tone,
  loading,
  copied,
  errorMessage,
  remaining,
  wordCount,
  charCount,
  resultWords,
  resultChars,
  onTextChange,
  onModeChange,
  onToneChange,
  onHumanize,
  onClear,
  onCopy,
  onSave,
}: HumanizerToolProps) {
  const editorHeight = isMobile ? 260 : 330;

  return (
    <section style={{ ...toolCard, padding: isMobile ? "16px" : "22px" }}>
      <style>{`
        .lexora-seg-btn:hover:not(.lexora-seg-active) {
          color: #0f172a;
          background: rgba(255,255,255,0.7);
        }
        .lexora-mini-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .lexora-primary-btn:hover:not(:disabled) {
          filter: brightness(1.06);
          transform: translateY(-1px);
        }
        .lexora-primary-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }
        .lexora-dark-btn:hover {
          background: #1e293b;
        }
        .lexora-ghost-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .lexora-editor:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
        }
        @keyframes lexora-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        .lexora-loading-label {
          animation: lexora-pulse 1.2s ease-in-out infinite;
        }
      `}</style>

      <div
        style={{
          ...controlsRow,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "flex-end",
          gap: isMobile ? "16px" : "20px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={label}>Rewrite mode</p>
          <div
            role="tablist"
            aria-label="Rewrite mode"
            style={{
              ...segmented,
              overflowX: isMobile ? "auto" : "visible",
            }}
          >
            {MODES.map((item) => {
              const isActive = mode === item;
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`lexora-seg-btn${isActive ? " lexora-seg-active" : ""}`}
                  onClick={() => onModeChange(item)}
                  style={isActive ? segmentActive : segmentIdle}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ width: isMobile ? "100%" : "auto", minWidth: isMobile ? 0 : "280px" }}>
          <p style={label}>Tone</p>
          <div
            role="tablist"
            aria-label="Tone"
            style={{
              ...segmented,
              overflowX: isMobile ? "auto" : "visible",
            }}
          >
            {TONES.map((item) => {
              const isActive = tone === item;
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`lexora-seg-btn${isActive ? " lexora-seg-active" : ""}`}
                  onClick={() => onToneChange(item)}
                  style={isActive ? segmentActive : segmentIdle}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          ...statusRow,
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          gap: isMobile ? "8px" : "12px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <span style={statusMuted}>Free plan</span>
          <span style={freePill}>{remaining} uses left today</span>
        </div>
        <span style={{ ...secure, marginLeft: isMobile ? 0 : "auto" }}>
          Secure & private
        </span>
      </div>

      <div
        style={{
          ...panels,
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? "14px" : "16px",
        }}
      >
        <div style={panel}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>Your AI text</h3>
            <button type="button" className="lexora-mini-btn" onClick={onClear} style={miniButton}>
              Clear
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste your AI-generated text here..."
            className="lexora-editor"
            style={{ ...textarea, height: editorHeight }}
          />

          <p style={counter}>
            {wordCount} words · {charCount} characters
          </p>
        </div>

        <div style={panel}>
          <div style={panelHeader}>
            <h3 style={panelTitle}>Humanized result</h3>
            <button type="button" className="lexora-mini-btn" onClick={onCopy} style={miniButton}>
              Copy
            </button>
          </div>

          <div
            style={{
              ...resultBox,
              height: editorHeight,
              color: result ? "#0f172a" : "#94a3b8",
            }}
            aria-live="polite"
          >
            {loading ? (
              <span className="lexora-loading-label">Humanizing your text…</span>
            ) : (
              result || "Your humanized text will appear here…"
            )}
          </div>

          <p style={counter}>
            {resultWords} words · {resultChars} characters
          </p>
        </div>
      </div>

      <div
        style={{
          ...mainActionRow,
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "10px" : "12px",
        }}
      >
        <button
          type="button"
          className="lexora-primary-btn"
          onClick={onHumanize}
          disabled={loading}
          style={{
            ...humanizeButton,
            flex: isMobile ? undefined : 1.2,
            minHeight: isMobile ? "48px" : "44px",
          }}
        >
          {loading ? "Humanizing…" : "Humanize text"}
        </button>

        <button
          type="button"
          className="lexora-dark-btn"
          onClick={onCopy}
          style={{
            ...copyButton,
            flex: 1,
            minHeight: isMobile ? "48px" : "44px",
          }}
        >
          Copy result
        </button>

        <button
          type="button"
          className="lexora-ghost-btn"
          onClick={onSave}
          style={{
            ...saveButton,
            flex: 1,
            minHeight: isMobile ? "48px" : "44px",
          }}
        >
          Save document
        </button>
      </div>

      {copied && <p style={copiedText}>Copied to clipboard</p>}
      {errorMessage ? <p style={errorText} role="alert">{errorMessage}</p> : null}
    </section>
  );
}

const toolCard = {
  background: "#ffffff",
  border: "1px solid #e8eaf0",
  borderRadius: "18px",
  boxShadow: "0 10px 40px rgba(15, 23, 42, 0.05)",
};

const controlsRow = {
  display: "flex",
  paddingBottom: "18px",
  borderBottom: "1px solid #f1f5f9",
};

const label = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 700 as const,
  margin: "0 0 8px",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

const segmented = {
  display: "flex",
  gap: "2px",
  padding: "4px",
  background: "#f1f5f9",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  width: "100%",
  boxSizing: "border-box" as const,
};

const segmentIdle = {
  flex: 1,
  padding: "9px 10px",
  borderRadius: "9px",
  border: "none",
  background: "transparent",
  color: "#64748b",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "13px",
  whiteSpace: "nowrap" as const,
  transition: "background 0.15s ease, color 0.15s ease",
};

const segmentActive = {
  ...segmentIdle,
  background: "#ffffff",
  color: "#6d28d9",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
};

const statusRow = {
  display: "flex",
  margin: "14px 0 16px",
};

const statusMuted = {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 500 as const,
};

const freePill = {
  background: "#f3e8ff",
  color: "#6d28d9",
  padding: "5px 10px",
  borderRadius: "999px",
  fontWeight: 600 as const,
  fontSize: "12px",
};

const secure = {
  color: "#059669",
  fontWeight: 600 as const,
  fontSize: "13px",
};

const panels = {
  display: "grid",
};

const panel = {
  border: "1px solid #e8eaf0",
  borderRadius: "14px",
  padding: "14px",
  background: "#fafbfc",
};

const panelHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
  gap: "8px",
};

const panelTitle = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700 as const,
  color: "#0f172a",
};

const miniButton = {
  padding: "6px 11px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontWeight: 600 as const,
  fontSize: "12px",
  transition: "background 0.15s ease, border-color 0.15s ease",
};

const textarea = {
  width: "100%",
  border: "1.5px solid #ddd6fe",
  borderRadius: "12px",
  padding: "14px",
  fontSize: "15px",
  lineHeight: 1.55,
  color: "#0f172a",
  background: "#ffffff",
  resize: "none" as const,
  outline: "none",
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

const resultBox = {
  overflowY: "auto" as const,
  border: "1.5px solid #ddd6fe",
  borderRadius: "12px",
  padding: "14px",
  fontSize: "15px",
  lineHeight: 1.55,
  background: "#ffffff",
  whiteSpace: "pre-wrap" as const,
  boxSizing: "border-box" as const,
};

const counter = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: "8px 0 0",
};

const mainActionRow = {
  display: "flex",
  justifyContent: "center",
  marginTop: "18px",
  paddingTop: "18px",
  borderTop: "1px solid #f1f5f9",
};

const humanizeButton = {
  padding: "12px 20px",
  borderRadius: "11px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: 700 as const,
  cursor: "pointer",
  fontSize: "14px",
  transition: "filter 0.15s ease, transform 0.15s ease, opacity 0.15s ease",
};

const copyButton = {
  padding: "12px 20px",
  borderRadius: "11px",
  border: "none",
  background: "#0f172a",
  color: "white",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "14px",
  transition: "background 0.15s ease",
};

const saveButton = {
  padding: "12px 20px",
  borderRadius: "11px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 600 as const,
  cursor: "pointer",
  fontSize: "14px",
  transition: "background 0.15s ease, border-color 0.15s ease",
};

const copiedText = {
  color: "#16a34a",
  textAlign: "center" as const,
  marginTop: "12px",
  fontSize: "13px",
  fontWeight: 600 as const,
};

const errorText = {
  color: "#dc2626",
  textAlign: "center" as const,
  marginTop: "12px",
  fontSize: "13px",
  fontWeight: 500 as const,
};
