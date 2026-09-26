"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/lib/api";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

   useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (
      allowedRoles &&
      !allowedRoles.includes(user.role)
    ) {
      if (user.role === "Employee") {
        router.replace("/dashboard");
      } else if (user.role === "Technician") {
        router.replace("/technician");
      } else if (user.role === "Administrator") {
        router.replace("/admin");
      } else {
        router.replace("/login");
      }

      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [router, allowedRoles?.join(",")]);
  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-3 text-sm text-gray-500">
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}