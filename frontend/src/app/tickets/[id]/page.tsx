"use client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  MessageCircle,
  Send,
  Tag,
  Ticket as TicketIcon,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  closeTicket,
  createTicketComment,
  getTicket,
  getTicketComments,
  getTicketStatusHistory,
  Ticket,
  TicketComment,
  TicketStatusHistory,
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

const workflow = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

export default function TicketDetailsPage() {
  const params = useParams();

  const ticketId = Number(params.id);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
const [comments, setComments] = useState<TicketComment[]>([]);
const [history, setHistory] = useState<TicketStatusHistory[]>([]);
const [commentsLoading, setCommentsLoading] = useState(true);
const [historyLoading, setHistoryLoading] = useState(true);
const [newComment, setNewComment] = useState("");
const [commentSubmitting, setCommentSubmitting] = useState(false);
const [commentError, setCommentError] = useState("");
 useEffect(() => {
  async function loadTicketData() {
    try {
      setLoading(true);
      setCommentsLoading(true);
      setHistoryLoading(true);
      setError("");

      if (!ticketId || Number.isNaN(ticketId)) {
        throw new Error("Invalid ticket ID.");
      }

      const [ticketData, commentsData, historyData] =
        await Promise.all([
          getTicket(ticketId),
          getTicketComments(ticketId),
          getTicketStatusHistory(ticketId),
        ]);

      setTicket(ticketData);
      setComments(commentsData);
      setHistory(historyData);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unable to load ticket information.");
      }
    } finally {
      setLoading(false);
      setCommentsLoading(false);
      setHistoryLoading(false);
    }
  }

  loadTicketData();
}, [ticketId]);
  async function handleCloseTicket() {
    if (!ticket) return;

    const confirmed = window.confirm(
      "Are you sure you want to close this ticket?"
    );

    if (!confirmed) return;

    try {
      setClosing(true);
      setError("");

      const updatedTicket = await closeTicket(ticket.id);

      setTicket(updatedTicket);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unable to close ticket.");
      }
    } finally {
      setClosing(false);
    }
  }

  async function handleAddComment(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  const trimmedComment = newComment.trim();

  if (!trimmedComment) {
    setCommentError("Please enter a comment.");
    return;
  }

  if (!ticket) {
    setCommentError("Ticket information is unavailable.");
    return;
  }

  try {
    setCommentSubmitting(true);
    setCommentError("");

    const createdComment = await createTicketComment(
      ticket.id,
      trimmedComment
    );

    setComments((previousComments) => [
      ...previousComments,
      createdComment,
    ]);

    setNewComment("");
  } catch (error) {
    if (error instanceof Error) {
      setCommentError(error.message);
    } else {
      setCommentError("Unable to add comment.");
    }
  } finally {
    setCommentSubmitting(false);
  }
}
  const currentStep = ticket
    ? workflow.indexOf(ticket.status)
    : -1;

  return (
    <ProtectedRoute allowedRoles={["Employee", "Technician", "Administrator"]}>
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Back */}
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </Link>

        {/* Loading */}
        {loading && (
          <Card>
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading ticket...</p>
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
                Unable to load ticket
              </h2>

              <p className="mt-2 max-w-md text-sm text-gray-500">
                {error}
              </p>

              <Link href="/tickets" className="mt-5">
                <Button variant="outline">
                  Back to tickets
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Ticket */}
        {!loading && !error && ticket && (
          <>
            {/* Header */}
            <Card>
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <TicketIcon className="h-6 w-6 text-blue-600" />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Ticket #{ticket.ticket_number}
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-gray-900">
                      {ticket.title}
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                      Created {formatDate(ticket.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                      ticket.status
                    )}`}
                  >
                    {formatStatus(ticket.status)}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getPriorityStyle(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority}
                  </span>

                  {ticket.status === "RESOLVED" && (
                    <Button
                      onClick={handleCloseTicket}
                      disabled={closing}
                    >
                      {closing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Closing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Close Ticket
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-gray-500" />

                <h2 className="text-lg font-semibold text-gray-900">
                  Problem Description
                </h2>
              </div>

              <div className="rounded-xl bg-gray-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                  {ticket.description}
                </p>
              </div>
            </Card>
<Card>
  <div className="mb-5 flex items-center gap-2">
    <MessageCircle className="h-5 w-5 text-gray-500" />

    <h2 className="text-lg font-semibold text-gray-900">
      Comments
    </h2>
  </div>

  {commentsLoading ? (
    <p className="text-sm text-gray-500">
      Loading comments...
    </p>
  ) : comments.length === 0 ? (
    <div className="rounded-xl bg-gray-50 p-5 text-center">
      <p className="text-sm text-gray-500">
        No comments yet.
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-xl border border-gray-100 bg-gray-50 p-4"
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-900">
              User #{comment.user_id}
            </span>

            <span className="text-xs text-gray-500">
              {formatDate(comment.created_at)}
            </span>
          </div>

          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {comment.comment}
          </p>
        </div>
      ))}
    </div>
  )}

  <form
    onSubmit={handleAddComment}
    className="mt-6 space-y-3"
  >
    <label
      htmlFor="newComment"
      className="block text-sm font-medium text-gray-700"
    >
      Add a comment
    </label>

    <textarea
      id="newComment"
      value={newComment}
      onChange={(event) => setNewComment(event.target.value)}
      placeholder="Write a comment about this ticket..."
      rows={4}
      disabled={commentSubmitting}
      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
    />

    {commentError && (
      <p className="text-sm text-red-600">
        {commentError}
      </p>
    )}

    <div className="flex justify-end">
      <Button
        type="submit"
        disabled={
          commentSubmitting || !newComment.trim()
        }
      >
        {commentSubmitting ? (
          "Adding..."
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Add Comment
          </>
        )}
      </Button>
    </div>
  </form>
</Card>
<Card>
  <div className="mb-5 flex items-center gap-2">
    <History className="h-5 w-5 text-gray-500" />

    <h2 className="text-lg font-semibold text-gray-900">
      Status History
    </h2>
  </div>

  {historyLoading ? (
    <p className="text-sm text-gray-500">
      Loading status history...
    </p>
  ) : history.length === 0 ? (
    <div className="rounded-xl bg-gray-50 p-5 text-center">
      <p className="text-sm text-gray-500">
        No status history available.
      </p>
    </div>
  ) : (
    <div className="space-y-5">
      {history.map((item) => (
        <div
          key={item.id}
          className="flex gap-3"
        >
          <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-600" />

          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {item.old_status
                ? `${formatStatus(item.old_status)} → ${formatStatus(
                    item.new_status
                  )}`
                : `Ticket created: ${formatStatus(item.new_status)}`}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Changed by User #{item.changed_by}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {formatDate(item.changed_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )}
</Card>
            {/* Details */}
            <div className="grid gap-6 lg:grid-cols-2">

              {/* Ticket information */}
              <Card>
                <h2 className="mb-5 text-lg font-semibold text-gray-900">
                  Ticket Information
                </h2>

                <div className="space-y-4">

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="text-sm text-gray-500">
                      Status
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        ticket.status
                      )}`}
                    >
                      {formatStatus(ticket.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="text-sm text-gray-500">
                      Priority
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="text-sm text-gray-500">
                      Ticket ID
                    </span>

                    <span className="text-sm font-medium text-gray-900">
                      #{ticket.id}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <CalendarDays className="h-4 w-4" />
                      Created
                    </span>

                    <span className="text-sm text-gray-900">
                      {formatDate(ticket.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock3 className="h-4 w-4" />
                      Updated
                    </span>

                    <span className="text-sm text-gray-900">
                      {formatDate(ticket.updated_at)}
                    </span>
                  </div>

                </div>
              </Card>

              {/* Workflow */}
              <Card>
                <h2 className="mb-5 text-lg font-semibold text-gray-900">
                  Ticket Progress
                </h2>

                <div className="space-y-5">
                  {workflow.map((status, index) => {
                    const completed = index <= currentStep;
                    const current = status === ticket.status;

                    return (
                      <div
                        key={status}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            completed
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {completed ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span className="text-xs font-semibold">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              current
                                ? "text-blue-700"
                                : completed
                                ? "text-gray-900"
                                : "text-gray-400"
                            }`}
                          >
                            {formatStatus(status)}
                          </p>

                          {current && (
                            <p className="text-xs text-gray-500">
                              Current status
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
     </ProtectedRoute>
  );
}