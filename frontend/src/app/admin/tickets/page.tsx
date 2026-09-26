"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Search,
  Ticket as TicketIcon,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

import {
  getAllAdminTickets,
  Ticket,
} from "@/lib/api";

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
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function loadTickets() {
      try {
        setLoading(true);
        setError("");

        const data = await getAllAdminTickets();

        setTickets(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Unable to load tickets.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !search ||
        ticket.title.toLowerCase().includes(search) ||
        ticket.ticket_number.toLowerCase().includes(search) ||
        String(ticket.id).includes(search);

      const matchesStatus =
        statusFilter === "ALL" ||
        ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  return (
    <ProtectedRoute allowedRoles={["Administrator"]}>
      <AppShell>
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/admin"
                className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Link>

              <h1 className="text-2xl font-bold text-gray-900">
                All Tickets
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage and monitor all support tickets.
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <TicketIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>

          {/* Search and Filter */}
          <Card>
            <div className="flex flex-col gap-4 lg:flex-row">

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search by ticket number, ID, or title..."
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

            </div>
          </Card>

          {/* Loading */}
          {loading && (
            <Card>
              <div className="flex min-h-[250px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p>Loading tickets...</p>
                </div>
              </div>
            </Card>
          )}

          {/* Error */}
          {!loading && error && (
            <Card>
              <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-red-50 p-3">
                  <AlertCircle className="h-7 w-7 text-red-600" />
                </div>

                <h2 className="text-lg font-semibold text-gray-900">
                  Unable to load tickets
                </h2>

                <p className="mt-2 max-w-md text-sm text-gray-500">
                  {error}
                </p>

                <Link href="/admin" className="mt-5">
                  <Button variant="outline">
                    Back to dashboard
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Tickets */}
          {!loading && !error && (
            <Card>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Ticket List
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {filteredTickets.length} ticket
                    {filteredTickets.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {filteredTickets.length === 0 ? (
                <div className="rounded-xl bg-gray-50 p-10 text-center">
                  <TicketIcon className="mx-auto h-8 w-8 text-gray-400" />

                  <p className="mt-3 text-sm font-medium text-gray-700">
                    No tickets found
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Try changing your search or status filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Ticket
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Title
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Priority
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Status
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Created
                        </th>

                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-gray-900">
                              #{ticket.ticket_number}
                            </span>
                          </td>

                          <td className="max-w-xs px-4 py-4">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {ticket.title}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                                ticket.priority
                              )}`}
                            >
                              {ticket.priority}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                                ticket.status
                              )}`}
                            >
                              {formatStatus(ticket.status)}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm text-gray-500">
                            {formatDate(ticket.created_at)}
                          </td>

                          <td className="px-4 py-4">
                            <Link
                              href={`/tickets/${ticket.id}`}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}