"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lock, ArrowLeft, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (updateError) {
      setError(
        "This password reset link may have expired. Please request a new one."
      );
      return;
    }

    setMessage("Password updated successfully. You can now log in.");

    setTimeout(() => {
      router.push("/login");
    }, 1800);
  }

  return (
    <main style={page}>
      <button onClick={() => router.push("/login")} style={backButton}>
        <ArrowLeft size={18} /> Back to login
      </button>

      <section style={card}>
        <div style={brandRow}>
          <div style={logoHex}>
            <div style={logoShape} />
          </div>

          <div>
            <h2 style={brandName}>Lexora</h2>
            <p style={brandTagline}>AI Humanizer</p>
          </div>
        </div>

        <h1 style={title}>Create a new password</h1>
        <p style={subtitle}>
          Choose a strong new password for your Lexora account.
        </p>

        <form onSubmit={handleReset}>
          <label style={label}>New Password</label>
          <div style={inputWithIcon}>
            <Lock size={18} color="#64748b" />
            <input
              type="password"
              placeholder="At least 6 characters"
              style={innerInput}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <label style={label}>Confirm New Password</label>
          <div style={inputWithIcon}>
            <Lock size={18} color="#64748b" />
            <input
              type="password"
              placeholder="Repeat your new password"
              style={innerInput}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          {error ? <p style={errorText}>{error}</p> : null}
          {message ? <p style={successText}>{message}</p> : null}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Updating password..." : "Update Password"}
          </button>
        </form>

        <div style={securityNote}>
          <ShieldCheck size={16} />
          Your account is protected by Lexora
        </div>
      </section>
    </main>
  );
}

const page = {
  minHeight: "100vh",
  background: "linear-gradient(135deg,#f8fafc 0%,#faf5ff 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "40px",
  fontFamily: "Arial, sans-serif",
  color: "#0f172a",
  position: "relative" as const,
};

const backButton = {
  position: "absolute" as const,
  top: "30px",
  left: "35px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "transparent",
  border: "none",
  color: "#7c3aed",
  fontWeight: "bold" as const,
  cursor: "pointer",
};

const card = {
  width: "460px",
  background: "#ffffff",
  padding: "42px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 24px 60px rgba(15,23,42,0.10)",
};

const brandRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  marginBottom: "24px",
};

const logoHex = {
  width: "56px",
  height: "56px",
  background: "linear-gradient(135deg,#5b21b6,#c084fc)",
  clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const logoShape = {
  width: "22px",
  height: "30px",
  borderLeft: "8px solid white",
  borderBottom: "8px solid white",
  borderBottomLeftRadius: "10px",
  transform: "translateY(-2px)",
};

const brandName = {
  margin: 0,
  fontSize: "26px",
  fontWeight: 800,
  color: "#111827",
};

const brandTagline = {
  margin: 0,
  fontSize: "13px",
  color: "#7c3aed",
  fontWeight: "bold" as const,
};

const title = {
  textAlign: "center" as const,
  margin: "0 0 10px",
  fontSize: "30px",
};

const subtitle = {
  textAlign: "center" as const,
  color: "#64748b",
  marginBottom: "30px",
  lineHeight: "1.5",
};

const label = {
  display: "block",
  fontWeight: "bold" as const,
  marginBottom: "8px",
  marginTop: "16px",
  color: "#334155",
};

const inputWithIcon = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  border: "1px solid #dbe3ef",
  borderRadius: "13px",
  padding: "0 14px",
  background: "#ffffff",
};

const innerInput = {
  flex: 1,
  padding: "15px 0",
  border: "none",
  outline: "none",
  fontSize: "15px",
};

const buttonStyle = {
  width: "100%",
  padding: "15px",
  borderRadius: "13px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  fontWeight: "bold" as const,
  cursor: "pointer",
  fontSize: "16px",
  marginTop: "24px",
};

const securityNote = {
  marginTop: "18px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "7px",
  color: "#64748b",
  fontSize: "14px",
};

const errorText = {
  marginTop: "18px",
  marginBottom: 0,
  color: "#dc2626",
  fontSize: "14px",
  textAlign: "center" as const,
};

const successText = {
  marginTop: "18px",
  marginBottom: 0,
  color: "#16a34a",
  fontSize: "14px",
  textAlign: "center" as const,
};