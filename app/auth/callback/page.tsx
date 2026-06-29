"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#7c3aed" }}>Email confirmed</h1>
        <p style={{ color: "#64748b" }}>
          Your account has been confirmed. Redirecting to dashboard...
        </p>
      </div>
    </main>
  );
}