"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { refreshAccessToken, UserRole } from "@/lib/api";

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
  const [authError, setAuthError] = useState("");
  const allowedRolesKey = allowedRoles?.join(",") ?? "";

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      let user = getCurrentUser();

      if (!user) {
        try {
          const refreshedToken = await refreshAccessToken();

          if (refreshedToken) {
            user = getCurrentUser();
          }
        } catch (error) {
          if (active) {
            setAuthError(
              error instanceof Error
                ? error.message
                : "Unable to verify your session."
            );
            setChecking(false);
          }
          return;
        }
      }

      if (!active) {
        return;
      }

      if (!user) {
        router.replace("/login");
        setChecking(false);
        return;
      }

      const allowedRolesList = allowedRolesKey
        ? allowedRolesKey.split(",")
        : [];

      if (allowedRolesList.length > 0 && !allowedRolesList.includes(user.role)) {
        setAuthorized(false);
        setChecking(false);

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
    }

    void checkAccess();

    return () => {
      active = false;
    };
  }, [router, allowedRolesKey]);

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-sm text-red-700">{authError}</p>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

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