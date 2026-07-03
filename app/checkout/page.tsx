"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CreditCard, ShieldCheck, ArrowLeft } from "lucide-react";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px" }}>Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan") || "gold";
  const billing = searchParams.get("billing") || "monthly";

  const prices: any = {
    silver: billing === "yearly" ? "$29/year" : "$2.99/month",
    gold: billing === "yearly" ? "$99/year" : "$9.99/month",
    premium: billing === "yearly" ? "$189/year" : "$19.99/month",
  };

  const words: any = {
    silver: "10,000 words/month",
    gold: "30,000 words/month",
    premium: "60,000 words/month",
  };

  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <main style={page}>
      <button onClick={() => router.push("/pricing")} style={backButton}>
        <ArrowLeft size={18} /> Back to pricing
      </button>

      <section style={checkoutCard}>
        <div style={brandRow}>
          <div style={logoHex}>
            <div style={logoShape} />
          </div>
          <h2 style={brandName}>Lexora</h2>
        </div>

        <div style={header}>
          <span style={secureBadge}>
            <Lock size={16} /> Secure Checkout
          </span>
          <h1 style={title}>Complete your subscription</h1>
          <p style={subtitle}>Review your plan and enter your payment details.</p>
        </div>

        <div style={planBox}>
          <div>
            <p style={muted}>Selected Plan</p>
            <h2 style={{ margin: "5px 0" }}>{planName} Plan</h2>
            <p style={muted}>{words[plan]}</p>
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={muted}>Billing</p>
            <h2 style={{ margin: "5px 0" }}>{prices[plan]}</h2>
            <p style={muted}>
              {billing === "yearly" ? "Yearly billing" : "Monthly billing"}
            </p>
          </div>
        </div>

        <div style={summaryBox}>
          <div style={summaryRow}><span>Plan</span><b>{planName}</b></div>
          <div style={summaryRow}><span>Billing</span><b>{billing === "yearly" ? "Yearly" : "Monthly"}</b></div>
          <div style={summaryRow}><span>Total</span><b>{prices[plan]}</b></div>
        </div>

        <form style={form}>
          <label style={label}>Cardholder Name</label>
          <input style={input} placeholder="Enter cardholder name" />

          <label style={label}>Card Number</label>
          <div style={inputWithIcon}>
            <CreditCard size={18} color="#64748b" />
            <input style={innerInput} placeholder="1234 5678 9012 3456" />
          </div>

          <div style={twoColumns}>
            <div>
              <label style={label}>Expiry Date</label>
              <input style={input} placeholder="MM/YY" />
            </div>

            <div>
              <label style={label}>CVV</label>
              <input style={input} placeholder="123" />
            </div>
          </div>

          <div style={securityRow}>
            <span><Lock size={15} /> SSL encrypted</span>
            <span><ShieldCheck size={15} /> Privacy protected</span>
            <span><CreditCard size={15} /> Cards accepted</span>
          </div>

          <button type="button" style={payButton}>Pay Now</button>

          <p style={safeNote}>
            ✓ Cancel anytime · ✓ No hidden fees · ✓ Secure payment processing
          </p>
        </form>
      </section>
    </main>
  );
}

const page = { minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "Arial, sans-serif", padding: "45px 20px" };
const backButton = { display: "flex", alignItems: "center", gap: "8px", margin: "0 auto 22px", maxWidth: "820px", background: "transparent", border: "none", color: "#7c3aed", fontWeight: "bold" as const, cursor: "pointer", fontSize: "15px" };
const checkoutCard = { maxWidth: "820px", margin: "0 auto", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "24px", padding: "34px", boxShadow: "0 20px 50px rgba(15,23,42,0.08)" };
const brandRow = { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" };
const logoHex = { width: "56px", height: "56px", background: "linear-gradient(135deg,#5b21b6,#c084fc)", clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)", display: "flex", alignItems: "center", justifyContent: "center" };
const logoShape = { width: "22px", height: "30px", borderLeft: "8px solid white", borderBottom: "8px solid white", borderBottomLeftRadius: "10px", transform: "translateY(-2px)" };
const brandName = { margin: 0, fontSize: "26px", fontWeight: 800, color: "#111827" };
const header = { textAlign: "center" as const, marginBottom: "28px" };
const secureBadge = { display: "inline-flex", alignItems: "center", gap: "7px", background: "#f3e8ff", color: "#7c3aed", padding: "8px 14px", borderRadius: "999px", fontWeight: "bold" as const, marginBottom: "12px" };
const title = { margin: "8px 0", fontSize: "34px" };
const subtitle = { color: "#64748b", margin: 0 };
const planBox = { display: "flex", justifyContent: "space-between", gap: "20px", background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: "18px", padding: "22px", marginBottom: "22px" };
const summaryBox = { border: "1px solid #e5e7eb", borderRadius: "16px", padding: "18px", marginBottom: "24px" };
const summaryRow = { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" };
const form = { display: "grid", gap: "12px" };
const label = { fontWeight: "bold" as const, color: "#334155", marginTop: "6px" };
const input = { width: "100%", padding: "15px", borderRadius: "13px", border: "1px solid #dbe3ef", outline: "none", fontSize: "15px", boxSizing: "border-box" as const };
const inputWithIcon = { display: "flex", alignItems: "center", gap: "10px", padding: "0 15px", borderRadius: "13px", border: "1px solid #dbe3ef" };
const innerInput = { flex: 1, padding: "15px 0", border: "none", outline: "none", fontSize: "15px" };
const twoColumns = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" };
const securityRow = { display: "flex", justifyContent: "space-between", gap: "10px", color: "#64748b", fontSize: "14px", marginTop: "8px", flexWrap: "wrap" as const };
const payButton = { marginTop: "12px", height: "56px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg,#8b5cf6,#7c3aed)", color: "white", fontSize: "18px", fontWeight: "bold" as const, cursor: "pointer" };
const safeNote = { textAlign: "center" as const, color: "#64748b", fontSize: "14px" };
const muted = { color: "#64748b", margin: 0 };