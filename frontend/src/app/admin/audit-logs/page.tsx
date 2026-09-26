"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ClipboardList,
  Loader2,
  Search,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { AuditLog, getAuditLogs } from "@/lib/api";

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionStyle(action: string) {
  switch (action) {
    case "CREATE":
      return "bg-blue-50 text-blue-700";
    case "ASSIGN":
      return "bg-purple-50 text-purple-700";
    case "STATUS_CHANGE":
      return "bg-yellow-50 text-yellow-700";
    case "CLOSE":
      return "bg-green-50 text-green-700";
    case "DEACTIVATE":
      return "bg-red-50 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function formatAction(action: string) {
  return action.replaceAll("_", " ");
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLogs() {
    try {
      setLoading(true);
      setError("");
      setLogs(await getAuditLogs());
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    getAuditLogs()
      .then((loadedLogs) => {
        if (mounted) {
          setLogs(loadedLogs);
        }
      })
      .catch((loadError) => {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load audit logs."
          );
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;

    return logs.filter((log) =>
      [
        log.actor_name,
        log.action,
        log.entity_type,
        String(log.entity_id ?? ""),
        log.old_value ?? "",
        log.new_value ?? "",
      ].some((value) => value.toLowerCase().includes(query))
    );
  }, [logs, search]);

  return (
    <ProtectedRoute allowedRoles={["Administrator"]}>
      <AppShell>
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Administration
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                Audit Log
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Review the history of important help desk actions.
              </p>
            </div>
            <div className="hidden rounded-xl bg-blue-50 p-3 text-blue-600 sm:block">
              <ClipboardList className="h-7 w-7" />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Unable to load audit log</p>
                <p className="mt-1">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadLogs}>Retry</Button>
            </div>
          )}

          <Card>
            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Activity History</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {filteredLogs.length} of {logs.length} recorded events
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search actions, users, or tickets..."
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p className="text-sm">Loading activity history...</p>
                </div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <ClipboardList className="mx-auto h-9 w-9 text-gray-300" />
                <h3 className="mt-3 text-sm font-semibold text-gray-900">No audit events found</h3>
                <p className="mt-1 text-sm text-gray-500">Actions will appear here as the team works tickets.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      {['Date', 'Actor', 'Action', 'Entity', 'Change'].map((heading) => (
                        <th key={heading} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">{formatDate(log.created_at)}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900">{log.actor_name}</p>
                          <p className="text-xs text-gray-500">{log.actor_role ?? "System"}</p>
                        </td>
                        <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${actionStyle(log.action)}`}>{formatAction(log.action)}</span></td>
                        <td className="px-5 py-4 text-sm text-gray-700">{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ""}</td>
                        <td className="max-w-sm px-5 py-4 text-sm">
                          {log.old_value && log.new_value ? (
                            <div><span className="text-gray-500">{log.old_value}</span><span className="mx-2 text-gray-300">→</span><span className="font-medium text-gray-900">{log.new_value}</span></div>
                          ) : <span className="text-gray-600">{log.new_value ?? log.old_value ?? "Action recorded"}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}