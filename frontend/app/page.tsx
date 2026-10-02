"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "Administrator") {
      router.replace("/admin/users");
    } else if (user.role === "Technician") {
      router.replace("/technician");
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Checking your session...</p>
    </main>
  );
}
