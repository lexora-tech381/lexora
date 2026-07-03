"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { Mail, Lock, ArrowLeft, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
    }
  }

  return (
    <main style={page}>
      <button onClick={() => router.push("/")} style={backButton}>
        <ArrowLeft size={18} /> Back to Humanizer
      </button>

      <section style={card}>
      <div style={brandRow}>
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
      }}
    >
      ✦
    </span>
  </div>

  <div>
    <h2
      style={{
        margin: 0,
        fontSize: "26px",
        fontWeight: 800,
        color: "#111827",
      }}
    >
      Lexora
    </h2>

    <p
  style={{
    margin: 0,
    fontSize: "13px",
    color: "#7c3aed",
    fontWeight: "bold",
  }}
>
  AI Humanizer
</p>
  </div>
</div>

        <h1 style={title}>Welcome back</h1>
        <p style={subtitle}>Sign in to continue using your Lexora workspace.</p>

        <form onSubmit={handleLogin}>
        <label style={label}>Email Address</label>
        <div style={inputWithIcon}>
          <Mail size={18} color="#64748b" />
          <input
            type="email"
            placeholder="Enter your email"
            style={innerInput}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <label style={label}>Password</label>
        <div style={inputWithIcon}>
          <Lock size={18} color="#64748b" />
          <input
            type="password"
            placeholder="Enter your password"
            style={innerInput}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div style={row}>
          <label style={remember}>
            <input type="checkbox" /> Remember me
          </label>

          <button
  type="button"
  onClick={async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://lexora-ai-smoky.vercel.app/reset-password",
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    alert("Password reset link sent. Please check your email.");
  }}
  style={forgotButton}
>
  Forgot password?
</button>
        </div>

        {error ? <p style={errorText}>{error}</p> : null}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Logging in..." : "Login"}
        </button>
        </form>

        <div style={securityNote}>
          <ShieldCheck size={16} />
          Secure login protected by Lexora
        </div>

        <p style={bottomText}>
          Don't have an account? <a href="/signup" style={link}>Sign Up</a>
        </p>
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

const logoBox = {
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "900" as const,
  fontSize: "22px",
};

const title = {
  textAlign: "center" as const,
  margin: "0 0 10px",
  fontSize: "34px",
};

const subtitle = {
  textAlign: "center" as const,
  color: "#64748b",
  marginBottom: "30px",
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

const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "16px",
  marginBottom: "20px",
};

const remember = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  color: "#64748b",
  fontSize: "14px",
};

const link = {
  color: "#7c3aed",
  textDecoration: "none",
  fontWeight: "bold" as const,
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

const bottomText = {
  textAlign: "center" as const,
  color: "#64748b",
  marginTop: "24px",
};

const errorText = {
  marginTop: "18px",
  marginBottom: 0,
  color: "#dc2626",
  fontSize: "14px",
  textAlign: "center" as const,
};const forgotButton = {
  border: "none",
  background: "transparent",
  color: "#7c3aed",
  textDecoration: "none",
  fontWeight: "bold" as const,
  cursor: "pointer",
  padding: 0,
  fontSize: "14px",
};