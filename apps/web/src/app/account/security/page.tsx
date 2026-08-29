"use client";
import { useEffect, useState, type FormEvent } from "react";
import { AccountSectionPage } from "../_components/account-section-page";
import { Button, Input, LoadingButton } from "@/components/ui";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/modules/auth";
import { useUser } from "@/modules/user";

export default function SecurityPage() {
  const { signOut } = useAuth();
  const { changePassword, fetchCurrentUser } = useUser();
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  useEffect(() => {
    void fetchCurrentUser()
      .then((user) => setVerified(user.emailVerified))
      .catch(() => undefined);
  }, [fetchCurrentUser]);
  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (form.newPassword !== form.confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(form);
      await signOut({ notify: false });
    } catch {
      setMessage(
        "Could not update your password. Check your current password and try again.",
      );
    } finally {
      setSaving(false);
    }
  };
  const logoutAll = async () => {
    await apiClient.post("/auth/logout-all");
    setMessage("All other sessions have been signed out.");
  };
  const deleteAccount = async () => {
    if (
      !window.confirm("Delete your account permanently? This cannot be undone.")
    )
      return;
    const password = window.prompt("Enter your current password to confirm.");
    if (!password) return;
    await apiClient.delete("/auth/me", {
      body: JSON.stringify({ currentPassword: password }),
    });
    await signOut({ notify: false });
  };
  return (
    <AccountSectionPage
      eyebrow="Security"
      title="Account security"
      description="Keep your account protected and up to date."
    >
      <div className="security-settings">
        <section className="security-block">
          <div>
            <p className="eyebrow">Password</p>
            <h3>Change your password</h3>
            <p>
              Use at least 12 characters. Changing it signs you out everywhere.
            </p>
          </div>
          <form onSubmit={submit} className="security-password-form">
            <label>
              Current password
              <Input
                required
                type="password"
                value={form.currentPassword}
                onChange={(e) => update("currentPassword", e.target.value)}
              />
            </label>
            <label>
              New password
              <Input
                required
                minLength={12}
                type="password"
                value={form.newPassword}
                onChange={(e) => update("newPassword", e.target.value)}
              />
            </label>
            <label>
              Confirm new password
              <Input
                required
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
            </label>
            {message ? <p className="form-error">{message}</p> : null}
            <LoadingButton loading={saving} type="submit">
              Update password
            </LoadingButton>
          </form>
        </section>
        <section className="security-row">
          <div>
            <p className="eyebrow">Verification</p>
            <h3>Email address</h3>
            <p>Your email is {verified ? "verified." : "not verified yet."}</p>
          </div>
          <span className={`security-status ${verified ? "is-good" : ""}`}>
            {verified ? "Verified" : "Needs attention"}
          </span>
        </section>
        <section className="security-row">
          <div>
            <p className="eyebrow">Sessions</p>
            <h3>Active devices</h3>
            <p>Sign out of every other browser and device.</p>
          </div>
          <Button variant="secondary" onClick={() => void logoutAll()}>
            Sign out everywhere
          </Button>
        </section>
        <section className="security-row security-row--danger">
          <div>
            <p className="eyebrow">Danger zone</p>
            <h3>Delete account</h3>
            <p>Permanently remove your account and personal data.</p>
          </div>
          <Button variant="ghost" onClick={() => void deleteAccount()}>
            Delete account
          </Button>
        </section>
      </div>
    </AccountSectionPage>
  );
}
