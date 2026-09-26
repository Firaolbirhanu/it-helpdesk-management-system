"use client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  Ticket as TicketIcon,
  Wrench,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  getAssignedTickets,
  updateTechnicianStatus,
  getCurrentUserFromToken,
  Ticket,
} from "@/lib/api";

import { getCurrentUser } from "@/lib/auth";

function getStatusStyle(status: string) {
  switch (status) {
    case "ASSIGNED":
      return "bg-purple-50 text-purple-700";

    case "IN_PROGRESS":
      return "bg-yellow-50 text-yellow-700";

    case "RESOLVED":
      return "bg-green-50 text-green-700";

    case "CLOSED":
      return "bg-gray-100 text-gray-700";

    default:
      return "bg-blue-50 text-blue-700";
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

export default function TechnicianDashboardPage() {
   const [currentUser, setCurrentUser] = useState<{
  id: number;
  role: string;
} | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [updatingTicketId, setUpdatingTicketId] = useState<number | null>(
  null
);
const [actionError, setActionError] = useState("");
useEffect(() => {
  const user = getCurrentUserFromToken();
  setCurrentUser(user);
}, []);
  useEffect(() => {
    async function loadAssignedTickets() {
      try {
        setLoading(true);
        setError("");

        const data = await getAssignedTickets();

        setTickets(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Unable to load assigned tickets.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadAssignedTickets();
  }, []);

  const assignedCount = tickets.filter(
    (ticket) => ticket.status === "ASSIGNED"
  ).length;

  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "IN_PROGRESS"
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "RESOLVED"
  ).length;
async function handleStatusUpdate(
  ticketId: number,
  newStatus: "IN_PROGRESS" | "RESOLVED"
) {
  try {
    setUpdatingTicketId(ticketId);
    setActionError("");

    const updatedTicket = await updateTechnicianStatus(
      ticketId,
      newStatus
    );

    setTickets((previousTickets) =>
      previousTickets.map((ticket) =>
        ticket.id === ticketId ? updatedTicket : ticket
      )
    );
  } catch (error) {
    if (error instanceof Error) {
      setActionError(error.message);
    } else {
      setActionError("Unable to update ticket status.");
    }
  } finally {
    setUpdatingTicketId(null);
  }
}
  return (
     <ProtectedRoute allowedRoles={["Technician"]}>
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Technician Dashboard
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Manage and resolve your assigned support tickets.
                </p>
              </div>
            </div>
          </div>
        </div>
<p className="mt-1 text-sm text-gray-500">
  Role: {currentUser?.role ?? "Unknown"}
</p>
        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-3">

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Assigned
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {assignedCount}
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-3">
                <TicketIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  In Progress
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {inProgressCount}
                </p>
              </div>

              <div className="rounded-xl bg-yellow-50 p-3">
                <Clock3 className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Resolved
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {resolvedCount}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

        </div>

        {/* Assigned Tickets */}
        <Card>
            {actionError && (
  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
    <div className="flex items-center gap-2">
      <AlertCircle className="h-5 w-5 text-red-600" />

      <p className="text-sm font-medium text-red-700">
        {actionError}
      </p>
    </div>
  </div>
)}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Assigned Tickets
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Tickets currently assigned to you.
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex min-h-[250px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading assigned tickets...</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-red-50 p-3">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                Unable to load tickets
              </h3>

              <p className="mt-2 max-w-md text-sm text-gray-500">
                {error}
              </p>
            </div>
          )}

          {!loading && !error && tickets.length === 0 && (
            <div className="flex min-h-[250px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-4">
                <TicketIcon className="h-8 w-8 text-gray-400" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                No assigned tickets
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                You currently have no tickets assigned to you.
              </p>
            </div>
          )}

          {!loading && !error && tickets.length > 0 && (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-gray-200 p-5 transition hover:border-blue-200 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">
                          #{ticket.ticket_number}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                            ticket.status
                          )}`}
                        >
                          {formatStatus(ticket.status)}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityStyle(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>

                      <h3 className="mt-2 truncate text-base font-semibold text-gray-900">
                        {ticket.title}
                      </h3>

                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {ticket.description}
                      </p>

                      <p className="mt-3 text-xs text-gray-400">
                        Created {formatDate(ticket.created_at)}
                      </p>
                    </div>

                   <div className="flex shrink-0 flex-wrap items-center gap-2">
  <Link href={`/tickets/${ticket.id}`}>
    <Button variant="outline">
      View Ticket
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  </Link>

  {ticket.status === "ASSIGNED" && (
    <Button
      onClick={() =>
        handleStatusUpdate(ticket.id, "IN_PROGRESS")
      }
      disabled={updatingTicketId === ticket.id}
    >
      {updatingTicketId === ticket.id ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Starting...
        </>
      ) : (
        <>
          <Clock3 className="mr-2 h-4 w-4" />
          Start Work
        </>
      )}
    </Button>
  )}

  {ticket.status === "IN_PROGRESS" && (
    <Button
      onClick={() =>
        handleStatusUpdate(ticket.id, "RESOLVED")
      }
      disabled={updatingTicketId === ticket.id}
    >
      {updatingTicketId === ticket.id ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Resolving...
        </>
      ) : (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark Resolved
        </>
      )}
    </Button>
  )}
</div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </AppShell>
      </ProtectedRoute>
  );
}