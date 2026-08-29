"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AuthCard, AuthShell, LoadingButton } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { authService } from "../services/auth.service";

export default function VerifyEmailPage() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setMessage("This verification link is missing a token.");
      setState("error");
      return;
    }
    void authService
      .verifyEmail(token)
      .then(() => {
        setState("success");
      })
      .catch((error: unknown) => {
        setMessage(
          error instanceof ApiError
            ? error.message
            : "This verification link is invalid or expired.",
        );
        setState("error");
      });
  }, [token]);

  const title =
    state === "success"
      ? "Email verified"
      : state === "error"
        ? "Verification failed"
        : "Verifying your email";
  const description =
    state === "success"
      ? "Your email address is confirmed and your Tablefolk account is ready."
      : state === "error"
        ? message
        : "Just a moment while we confirm your email address.";

  return (
    <AuthShell
      eyebrow="Account security"
      title="Keep your account yours."
      description="A verified email helps protect your account and keeps order updates reliable."
      footnote="Thoughtful dining, from first look to last course."
    >
      <AuthCard
        eyebrow="Email verification"
        title={title}
        description={description}
        footer={
          <p className="auth-switch">
            <Link href="/login">Return to sign in</Link>
          </p>
        }
      >
        {state === "loading" ? (
          <LoadingButton fullWidth loading loadingText="Verifying…">
            Verify email
          </LoadingButton>
        ) : state === "success" ? (
          <Alert tone="success">
            Your email has been verified successfully.
          </Alert>
        ) : (
          <Alert>{message}</Alert>
        )}
      </AuthCard>
    </AuthShell>
  );
}
