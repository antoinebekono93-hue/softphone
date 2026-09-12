"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { registerUser } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const orgName = formData.get("orgName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const res = await registerUser({ orgName, email, password });
    
    if (res.error) {
      setError(res.error);
      setIsLoading(false);
      return;
    }

    // Sign in automatically and redirect to onboarding
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: true,
      redirectTo: "/onboarding"
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 text-2xl font-bold tracking-tight">
        Antigravity
      </Link>
      
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 relative">
        <div className="relative z-10">
<h1 className="text-3xl font-bold mb-2 tracking-tight">Create your account</h1>
          <p className="text-[var(--text-secondary)] mb-8 text-sm">Start your 14-day free trial. No credit card required.</p>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
             <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Organization Name</label>
              <Input required name="orgName" type="text" placeholder="Acme Corp" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Email</label>
              <Input required name="email" type="email" placeholder="name@company.com" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
              <Input required name="password" type="password" placeholder="••••••••" minLength={6} />
            </div>

            <Button disabled={isLoading} type="submit" size="lg" className="mt-4 w-full">
              {isLoading ? "Creating account..." : "Continue"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            Already have an account? <Link href="/login" className="text-cyan-500 hover:text-cyan-400 transition-colors">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
