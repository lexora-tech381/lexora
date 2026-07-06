"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://lexorahumanizer.com/auth/callback",
        data: {
          full_name: fullName,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      return;
    }

    setSuccessMessage(
      "Account created. Check your email to confirm your account before signing in.",
    );
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

    <p style={headerSub}>AI Humanizer</p>
  </div>
</div>

        <h1 style={title}>Create your account</h1>
        <p style={subtitle}>
          Join Lexora AI and start humanizing your content in seconds.
        </p>

        <form onSubmit={handleSignUp}>
        <label style={label}>Full Name</label>
        <div style={inputWithIcon}>
          <User size={18} color="#64748b" />
          <input
            placeholder="Enter your full name"
            style={innerInput}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </div>

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
            placeholder="Create a password"
            style={innerInput}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <label style={label}>Confirm Password</label>
        <div style={inputWithIcon}>
          <Lock size={18} color="#64748b" />
          <input
            type="password"
            placeholder="Confirm your password"
            style={innerInput}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        <label style={terms}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
          />
          I agree to the Terms of Service and Privacy Policy.
        </label>

        {error ? <p style={errorText}>{error}</p> : null}
        {successMessage ? <p style={successText}>{successMessage}</p> : null}

        <button
          type="submit"
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
        </form>

        <div style={securityNote}>
          <ShieldCheck size={16} />
          Your information is encrypted and secure.
        </div>

        <p style={bottomText}>
          Already have an account?{" "}
          <button
  onClick={() => router.push("/login")}
  style={{
    ...link,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  }}
>
  Login
</button>
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
  width: "470px",
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

const title = {
  textAlign: "center" as const,
  margin: "0 0 10px",
  fontSize: "34px",
};

const subtitle = {
  textAlign: "center" as const,
  color: "#64748b",
  marginBottom: "28px",
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

const terms = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "18px",
  color: "#64748b",
  fontSize: "14px",
};

const buttonStyle = {
  width: "100%",
  padding: "15px",
  marginTop: "22px",
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

const link = {
  color: "#7c3aed",
  textDecoration: "none",
  fontWeight: "bold" as const,
};

const headerSub = {
  margin: 0,
  fontSize: "13px",
  color: "#7c3aed",
  fontWeight: "bold" as const,
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
  color: "#059669",
  fontSize: "14px",
  textAlign: "center" as const,
};
