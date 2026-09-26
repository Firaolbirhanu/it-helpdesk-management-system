"use client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Ticket as TicketIcon,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { getMyTickets, Ticket } from "@/lib/api";

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

function getPriorityStyle(priority: string) {
  switch (priority.toUpperCase()) {
    case "HIGH":
      return "bg-red-50 text-red-700";

    case "MEDIUM":
      return "bg-orange-50 text-orange-700";

    case "LOW":
      return "bg-green-50 text-green-700";

    default:
      return "bg-gray-100 text-gray-600";
  }
}

function formatStatus(status: string) {
  return status.replace("_", " ");
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TicketsPage() {
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
          setError("Unable to load your tickets.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["Employee"]}>
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Support
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              My Tickets
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              View and track your support requests.
            </p>
          </div>

          <Link href="/tickets/create">
            <Button>
              <Plus size={18} />
              Create Ticket
            </Button>
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <Card className="flex min-h-[300px] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Loader2
                size={32}
                className="animate-spin text-blue-600"
              />

              <p className="text-sm">
                Loading your tickets...
              </p>
            </div>
          </Card>
        )}

        {/* Error */}
        {!loading && error && (
          <Card className="border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 text-red-600"
              />

              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load tickets
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && tickets.length === 0 && (
          <Card className="flex min-h-[350px] flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-blue-50 p-4 text-blue-600">
              <TicketIcon size={32} />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-gray-900">
              No tickets yet
            </h2>

            <p className="mt-2 max-w-md text-sm text-gray-500">
              You haven't created any support tickets yet.
              Create your first ticket to request help from
              the IT support team.
            </p>

            <Link
              href="/tickets/create"
              className="mt-6"
            >
              <Button>
                <Plus size={18} />
                Create Your First Ticket
              </Button>
            </Link>
          </Card>
        )}

        {/* Ticket List */}
        {!loading && !error && tickets.length > 0 && (
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-2">
                <TicketIcon
                  size={19}
                  className="text-blue-600"
                />

                <h2 className="font-semibold text-gray-900">
                  Your Support Requests
                </h2>
              </div>

              <p className="mt-1 text-xs text-gray-500">
                {tickets.length}{" "}
                {tickets.length === 1
                  ? "ticket"
                  : "tickets"}{" "}
                found
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block transition hover:bg-gray-50"
                >
                  <div className="px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      {/* Ticket Information */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-gray-400">
                            {ticket.ticket_number}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(
                              ticket.status
                            )}`}
                          >
                            {formatStatus(ticket.status)}
                          </span>
                        </div>

                        <h3 className="mt-2 truncate text-sm font-semibold text-gray-900">
                          {ticket.title}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {ticket.description}
                        </p>
                      </div>

                      {/* Ticket Metadata */}
                      <div className="flex shrink-0 flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityStyle(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority}
                        </span>

                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock3 size={14} />

                          {formatDate(ticket.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
    </ProtectedRoute>
  );
}