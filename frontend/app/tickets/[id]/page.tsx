"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, Clock3, History, Loader2, MessageCircle, Send, Tag, Ticket as TicketIcon } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { closeTicket, createTicketComment, getTicket, getTicketComments, getTicketStatusHistory, Ticket, TicketComment, TicketStatusHistory } from "@/lib/api";

const workflow = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function formatStatus(status: string) { return status.replaceAll("_", " "); }
function formatDate(date: string) { return new Date(date).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }); }
function badgeStyle(value: string) {
  const styles: Record<string, string> = { OPEN: "bg-blue-50 text-blue-700", ASSIGNED: "bg-violet-50 text-violet-700", IN_PROGRESS: "bg-amber-50 text-amber-700", RESOLVED: "bg-emerald-50 text-emerald-700", CLOSED: "bg-gray-100 text-gray-700", LOW: "bg-emerald-50 text-emerald-700", MEDIUM: "bg-amber-50 text-amber-700", HIGH: "bg-orange-50 text-orange-700", CRITICAL: "bg-red-50 text-red-700" };
  return styles[value] ?? "bg-gray-100 text-gray-600";
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = Number(params.id);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [history, setHistory] = useState<TicketStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentsError, setCommentsError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!ticketId || Number.isNaN(ticketId)) { setError("Invalid ticket ID."); setLoading(false); setCommentsLoading(false); setHistoryLoading(false); return; }
    async function loadTicket() { try { setTicket(await getTicket(ticketId)); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load ticket."); } finally { setLoading(false); } }
    async function loadComments() { try { setComments(await getTicketComments(ticketId)); } catch (e) { setCommentsError(e instanceof Error ? e.message : "Unable to load comments."); } finally { setCommentsLoading(false); } }
    async function loadHistory() { try { setHistory(await getTicketStatusHistory(ticketId)); } catch (e) { setHistoryError(e instanceof Error ? e.message : "Unable to load status history."); } finally { setHistoryLoading(false); } }
    loadTicket(); loadComments(); loadHistory();
  }, [ticketId]);

  async function handleClose() {
    if (!ticket || !window.confirm("Are you sure you want to close this ticket?")) return;
    try { setClosing(true); setError(""); setTicket(await closeTicket(ticket.id)); setHistory(await getTicketStatusHistory(ticket.id)); } catch (e) { setError(e instanceof Error ? e.message : "Unable to close ticket."); } finally { setClosing(false); }
  }

  async function handleAddComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const comment = newComment.trim(); if (!comment || !ticket) return;
    try { setCommentSubmitting(true); setCommentsError(""); const created = await createTicketComment(ticket.id, comment); setComments((current) => [...current, created]); setNewComment(""); } catch (e) { setCommentsError(e instanceof Error ? e.message : "Unable to add comment."); } finally { setCommentSubmitting(false); }
  }

  const currentStep = ticket ? workflow.indexOf(ticket.status) : -1;
  return <AppShell><div className="mx-auto max-w-6xl space-y-6">
    <Link href="/tickets" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4" />Back to tickets</Link>
    {loading && <Card className="flex min-h-[300px] items-center justify-center"><div className="flex flex-col items-center gap-3 text-gray-500"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /><p>Loading ticket...</p></div></Card>}
    {!loading && error && <Card className="border-red-200 bg-red-50 p-6"><div className="flex items-start gap-3 text-red-700"><AlertCircle className="h-5 w-5" /><div><h2 className="font-semibold">Unable to load ticket</h2><p className="mt-1 text-sm">{error}</p></div></div></Card>}
    {!loading && !error && ticket && <>
      <Card className="p-6"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50"><TicketIcon className="h-6 w-6 text-blue-600" /></div><div><p className="text-sm font-medium text-gray-500">Ticket #{ticket.ticket_number}</p><h1 className="mt-1 text-2xl font-bold text-gray-900">{ticket.title}</h1><p className="mt-2 text-sm text-gray-500">Created {formatDate(ticket.created_at)}</p></div></div><div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${badgeStyle(ticket.status)}`}>{formatStatus(ticket.status)}</span><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${badgeStyle(ticket.priority)}`}>{ticket.priority}</span>{ticket.status === "RESOLVED" && <Button onClick={handleClose} disabled={closing}>{closing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Closing...</> : <><CheckCircle2 className="mr-2 h-4 w-4" />Close Ticket</>}</Button>}</div></div></Card>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <Card className="p-6"><div className="mb-4 flex items-center gap-2"><Tag className="h-5 w-5 text-gray-500" /><h2 className="text-lg font-semibold text-gray-900">Ticket Information and Description</h2></div><p className="whitespace-pre-wrap rounded-xl bg-gray-50 p-5 text-sm leading-7 text-gray-700">{ticket.description}</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-gray-500">Status</p><p className="mt-1 font-medium text-gray-900">{formatStatus(ticket.status)}</p></div><div><p className="text-xs text-gray-500">Priority</p><p className="mt-1 font-medium text-gray-900">{ticket.priority}</p></div><div><p className="text-xs text-gray-500">Created</p><p className="mt-1 flex items-center gap-2 text-sm text-gray-900"><CalendarDays className="h-4 w-4 text-gray-500" />{formatDate(ticket.created_at)}</p></div><div><p className="text-xs text-gray-500">Last updated</p><p className="mt-1 flex items-center gap-2 text-sm text-gray-900"><Clock3 className="h-4 w-4 text-gray-500" />{formatDate(ticket.updated_at)}</p></div></div></Card>
      <Card className="p-6"><h2 className="mb-5 text-lg font-semibold text-gray-900">Ticket Progress</h2><div className="grid gap-3 sm:grid-cols-5">{workflow.map((status, index) => <div key={status} className="flex items-center gap-2 sm:block sm:text-center"><div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${index <= currentStep ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>{index <= currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}</div><p className={`mt-2 text-xs font-semibold ${status === ticket.status ? "text-blue-700" : index <= currentStep ? "text-gray-700" : "text-gray-400"}`}>{formatStatus(status)}</p></div>)}</div></Card>
      <Card className="p-6"><div className="mb-5 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-gray-500" /><h2 className="text-lg font-semibold text-gray-900">Comments</h2></div>{commentsLoading ? <p className="text-sm text-gray-500">Loading comments...</p> : commentsError ? <p className="text-sm text-red-600">{commentsError}</p> : comments.length === 0 ? <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">No comments yet.</p> : <div className="space-y-4">{comments.map((comment) => <div key={comment.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4"><div className="mb-2 flex justify-between gap-2"><span className="text-sm font-semibold text-gray-900">User #{comment.user_id}</span><span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span></div><p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{comment.comment}</p></div>)}</div>}<form onSubmit={handleAddComment} className="mt-6 space-y-3"><label htmlFor="new-comment" className="block text-sm font-medium text-gray-700">Add a comment</label><textarea id="new-comment" value={newComment} onChange={(event) => setNewComment(event.target.value)} rows={4} placeholder="Write a comment about this ticket..." disabled={commentSubmitting} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100" /><div className="flex justify-end"><Button type="submit" disabled={commentSubmitting || !newComment.trim()}>{commentSubmitting ? "Adding..." : <><Send className="mr-2 h-4 w-4" />Add Comment</>}</Button></div></form></Card>
      <Card className="p-6"><div className="mb-5 flex items-center gap-2"><History className="h-5 w-5 text-gray-500" /><h2 className="text-lg font-semibold text-gray-900">Status History</h2></div>{historyLoading ? <p className="text-sm text-gray-500">Loading status history...</p> : historyError ? <p className="text-sm text-red-600">{historyError}</p> : history.length === 0 ? <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-500">No status history available.</p> : <div className="space-y-5">{history.map((item) => <div key={item.id} className="flex gap-3"><div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-600" /><div><p className="text-sm font-semibold text-gray-900">{item.old_status ? `${formatStatus(item.old_status)} -> ${formatStatus(item.new_status)}` : `Ticket created: ${formatStatus(item.new_status)}`}</p><p className="mt-1 text-xs text-gray-500">Changed by User #{item.changed_by} on {formatDate(item.changed_at)}</p></div></div>)}</div>}</Card>
    </>}
  </div></AppShell>;
}
