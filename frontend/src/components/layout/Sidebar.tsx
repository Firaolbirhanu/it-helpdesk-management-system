"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Settings,
  LogOut,
  Headphones,
  Users,
  ScrollText,
} from "lucide-react";

import { getCurrentUser, logout } from "@/lib/auth";
import { CurrentUser } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NavigationItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const employeeNavigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "My Tickets",
    href: "/tickets",
    icon: Ticket,
  },
  {
    name: "Create Ticket",
    href: "/tickets/create",
    icon: PlusCircle,
  },
];

const technicianNavigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/technician",
    icon: LayoutDashboard,
  },
];

const administratorNavigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "All Tickets",
    href: "/admin/tickets",
    icon: Ticket,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Audit Log",
    href: "/admin/audit-logs",
    icon: ScrollText,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  let navigation: NavigationItem[] = employeeNavigation;

  if (currentUser?.role === "Technician") {
    navigation = technicianNavigation;
  }

  if (currentUser?.role === "Administrator") {
    navigation = administratorNavigation;
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">

      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
          <Headphones size={21} className="text-white" />
        </div>

        <div>
          <h1 className="text-sm font-bold text-gray-900">
            IT Help Desk
          </h1>

          <p className="text-[11px] text-gray-500">
            Support Management
          </p>
        </div>
      </div>

      {/* User Role */}
      <div className="border-b border-gray-100 px-6 py-4">
        <p className="text-xs text-gray-400">
          Signed in as
        </p>

        <p className="mt-1 text-sm font-semibold text-gray-800">
          {currentUser?.role ?? "Loading..."}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Menu
        </p>

        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={19} />

              <span>{item.name}</span>
            </Link>
          );
        })}

        <div className="my-6 border-t border-gray-100" />

        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          System
        </p>

        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            pathname.startsWith("/settings")
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <Settings size={19} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100 p-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}