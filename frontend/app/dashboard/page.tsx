import {
  CheckCircle2,
  Clock3,
  Ticket,
  TrendingUp,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const stats = [
  {
    title: "Open Tickets",
    value: "12",
    description: "Tickets waiting for support",
    icon: Ticket,
  },
  {
    title: "In Progress",
    value: "4",
    description: "Currently being handled",
    icon: Clock3,
  },
  {
    title: "Resolved",
    value: "28",
    description: "Successfully resolved",
    icon: CheckCircle2,
  },
  {
    title: "Resolution Rate",
    value: "86%",
    description: "This month's performance",
    icon: TrendingUp,
  },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">Overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Good morning, Papi
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Here's what's happening with your support tickets.
            </p>
          </div>

          <Button>+ Create Ticket</Button>
        </div>

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
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                      {stat.value}
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={21} />
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-500">{stat.description}</p>
              </Card>
            );
          })}
        </div>

        <Card>
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="font-semibold text-gray-900">Recent Tickets</h2>
              <p className="mt-1 text-xs text-gray-500">
                Your latest support requests
              </p>
            </div>

            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {[
              {
                id: "TKT-8F31A2C1",
                title: "Laptop cannot connect to Wi-Fi",
                status: "Open",
                priority: "High",
              },
              {
                id: "TKT-7A92BC14",
                title: "Microsoft Office installation",
                status: "In Progress",
                priority: "Medium",
              },
              {
                id: "TKT-2D41EF83",
                title: "Email account password reset",
                status: "Resolved",
                priority: "Low",
              },
            ].map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col gap-3 px-6 py-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-gray-400">{ticket.id}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {ticket.title}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                    {ticket.priority}
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
