"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { sanitizeInternalRedirect } from "@/lib/safe-redirect";

const GOOGLE_ERROR_MESSAGE =
  "Google sign-in could not be completed. Please try again.";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCallbackUrl(sanitizeInternalRedirect(params.get("callbackUrl")));

    const authError = params.get("error");
    if (authError) {
      setError(GOOGLE_ERROR_MESSAGE);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password.");
        setIsLoading(false);
      } else if (res?.ok) {
        // Use router-based redirect instead of window.location
        window.location.href = callbackUrl;
      } else {
        setError("Sign in could not be completed. Please try again.");
        setIsLoading(false);
      }
    } catch {
      setError("Sign in could not be completed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(60rem 60rem at 50% -20%, color-mix(in oklch, var(--accent-primary) 9%, transparent), transparent 60%), radial-gradient(45rem 45rem at 110% 110%, color-mix(in oklch, var(--accent-violet) 7%, transparent), transparent 60%), var(--bg-base)",
      }}
    >
      <Link href="/" className="absolute top-8 left-8 text-2xl font-bold tracking-tight">
        Buster Call
      </Link>

      <div className="w-full max-w-md glass-panel p-6 sm:p-10 relative">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome back</h1>
          <p className="text-[var(--text-secondary)] mb-8 text-sm">Enter your details to access your dashboard.</p>

          {error && (
            <div role="alert" className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
              {error}
            </div>
          )}

          <GoogleAuthButton
            callbackUrl={`/auth/redirect?next=${encodeURIComponent(callbackUrl)}`}
          />

          <div className="my-6 flex items-center gap-4 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            <span className="text-center">or continue with email</span>
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-[var(--text-secondary)]">Email</label>
              <Input id="email" required name="email" type="email" placeholder="name@company.com" autoComplete="email" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
              <Input id="password" required name="password" type="password" placeholder="••••••••" autoComplete="current-password" />
            </div>

            <Button disabled={isLoading} type="submit" size="lg" className="mt-4 w-full rounded-full! bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            Don't have an account? <Link href="/register" className="text-cyan-500 hover:text-cyan-400 transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
