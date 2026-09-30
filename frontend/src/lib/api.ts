const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const API_URL = API_BASE_URL;

// ============================================================
// AUTH TYPES
// ============================================================

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  department_id: number;
  phone?: string | null;
}

export interface Department {
  id: number;
  name: string;
  description?: string | null;
}

export interface RegisterResponse {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  message?: string;
}

// ============================================================
// TICKET TYPES
// ============================================================

export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  requester_id: number;
  category_id: number;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
}
// ============================================================
// CATEGORY TYPES
// ============================================================

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
}
// ============================================================
// GET TICKET CATEGORIES
// ============================================================

export async function getCategories(): Promise<Category[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_URL}/api/categories`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Unable to load ticket categories.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  return response.json();
}

// ============================================================
// LOGIN
// ============================================================

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const formData = new URLSearchParams();

  formData.append("username", username);
  formData.append("password", password);

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 10000);

  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The login service did not respond. Please try again.");
    }

    throw new Error("Unable to reach the login service. Please check that the backend is running.");
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = "Invalid email or password.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  return response.json();
}

// ============================================================
// REGISTER
// ============================================================

export async function register(
  data: RegisterData
): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let message = "Unable to create account.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  return response.json();
}

export async function getDepartments(): Promise<Department[]> {
  const response = await fetch(`${API_URL}/api/departments`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Unable to load departments.");
  }

  return response.json();
}

// ============================================================
// GET MY TICKETS
// ============================================================

export async function getMyTickets(): Promise<Ticket[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(`${API_URL}/api/tickets`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = "Unable to load your tickets.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  return response.json();
}

// ============================================================
// GET SINGLE TICKET
// ============================================================

export async function getTicket(ticketId: number): Promise<Ticket> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_URL}/api/tickets/${ticketId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Unable to load the ticket.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  return response.json();
}

// ============================================================
// CREATE TICKET
// ============================================================

export interface CreateTicketData {
  title: string;
  description: string;
  category_id: number;
  priority: string;
}

export async function createTicket(
  data: CreateTicketData
): Promise<Ticket> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let message = "Unable to create ticket.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  return response.json();
}

// ============================================================
// CLOSE TICKET
// ============================================================

export async function closeTicket(
  ticketId: number
): Promise<Ticket> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_URL}/api/tickets/${ticketId}/close`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Unable to close ticket.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  return response.json();
}
// ===============================
// TICKET COMMENTS
// ===============================

export interface TicketComment {
  id: number;
  ticket_id: number;
  user_id: number;
  comment: string;
  created_at: string;
}

export async function getTicketComments(
  ticketId: number
): Promise<TicketComment[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_URL}/api/tickets/${ticketId}/comments`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Unable to load ticket comments.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {}

    throw new Error(message);
  }

  return response.json();
}

export async function createTicketComment(
  ticketId: number,
  comment: string
): Promise<TicketComment> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_URL}/api/tickets/${ticketId}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        comment,
      }),
    }
  );

  if (!response.ok) {
    let message = "Unable to add comment.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {}

    throw new Error(message);
  }

  return response.json();
}

// ===============================
// TICKET STATUS HISTORY
// ===============================

export interface TicketStatusHistory {
  id: number;
  ticket_id: number;
  old_status: string | null;
  new_status: string;
  changed_by: number;
  changed_at: string;
}

export async function getTicketStatusHistory(
  ticketId: number
): Promise<TicketStatusHistory[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_URL}/api/tickets/${ticketId}/history`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Unable to load ticket history.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {}

    throw new Error(message);
  }

  return response.json();
}
// ===============================
// TECHNICIAN TICKETS
// ===============================

export async function getAssignedTickets(): Promise<Ticket[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_URL}/api/tickets/assigned`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = "Unable to load assigned tickets.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {}

    throw new Error(message);
  }

  return response.json();
}

export async function updateTechnicianStatus(
  ticketId: number,
  status: string
): Promise<Ticket> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_URL}/api/tickets/${ticketId}/technician-status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status,
      }),
    }
  );

  if (!response.ok) {
    let message = "Unable to update ticket status.";

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {}

    throw new Error(message);
  }

  return response.json();
}
export type UserRole =
  | "Employee"
  | "Technician"
  | "Administrator";

export function normalizeUserRole(value: unknown): UserRole | null {
  if (typeof value !== "string") {
    return null;
  }

  switch (value.toLowerCase()) {
    case "employee":
      return "Employee";
    case "technician":
      return "Technician";
    case "administrator":
      return "Administrator";
    default:
      return null;
  }
}

export interface CurrentUser {
  id: number;
  role: UserRole;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminUser {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: UserRole | null;
  department: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function getCurrentUserFromToken(): CurrentUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem("access_token");

  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1])
    );
    const role = normalizeUserRole(payload.role);

    if (!payload.sub || !role) {
      return null;
    }

    return {
      id: Number(payload.sub),
      role,
    };
  } catch {
    return null;
  }
}
// ============================================================
// ADMINISTRATOR - ASSIGN TICKET
// ============================================================

export interface TicketAssignment {
  id: number;
  ticket_id: number;
  technician_id: number;
  assigned_by: number;
  assigned_at: string;
  unassigned_at: string | null;
}

export async function assignTicket(
  ticketId: number,
  technicianId: number
): Promise<TicketAssignment> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/tickets/${ticketId}/assign`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        technician_id: technicianId,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Failed to assign ticket."
    );
  }

  return response.json();
}
// ============================================================
// ADMINISTRATOR - GET ALL TICKETS
// ============================================================

export async function getAllAdminTickets(): Promise<Ticket[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/tickets/admin/all`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Failed to fetch all tickets."
    );
  }

  return response.json();
}
// ============================================================
// ADMINISTRATOR - GET ALL TECHNICIANS
// ============================================================

export interface Technician {
  id: number;
  email: string;
  is_active: boolean;
}

export interface CreateTechnicianData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  department_id: number;
  phone?: string | null;
}

export async function getAllTechnicians(): Promise<Technician[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/tickets/admin/technicians`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Failed to fetch technicians."
    );
  }

  return response.json();
}

export async function createTechnician(
  data: CreateTechnicianData
): Promise<AdminUser> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(`${API_BASE_URL}/api/users/admin/technicians`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Unable to create technician account.");
  }

  return response.json();
}

// ============================================================
// ADMINISTRATOR - USER MANAGEMENT
// ============================================================

async function updateAdminUserState(
  userId: number,
  action: "activate" | "deactivate"
): Promise<AdminUser> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/users/admin/${userId}/${action}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.detail || `Failed to ${action} user account.`
    );
  }

  return response.json();
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(`${API_BASE_URL}/api/users/admin/all`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to fetch users.");
  }

  return response.json();
}

export function activateUser(userId: number): Promise<AdminUser> {
  return updateAdminUserState(userId, "activate");
}

export function deactivateUser(userId: number): Promise<AdminUser> {
  return updateAdminUserState(userId, "deactivate");
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getNotifications(): Promise<Notification[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Unable to load notifications.");
  }

  return response.json();
}

export async function markNotificationRead(
  notificationId: number
): Promise<Notification> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Unable to update notification.");
  }

  return response.json();
}

export async function markAllNotificationsRead(): Promise<void> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Unable to update notifications.");
  }
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  actor_name: string;
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

// ============================================================
// ADMINISTRATOR - AUDIT LOGS
// ============================================================

export async function getAuditLogs(): Promise<AuditLog[]> {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const response = await fetch(`${API_BASE_URL}/api/audit-logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Unable to load audit logs.");
  }

  return response.json();
}

export interface Profile extends AdminUser {
  created_at: string;
  updated_at: string;
}

// ============================================================
// PROFILE AND SETTINGS
// ============================================================

export interface ProfileUpdateData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

export async function getMyProfile(): Promise<Profile> {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("You are not authenticated.");

  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Unable to load your profile.");
  }
  return response.json();
}

export async function updateMyProfile(
  data: ProfileUpdateData
): Promise<Profile> {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("You are not authenticated.");

  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Unable to update your profile.");
  }
  return response.json();
}

export async function changeMyPassword(
  current_password: string,
  new_password: string
): Promise<void> {
  const token = localStorage.getItem("access_token");
  if (!token) throw new Error("You are not authenticated.");

  const response = await fetch(`${API_BASE_URL}/api/users/me/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ current_password, new_password }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Unable to change your password.");
  }
}