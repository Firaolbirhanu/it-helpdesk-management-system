"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  Loader2,
  Search,
  ShieldCheck,
  UserRound,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  activateUser,
  AdminUser,
  createTechnician,
  Department,
  deactivateUser,
  getAllUsers,
  getDepartments,
  UserRole,
} from "@/lib/api";

const roles: UserRole[] = ["Employee", "Technician", "Administrator"];

function initials(user: AdminUser) {
  return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function roleStyle(role: UserRole | null) {
  switch (role) {
    case "Administrator":
      return "bg-indigo-50 text-indigo-700";
    case "Technician":
      return "bg-blue-50 text-blue-700";
    case "Employee":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`rounded-xl p-2.5 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
    </Card>
  );
}

function LoadingRows() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-4 px-5 py-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-gray-200" />
            <div className="h-3 w-56 rounded bg-gray-100" />
          </div>
          <div className="hidden h-6 w-20 rounded-full bg-gray-100 sm:block" />
          <div className="hidden h-6 w-16 rounded-full bg-gray-100 md:block" />
        </div>
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [technicianDepartments, setTechnicianDepartments] = useState<Department[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creatingTechnician, setCreatingTechnician] = useState(false);
  const [technicianForm, setTechnicianForm] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    department_id: "",
    phone: "",
  });

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      setUsers(await getAllUsers());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    getAllUsers()
      .then((loadedUsers) => {
        if (mounted) {
          setUsers(loadedUsers);
        }
      })
      .catch((loadError) => {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load users."
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

  useEffect(() => {
    getDepartments().then(setTechnicianDepartments).catch(() => undefined);
  }, []);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          users
            .map((user) => user.department)
            .filter((department): department is string => Boolean(department))
        )
      ).sort(),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        fullName.includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.employee_id.toLowerCase().includes(normalizedSearch);
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? user.is_active : !user.is_active);
      const matchesDepartment =
        departmentFilter === "ALL" || user.department === departmentFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
    });
  }, [departmentFilter, roleFilter, search, statusFilter, users]);

  async function handleStatusChange(user: AdminUser) {
    const action = user.is_active ? "deactivate" : "activate";
    const confirmed = window.confirm(
      `${action === "deactivate" ? "Deactivate" : "Activate"} ${user.first_name} ${user.last_name}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user.id);
      setError("");
      const updatedUser = user.is_active
        ? await deactivateUser(user.id)
        : await activateUser(user.id);

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === updatedUser.id ? updatedUser : currentUser
        )
      );
      setSelectedUser((currentUser) =>
        currentUser?.id === updatedUser.id ? updatedUser : currentUser
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update the user account."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleCreateTechnician(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCreatingTechnician(true);
      setError("");
      const technician = await createTechnician({
        ...technicianForm,
        department_id: Number(technicianForm.department_id),
        phone: technicianForm.phone || null,
      });
      setUsers((currentUsers) => [technician, ...currentUsers]);
      setCreateOpen(false);
      setTechnicianForm({
        employee_id: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        department_id: "",
        phone: "",
      });
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create technician account."
      );
    } finally {
      setCreatingTechnician(false);
    }
  }

  const stats = {
    total: users.length,
    employees: users.filter((user) => user.role === "Employee").length,
    technicians: users.filter((user) => user.role === "Technician").length,
    administrators: users.filter((user) => user.role === "Administrator").length,
    active: users.filter((user) => user.is_active).length,
    inactive: users.filter((user) => !user.is_active).length,
  };

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
                User Management
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Manage employees, technicians, and administrators.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-xl bg-blue-50 p-3 text-blue-600 sm:block">
                <Users className="h-7 w-7" />
              </div>
              <Button onClick={() => setCreateOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Technician
              </Button>
            </div>
          </div>

          {!loading && error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Unable to complete the request</p>
                <p className="mt-1">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={loadUsers}>
                Retry
              </Button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard label="Total Users" value={stats.total} icon={Users} tone="bg-blue-50 text-blue-600" />
            <StatCard label="Employees" value={stats.employees} icon={UserRound} tone="bg-gray-100 text-gray-600" />
            <StatCard label="Technicians" value={stats.technicians} icon={ShieldCheck} tone="bg-cyan-50 text-cyan-600" />
            <StatCard label="Administrators" value={stats.administrators} icon={ShieldCheck} tone="bg-indigo-50 text-indigo-600" />
            <StatCard label="Active Users" value={stats.active} icon={CheckCircle2} tone="bg-green-50 text-green-600" />
            <StatCard label="Inactive Users" value={stats.inactive} icon={UserX} tone="bg-red-50 text-red-600" />
          </div>

          <Card>
            <div className="flex flex-col gap-3 border-b border-gray-100 p-5 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, email, or employee ID..."
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:flex">
                <label className="relative">
                  <span className="sr-only">Filter by role</span>
                  <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:w-40">
                    <option value="ALL">All Roles</option>
                    {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </label>
                <label className="relative">
                  <span className="sr-only">Filter by status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:w-36">
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </label>
                <label className="relative">
                  <span className="sr-only">Filter by department</span>
                  <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:w-44">
                    <option value="ALL">All Departments</option>
                    {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">Directory</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
              </div>
            </div>

            {loading ? <LoadingRows /> : filteredUsers.length === 0 ? (
              <div className="border-t border-gray-100 px-5 py-16 text-center">
                <Users className="mx-auto h-9 w-9 text-gray-300" />
                <h3 className="mt-3 text-sm font-semibold text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">Try changing your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left">
                  <thead className="border-y border-gray-100 bg-gray-50">
                    <tr>
                      {[
                        "User",
                        "Employee ID",
                        "Role",
                        "Department",
                        "Status",
                        "Created",
                        "Actions",
                      ].map((heading) => (
                        <th key={heading} className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="transition hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">{initials(user)}</div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
                              <p className="truncate text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{user.employee_id}</td>
                        <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleStyle(user.role)}`}>{user.role ?? "Unknown"}</span></td>
                        <td className="px-5 py-4 text-sm text-gray-600">{user.department ?? "Unassigned"}</td>
                        <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{user.is_active ? "Active" : "Inactive"}</span></td>
                        <td className="px-5 py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)} title={`View ${user.first_name} ${user.last_name}`}>
                              <Eye className="mr-1.5 h-4 w-4" /> View
                            </Button>
                            <Button variant={user.is_active ? "outline" : "primary"} size="sm" disabled={updatingUserId === user.id} onClick={() => handleStatusChange(user)}>
                              {updatingUserId === user.id && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                              {user.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="user-details-title">
            <Card className="w-full max-w-lg">
              <div className="flex items-start justify-between border-b border-gray-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">{initials(selectedUser)}</div>
                  <div>
                    <h2 id="user-details-title" className="font-semibold text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</h2>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close user details"><X className="h-5 w-5" /></button>
              </div>
              <dl className="grid gap-4 p-5 sm:grid-cols-2">
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Employee ID</dt><dd className="mt-1 text-sm text-gray-900">{selectedUser.employee_id}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Role</dt><dd className="mt-1 text-sm text-gray-900">{selectedUser.role ?? "Unknown"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Department</dt><dd className="mt-1 text-sm text-gray-900">{selectedUser.department ?? "Unassigned"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Status</dt><dd className="mt-1 text-sm text-gray-900">{selectedUser.is_active ? "Active" : "Inactive"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Phone</dt><dd className="mt-1 text-sm text-gray-900">{selectedUser.phone ?? "Not provided"}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Created</dt><dd className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.created_at)}</dd></div>
              </dl>
            </Card>
          </div>
        )}

        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="create-technician-title">
            <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
              <div className="flex items-start justify-between border-b border-gray-100 p-5">
                <div>
                  <h2 id="create-technician-title" className="font-semibold text-gray-900">Create Technician Account</h2>
                  <p className="mt-1 text-sm text-gray-500">Only administrators can provision technician access.</p>
                </div>
                <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close create technician dialog"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={handleCreateTechnician} className="grid gap-4 p-5 sm:grid-cols-2">
                {([
                  ["employee_id", "Employee ID", "text"],
                  ["first_name", "First name", "text"],
                  ["last_name", "Last name", "text"],
                  ["email", "Email", "email"],
                  ["password", "Temporary password", "password"],
                  ["phone", "Phone (optional)", "tel"],
                ] as const).map(([field, label, type]) => (
                  <label key={field} className="text-sm font-medium text-gray-700">
                    {label}
                    <input
                      required={field !== "phone"}
                      type={type}
                      minLength={field === "password" ? 8 : undefined}
                      value={technicianForm[field]}
                      onChange={(event) => setTechnicianForm({ ...technicianForm, [field]: event.target.value })}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                ))}
                <label className="text-sm font-medium text-gray-700">
                  Department
                  <select required value={technicianForm.department_id} onChange={(event) => setTechnicianForm({ ...technicianForm, department_id: event.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                    <option value="">Select department</option>
                    {technicianDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                </label>
                <div className="flex justify-end gap-3 sm:col-span-2">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creatingTechnician}>{creatingTechnician ? "Creating..." : "Create Technician"}</Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}