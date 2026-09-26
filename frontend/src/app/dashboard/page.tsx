"use client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Ticket as TicketIcon,
  TrendingUp,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getMyTickets, Ticket } from "@/lib/api";

const statsConfig = [
  {
    title: "Open Tickets",
    description: "Tickets waiting for support",
    icon: TicketIcon,
  },
  {
    title: "In Progress",
    description: "Currently being handled",
    icon: Clock3,
  },
  {
    title: "Resolved",
    description: "Successfully resolved",
    icon: CheckCircle2,
  },
  {
    title: "Resolution Rate",
    description: "Tickets resolved or closed",
    icon: TrendingUp,
  },
];

function getStatusStyle(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-blue-50 text-blue-700";

    case "ASSIGNED":
      return "bg-purple-50 text-purple-700";

    case "IN_PROGRESS":
      return "bg-yellow-50 text-yellow-700";

    case "RESOLVED":
      return "bg-green-50 text-green-700";

    case "CLOSED":
      return "bg-gray-100 text-gray-700";

    default:
      return "bg-gray-100 text-gray-600";
  }
}

function formatStatus(status: string) {
  return status.replace("_", " ");
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true);
        setError("");

        const data = await getMyTickets();

        setTickets(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Unable to load dashboard data.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  // ============================================================
  // CALCULATE STATISTICS
  // ============================================================

  const openTickets = tickets.filter(
    (ticket) =>
      ticket.status === "OPEN" ||
      ticket.status === "ASSIGNED"
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "IN_PROGRESS"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status === "RESOLVED" ||
      ticket.status === "CLOSED"
  ).length;

  const resolutionRate =
    tickets.length > 0
      ? Math.round(
          (resolvedTickets / tickets.length) * 100
        )
      : 0;

  const stats = [
    {
      ...statsConfig[0],
      value: openTickets.toString(),
    },
    {
      ...statsConfig[1],
      value: inProgressTickets.toString(),
    },
    {
      ...statsConfig[2],
      value: resolvedTickets.toString(),
    },
    {
      ...statsConfig[3],
      value: `${resolutionRate}%`,
    },
  ];

  // Show newest tickets first
  const recentTickets = tickets.slice(0, 5);

  return (
    <ProtectedRoute allowedRoles={["Employee"]}>
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">

        {/* ================================================== */}
        {/* PAGE HEADER */}
        {/* ================================================== */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Overview
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Good morning, Papi
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Here's what's happening with your support tickets.
            </p>
          </div>

          <Button>
            + Create Ticket
          </Button>
        </div>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <Card className="border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 text-red-600"
              />

              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load dashboard
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ================================================== */}
        {/* LOADING */}
        {/* ================================================== */}

        {loading ? (
          <Card className="flex min-h-[200px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Loader2
                size={30}
                className="animate-spin text-blue-600"
              />

              <p className="text-sm">
                Loading dashboard...
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* ================================================== */}
            {/* STATISTICS */}
            {/* ================================================== */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <Card
                    key={stat.title}
                    className="p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          {stat.title}
                        </p>

                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                          {stat.value}
                        </p>
                      </div>

                      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <Icon size={21} />
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-gray-500">
                      {stat.description}
                    </p>
                  </Card>
                );
              })}
            </div>

            {/* ================================================== */}
            {/* RECENT TICKETS */}
            {/* ================================================== */}

            <Card>
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    Recent Tickets
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Your latest support requests
                  </p>
                </div>

                <a
                  href="/tickets"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View all
                </a>
              </div>

              {recentTickets.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <TicketIcon
                    size={32}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 text-sm font-medium text-gray-700">
                    No tickets yet
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Create a ticket when you need IT support.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentTickets.map((ticket) => (
                    <a
                      key={ticket.id}
                      href={`/tickets/${ticket.id}`}
                      className="block transition hover:bg-gray-50"
                    >
                      <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-400">
                            {ticket.ticket_number}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {ticket.title}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Created{" "}
                            {formatDate(ticket.created_at)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                              ticket.status
                            )}`}
                          >
                            {formatStatus(ticket.status)}
                          </span>

                          <span className="text-xs font-medium text-gray-500">
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AppShell>
     </ProtectedRoute>
  );
}