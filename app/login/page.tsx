"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

      console.log("signIn response:", JSON.stringify(res));

      if (res?.error) {
        setError("Invalid email or password. Details: " + res.error);
        setIsLoading(false);
      } else if (res?.ok) {
        // Use router-based redirect instead of window.location
        window.location.href = "/dashboard";
      } else {
        setError("Unexpected response: " + JSON.stringify(res));
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("signIn exception:", err);
      setError("Exception during sign in: " + (err?.message || String(err)));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 text-2xl font-bold tracking-tight">
        Antigravity
      </Link>
      
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 relative">
        <div className="relative z-10">
<h1 className="text-3xl font-bold mb-2 tracking-tight">Welcome back</h1>
          <p className="text-[var(--text-secondary)] mb-8 text-sm">Enter your details to access your dashboard.</p>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Email</label>
              <Input required name="email" type="email" placeholder="name@company.com" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
              <Input required name="password" type="password" placeholder="••••••••" />
            </div>

            <Button disabled={isLoading} type="submit" size="lg" className="mt-4 w-full">
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
