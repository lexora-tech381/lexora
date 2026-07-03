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
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    const loadDocuments = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Documents load error:", error);
      } else {
        setDocuments(data || []);
      }

      setLoading(false);
    };

    loadDocuments();
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

  const deleteDocument = async (id: string) => {
    const confirmDelete = confirm("Delete this document?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("documents").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const viewDocument = (doc: any) => {
    alert(doc.humanized_text || "No content found.");
  };

  const downloadDocument = (doc: any) => {
    const content = doc.humanized_text || "";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "lexora-document.txt";
    a.click();

    URL.revokeObjectURL(url);
  };

  const renameDocument = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Enter new document name:", currentTitle);
    if (!newTitle || !newTitle.trim()) return;

    const { error } = await supabase
      .from("documents")
      .update({ title: newTitle.trim() })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, title: newTitle.trim() } : doc
      )
    );
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
          <button style={activeNav}>
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
          <button onClick={() => router.push("/support")} style={navItem}>
            <LifeBuoy size={18} /> Support
          </button>
        </nav>

        <div style={upgradeBox}>
          <Crown size={22} color="#7c3aed" />
          <h3>Upgrade to Pro</h3>
          <p style={mutedSmall}>
            Save unlimited documents and unlock premium modes.
          </p>
          <button onClick={() => router.push("/pricing")} style={upgradeButton}>
            Upgrade Now →
          </button>
        </div>
      </aside>

      <section
        style={{
          ...content,
          padding: isMobile ? "88px 14px 24px" : "50px 36px",
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
    <button
      onClick={() => router.push("/settings")}
      style={avatarButton}
    >
      {(user.user_metadata?.full_name?.[0] ||
        user.email?.[0] ||
        "U").toUpperCase()}
    </button>
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

        <div style={pageHeader}>
          <div>
            <h1 style={{ ...title, fontSize: isMobile ? "34px" : "38px" }}>
              Documents
            </h1>
            <p style={subtitle}>
              Manage, review, and reuse your humanized content.
            </p>
          </div>

          {!isMobile && (
            <button onClick={() => router.push("/")} style={newButton}>
              <Plus size={18} />
              New Document
            </button>
          )}
        </div>

        <section
          style={{
            ...summaryGrid,
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          }}
        >
          <div style={summaryCard}>
            <FileText color="#7c3aed" />
            <p>Total Documents</p>
            <h2>{documents.length}</h2>
          </div>

          <div style={summaryCard}>
            <BarChart3 color="#16a34a" />
            <p>Total Words</p>
            <h2>
              {documents.reduce(
                (total, doc) =>
                  total + (doc.humanized_text?.trim().split(/\s+/).length || 0),
                0
              )}
            </h2>
          </div>

          <div style={summaryCard}>
            <PenSquare color="#f59e0b" />
            <p>Saved This Week</p>
            <h2>{documents.length}</h2>
          </div>
        </section>

        <div
          style={{
            ...toolbar,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
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

        <section
          style={{
            ...documentsCard,
            overflow: isMobile ? "visible" : "hidden",
          }}
        >
          <div
            style={{
              ...tableHeader,
              display: isMobile ? "none" : "grid",
            }}
          >
            <span>Document</span>
            <span>Mode</span>
            <span>Words</span>
            <span>Date</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div style={{ padding: "24px" }}>Loading documents...</div>
          ) : documents.length === 0 ? (
            <div style={{ padding: "24px" }}>No documents saved yet.</div>
          ) : (
            documents.map((doc, index) => (
              <div
                key={index}
                style={{
                  ...docRow,
                  display: isMobile ? "block" : "grid",
                  padding: isMobile ? "18px" : "18px 24px",
                  borderRadius: isMobile ? "18px" : "0",
                  marginBottom: isMobile ? "14px" : "0",
                }}
              >
                <div style={docTitle}>
                  <div style={docIcon}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <b>
                      {doc.title ||
                        doc.original_text?.slice(0, 35) ||
                        "Humanized Document"}
                    </b>
                    <p style={mutedSmall}>Humanized document</p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: isMobile ? "12px" : "0",
                  }}
                >
                  <span style={modeBadge}>Natural</span>
                  <span style={mutedSmall}>
                    {doc.humanized_text?.trim().split(/\s+/).length || 0} words
                  </span>
                  <span style={mutedSmall}>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>

                {!isMobile && (
                  <button
                    onClick={() =>
                      renameDocument(doc.id, doc.title || "Humanized Document")
                    }
                    style={iconButton}
                  >
                    Rename
                  </button>
                )}

                <div
                  style={{
                    ...actions,
                    marginTop: isMobile ? "14px" : "0",
                  }}
                >
                  <button onClick={() => viewDocument(doc)} style={iconButton}>
                    <Eye size={17} />
                  </button>

                  <button onClick={() => downloadDocument(doc)} style={iconButton}>
                    <Download size={17} />
                  </button>

                  <button onClick={() => deleteDocument(doc.id)} style={deleteButton}>
                    <Trash2 size={17} />
                  </button>

                  <MoreVertical size={18} />
                </div>
              </div>
            ))
          )}
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

const content = {
  flex: 1,
  maxWidth: "1250px",
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box" as const,
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
};

const brandIcon = {
  width: "38px",
  height: "38px",
  background: "linear-gradient(135deg,#5b21b6,#c084fc)",
  clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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

const pageHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "28px",
};

const title = { fontSize: "38px", margin: 0 };
const subtitle = { color: "#64748b", marginTop: "8px", lineHeight: "1.5" };

const newButton = {
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

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginBottom: "24px",
};

const summaryCard = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  padding: "24px",
  boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
};

const toolbar = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "22px",
};

const searchBox = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "0 16px",
};

const searchInput = {
  flex: 1,
  padding: "14px 0",
  border: "none",
  outline: "none",
  fontSize: "15px",
};

const filterSelect = {
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
  background: "#fff",
  width: "100%",
};

const documentsCard = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  padding: "18px 24px",
  background: "#f8fafc",
  color: "#64748b",
  fontWeight: "bold" as const,
};

const docRow = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  alignItems: "center",
  padding: "18px 24px",
  borderTop: "1px solid #e5e7eb",
  background: "#ffffff",
};

const docTitle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const docIcon = {
  width: "42px",
  height: "42px",
  borderRadius: "12px",
  background: "#f3e8ff",
  color: "#7c3aed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modeBadge = {
  background: "#f3e8ff",
  color: "#7c3aed",
  padding: "7px 11px",
  borderRadius: "999px",
  fontWeight: "bold" as const,
  width: "fit-content",
};

const actions = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const iconButton = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: "9px",
  padding: "7px",
  cursor: "pointer",
};

const deleteButton = { ...iconButton, color: "#ef4444" };

const mutedSmall = {
  color: "#64748b",
  fontSize: "14px",
  margin: "4px 0",
};
const avatarButton = {
  width: "40px",
  height: "40px",
  borderRadius: "999px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "#fff",
  fontWeight: "bold" as const,
  fontSize: "16px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};