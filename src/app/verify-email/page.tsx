"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const userId = searchParams?.get("userId") ?? null;
  const token = searchParams?.get("token") ?? null;
  const success = searchParams?.get("success") ?? null;
  const error = searchParams?.get("error") ?? null;

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Handle redirect from GET endpoint (success/error query params)
    if (success === "true") {
      setStatus("success");
      setMessage(
        "Your email has been successfully verified. You can now sign in."
      );
      return;
    }

    if (error) {
      setStatus("error");
      setMessage(decodeURIComponent(error));
      return;
    }

    // Handle POST verification (userId and token from email link)
    const verifyEmail = async () => {
      if (!userId || !token) {
        setStatus("error");
        setMessage(
          "Invalid verification link. Please check your email for a valid verification link or request a new one."
        );
        return;
      }

      try {
        // Decode the token if it's URL-encoded (it should already be decoded by searchParams.get, but just in case)
        const decodedToken = decodeURIComponent(token);

        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId.trim(),
            token: decodedToken,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error?.message || result.message || "Verification failed"
          );
        }

        if (!result.success) {
          throw new Error(result.error?.message || "Email verification failed");
        }

        setStatus("success");
        setMessage(
          "Your email has been successfully verified. You can now sign in to your account."
        );
      } catch (error) {
        console.error("Email verification error:", error);
        setStatus("error");
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Verification failed. The link may have expired or is invalid. Please request a new verification email.";
        setMessage(errorMessage);
      }
    };

    // Only verify if we have both userId and token
    if (userId && token) {
      verifyEmail();
    } else if (!userId && !token && !success && !error) {
      // If no params at all, show error
      setStatus("error");
      setMessage(
        "Invalid verification link. Please check your email for a valid verification link."
      );
    }
  }, [userId, token, success, error]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F4F8] p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Verifying your email...
              </h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your email address. This may take a
                few seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F4F8] p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Verification failed
              </h1>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/auth/signin">Back to sign in</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                If you need a new verification link, please contact support or
                try signing up again.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F4F8] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Email verified!
            </h1>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <Button asChild className="w-full">
            <Link href="/auth/signin">Continue to sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0F4F8] p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
            <div className="space-y-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
