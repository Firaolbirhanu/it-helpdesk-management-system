"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Ticket as TicketIcon,
  UserRound,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import {
  assignTicket,
  getAllAdminTickets,
  getAllTechnicians,
  Technician,
  Ticket,
} from "@/lib/api";

type TicketStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningTicketId, setAssigningTicketId] = useState<number | null>(
    null
  );

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [ticketResult, technicianResult] = await Promise.allSettled([
        getAllAdminTickets(),
        getAllTechnicians(),
      ]);

      const errors: string[] = [];

      if (ticketResult.status === "fulfilled") {
        setTickets(ticketResult.value);
      } else {
        errors.push(
          ticketResult.reason instanceof Error
            ? ticketResult.reason.message
            : "Failed to load tickets."
        );
      }

      if (technicianResult.status === "fulfilled") {
        setTechnicians(technicianResult.value);
      } else {
        errors.push(
          technicianResult.reason instanceof Error
            ? technicianResult.reason.message
            : "Failed to load technicians."
        );
      }

      if (errors.length > 0) {
        setError(errors.join(" "));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load administrator dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const filteredTickets = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return tickets;

    return tickets.filter((ticket) => {
      return (
        String(ticket.id).includes(search) ||
        ticket.title?.toLowerCase().includes(search) ||
        ticket.status?.toLowerCase().includes(search) ||
        ticket.priority?.toLowerCase().includes(search)
      );
    });
  }, [tickets, searchTerm]);

  const statistics = {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "OPEN").length,
    inProgress: tickets.filter(
      (ticket) => ticket.status === "IN_PROGRESS"
    ).length,
    resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
  };

  async function handleAssignTicket(
    ticketId: number,
    technicianId: number
  ) {
    if (!technicianId) return;

    try {
      setAssigningTicketId(ticketId);
      setError("");

      await assignTicket(ticketId, technicianId);

      await loadDashboardData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to assign ticket."
      );
    } finally {
      setAssigningTicketId(null);
    }
  }

  function getStatusStyle(status: string) {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-700";

      case "ASSIGNED":
        return "bg-purple-100 text-purple-700";

      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-700";

      case "RESOLVED":
        return "bg-green-100 text-green-700";

      case "CLOSED":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="mt-4 text-sm text-gray-500">
            Loading administrator dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Administrator Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Monitor tickets and assign support requests to technicians.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Total Tickets
              </p>
              <TicketIcon className="h-5 w-5 text-blue-600" />
            </div>

            <p className="mt-4 text-3xl font-bold text-gray-900">
              {statistics.total}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Open Tickets
              </p>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>

            <p className="mt-4 text-3xl font-bold text-gray-900">
              {statistics.open}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                In Progress
              </p>
              <UserRound className="h-5 w-5 text-yellow-600" />
            </div>

            <p className="mt-4 text-3xl font-bold text-gray-900">
              {statistics.inProgress}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Resolved
              </p>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>

            <p className="mt-4 text-3xl font-bold text-gray-900">
              {statistics.resolved}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Ticket Management
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Review and assign support tickets.
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Ticket
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Priority
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Assign Technician
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {ticket.title}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Ticket #{ticket.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-700">
                          {ticket.priority}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            ticket.status
                          )}`}
                        >
                          {ticket.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          defaultValue=""
                          disabled={assigningTicketId === ticket.id}
                          onChange={(event) =>
                            handleAssignTicket(
                              ticket.id,
                              Number(event.target.value)
                            )
                          }
                          className="w-52 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" disabled>
                            {assigningTicketId === ticket.id
                              ? "Assigning..."
                              : "Select technician"}
                          </option>

                          {technicians.map((technician) => (
                            <option
                              key={technician.id}
                              value={technician.id}
                            >
                              {technician.email}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={["Administrator"]}>
      <AppShell>
        <AdminDashboard />
      </AppShell>
    </ProtectedRoute>
  );
}