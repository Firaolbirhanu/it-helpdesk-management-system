"use client";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";

import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  createTicket,
  getCategories,
  Category,
} from "@/lib/api";

export default function CreateTicketPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [priority, setPriority] = useState("MEDIUM");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
useEffect(() => {
  async function loadCategories() {
    try {
      setCategoriesLoading(true);

      const data = await getCategories();

      setCategories(data);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unable to load ticket categories.");
      }
    } finally {
      setCategoriesLoading(false);
    }
  }

  loadCategories();
}, []);
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a ticket title.");
      return;
    }

    if (!description.trim()) {
      setError("Please describe your problem.");
      return;
    }

    if (!categoryId) {
      setError("Please select a ticket category.");
      return;
    }

    try {
      setLoading(true);

      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        category_id: Number(categoryId),
        priority,
      });

      router.push(`/tickets/${ticket.id}`);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unable to create ticket.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["Employee"]}>
    <AppShell>

      <div className="mx-auto max-w-3xl space-y-6">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div>
          <Link
            href="/tickets"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to My Tickets
          </Link>

          <p className="text-sm font-medium text-blue-600">
            Support
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Create a Ticket
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Tell the IT support team what you need help with.
          </p>
        </div>

        {/* ================================================== */}
        {/* FORM */}
        {/* ================================================== */}

        <Card>
          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6 sm:p-8"
          >

            {/* ERROR */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Unable to create ticket
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* TITLE */}
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Ticket Title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Example: My laptop cannot connect to Wi-Fi"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                disabled={loading}
              />

              <p className="mt-2 text-xs text-gray-400">
                Give your problem a short, clear title.
              </p>
            </div>

            {/* CATEGORY */}
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Category
              </label>

             <select
  id="category"
  value={categoryId}
  onChange={(event) =>
    setCategoryId(event.target.value)
  }
  disabled={loading || categoriesLoading}
  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
>
  <option value="">
    {categoriesLoading
      ? "Loading categories..."
      : "Select a category"}
  </option>

  {categories.map((category) => (
    <option
      key={category.id}
      value={category.id}
    >
      {category.name}
    </option>
  ))}
</select>

              <p className="mt-2 text-xs text-gray-400">
                Choose the category that best describes your
                problem.
              </p>
            </div>

            {/* PRIORITY */}
            <div>
              <label
                htmlFor="priority"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Priority
              </label>

              <select
                id="priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                disabled={loading}
              >
                <option value="LOW">
                  Low — General request
                </option>

                <option value="MEDIUM">
                  Medium — Normal issue
                </option>

                <option value="HIGH">
                  High — Important issue
                </option>
              </select>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe the problem in detail. Include what happened, when it started, and any error messages you saw."
                rows={7}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                disabled={loading}
              />

              <p className="mt-2 text-xs text-gray-400">
                More details help the technician understand and
                resolve your problem faster.
              </p>
            </div>

            {/* INFORMATION NOTICE */}
            <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4">
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <div>
                <p className="text-sm font-medium text-blue-900">
                  What happens next?
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  Your ticket will be submitted to the IT
                  support team. You can track its status from
                  the My Tickets page.
                </p>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
              <Link href="/tickets">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </Link>

              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Create Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
    </ProtectedRoute>
  );
}