"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("shieldflow_token");
    router.push(token ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
