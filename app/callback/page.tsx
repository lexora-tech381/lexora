"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function completeSignup() {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        router.replace("/login");
        return;
      }

      router.replace("/dashboard");
    }

    completeSignup();
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      Confirming your account...
    </main>
  );
}