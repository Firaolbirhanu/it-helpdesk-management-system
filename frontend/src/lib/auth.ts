import { CurrentUser, UserRole } from "./api";

function decodeJwtPayload(token: string) {
  const payloadPart = token.split(".")[1];

  if (!payloadPart) {
    throw new Error("Invalid token.");
  }

  const base64 = payloadPart
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const paddedBase64 =
    base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  return JSON.parse(atob(paddedBase64));
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("access_token");

  if (!token) {
    return null;
  }

  try {
    const payload = decodeJwtPayload(token);

    const role = payload.role as UserRole;

    if (
      !payload.sub ||
      !role ||
      (typeof payload.exp === "number" && payload.exp <= Date.now() / 1000)
    ) {
      localStorage.removeItem("access_token");
      return null;
    }

    return {
      id: Number(payload.sub),
      role,
    };
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("access_token");
  window.location.href = "/login";
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(localStorage.getItem("access_token"));
}