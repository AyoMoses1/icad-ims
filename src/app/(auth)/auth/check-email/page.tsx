"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") ?? null;

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
        <Mail className="h-10 w-10 text-blue-600 dark:text-blue-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground">
          We've sent a verification link to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email address"
          )}
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-left">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">What's next?</p>
            <p className="text-sm text-muted-foreground">
              Click the verification link in the email to activate your account.
              The link will expire in 24 hours.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Didn't receive the email?</p>
            <p className="text-sm text-muted-foreground">
              Check your spam folder or make sure you entered the correct email
              address.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button asChild className="w-full">
          <Link href="/auth/signin">
            Continue to sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <p className="text-sm text-muted-foreground">
          Already verified?{" "}
          <Link href="/auth/signin" className="text-primary hover:underline">
            Sign in to your account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
