"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Save, UserRound } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  changeMyPassword,
  getMyProfile,
  Profile,
  updateMyProfile,
} from "@/lib/api";

const preferenceKey = "helpdesk_notification_preferences";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [ticketNotifications, setTicketNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    getMyProfile()
      .then((loadedProfile) => {
        if (!mounted) return;
        setProfile(loadedProfile);
        setForm({
          first_name: loadedProfile.first_name,
          last_name: loadedProfile.last_name,
          email: loadedProfile.email,
          phone: loadedProfile.phone ?? "",
        });
        try {
          const preferences = JSON.parse(localStorage.getItem(preferenceKey) ?? "{}");
          setEmailNotifications(preferences.emailNotifications ?? true);
          setTicketNotifications(preferences.ticketNotifications ?? true);
        } catch {
          // Use the defaults if local preferences are malformed.
        }
      })
      .catch((loadError) => mounted && setError(loadError instanceof Error ? loadError.message : "Unable to load settings."))
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  function savePreferences(email: boolean, tickets: boolean) {
    localStorage.setItem(preferenceKey, JSON.stringify({ emailNotifications: email, ticketNotifications: tickets }));
    setEmailNotifications(email);
    setTicketNotifications(tickets);
    setMessage("Notification preferences saved.");
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSavingProfile(true); setError(""); setMessage("");
      const updated = await updateMyProfile({ ...form, phone: form.phone || null });
      setProfile(updated); setMessage("Profile updated successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update your profile.");
    } finally { setSavingProfile(false); }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) { setError("New passwords do not match."); return; }
    try {
      setSavingPassword(true); setError(""); setMessage("");
      await changeMyPassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      setMessage("Password changed successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to change your password.");
    } finally { setSavingPassword(false); }
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Account</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Profile &amp; Settings</h1>
            <p className="mt-2 text-sm text-gray-500">Manage your profile, security, and notification preferences.</p>
          </div>

          {(message || error) && (
            <div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>
              {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
              <span>{error || message}</span>
            </div>
          )}

          {loading ? <Card className="p-8"><div className="animate-pulse space-y-4"><div className="h-5 w-40 rounded bg-gray-200" /><div className="h-10 rounded bg-gray-100" /><div className="h-10 rounded bg-gray-100" /></div></Card> : (
            <>
              <Card>
                <div className="flex items-center gap-3 border-b border-gray-100 p-5"><UserRound className="h-5 w-5 text-blue-600" /><div><h2 className="font-semibold text-gray-900">Profile</h2><p className="text-xs text-gray-500">Your personal and organizational information.</p></div></div>
                <form onSubmit={handleProfileSubmit} className="grid gap-5 p-5 sm:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">First Name<input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="text-sm font-medium text-gray-700">Last Name<input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="text-sm font-medium text-gray-700">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="text-sm font-medium text-gray-700">Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="text-sm font-medium text-gray-700">Employee ID<input readOnly value={profile?.employee_id ?? ""} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-normal text-gray-500" /></label>
                  <label className="text-sm font-medium text-gray-700">Role<input readOnly value={profile?.role ?? ""} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-normal text-gray-500" /></label>
                  <label className="text-sm font-medium text-gray-700 sm:col-span-2">Department<input readOnly value={profile?.department ?? "Unassigned"} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-normal text-gray-500" /></label>
                  <div className="sm:col-span-2"><Button type="submit" disabled={savingProfile}><Save className="mr-2 h-4 w-4" />{savingProfile ? "Saving..." : "Update Profile"}</Button></div>
                </form>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <div className="flex items-center gap-3 border-b border-gray-100 p-5"><KeyRound className="h-5 w-5 text-blue-600" /><div><h2 className="font-semibold text-gray-900">Change Password</h2><p className="text-xs text-gray-500">Use a strong password you do not reuse elsewhere.</p></div></div>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4 p-5">
                    <input required type="password" placeholder="Current password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                    <input required minLength={8} type="password" placeholder="New password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                    <input required minLength={8} type="password" placeholder="Confirm new password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                    <Button type="submit" disabled={savingPassword}>{savingPassword ? "Updating..." : "Change Password"}</Button>
                  </form>
                </Card>

                <Card>
                  <div className="border-b border-gray-100 p-5"><h2 className="font-semibold text-gray-900">Notification Preferences</h2><p className="mt-1 text-xs text-gray-500">Choose which updates this browser should surface.</p></div>
                  <div className="space-y-5 p-5">
                    <label className="flex items-center justify-between gap-4 text-sm text-gray-700"><span><span className="block font-medium">Ticket updates</span><span className="text-xs text-gray-500">Assignments, resolutions, and closures</span></span><input type="checkbox" checked={ticketNotifications} onChange={(e) => savePreferences(emailNotifications, e.target.checked)} className="h-5 w-5 accent-blue-600" /></label>
                    <label className="flex items-center justify-between gap-4 text-sm text-gray-700"><span><span className="block font-medium">Email notifications</span><span className="text-xs text-gray-500">Preference saved for future email delivery</span></span><input type="checkbox" checked={emailNotifications} onChange={(e) => savePreferences(e.target.checked, ticketNotifications)} className="h-5 w-5 accent-blue-600" /></label>
                  </div>
                </Card>
              </div>

              <Card>
                <div className="border-b border-gray-100 p-5"><h2 className="font-semibold text-gray-900">Account Information</h2><p className="mt-1 text-xs text-gray-500">Read-only account details.</p></div>
                <dl className="grid gap-5 p-5 sm:grid-cols-3"><div><dt className="text-xs uppercase tracking-wide text-gray-400">Account status</dt><dd className="mt-1 text-sm font-medium text-green-700">{profile?.is_active ? "Active" : "Inactive"}</dd></div><div><dt className="text-xs uppercase tracking-wide text-gray-400">Member since</dt><dd className="mt-1 text-sm text-gray-700">{profile ? new Date(profile.created_at).toLocaleDateString() : "-"}</dd></div><div><dt className="text-xs uppercase tracking-wide text-gray-400">User ID</dt><dd className="mt-1 text-sm text-gray-700">#{profile?.id}</dd></div></dl>
              </Card>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}