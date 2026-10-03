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
    <div
      className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(60rem 60rem at 50% -20%, color-mix(in oklch, var(--accent-primary) 9%, transparent), transparent 60%), radial-gradient(45rem 45rem at 110% 110%, color-mix(in oklch, var(--accent-violet) 7%, transparent), transparent 60%), var(--bg-base)",
      }}
    >
      <Link href="/" className="absolute top-8 left-8 text-2xl font-bold tracking-tight">
        Antigravity
      </Link>
      
      <div className="w-full max-w-md glass-panel p-8 sm:p-10 relative">
        <div className="relative z-10">
<h1 className="text-3xl font-bold mb-2 tracking-tight">Créer votre compte</h1>
          <p className="text-[var(--text-secondary)] mb-8 text-sm">
            Créez votre compte pour configurer vos numéros, votre softphone et vos agents vocaux.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
             <div className="flex flex-col gap-2">
              <label htmlFor="orgName" className="text-sm font-medium text-[var(--text-secondary)]">Nom de l'organisation</label>
              <Input id="orgName" required name="orgName" type="text" placeholder="Acme Corp" />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-[var(--text-secondary)]">Adresse e-mail</label>
              <Input id="email" required name="email" type="email" placeholder="name@company.com" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium text-[var(--text-secondary)]">Mot de passe</label>
              <Input id="password" required name="password" type="password" placeholder="••••••••" minLength={6} />
            </div>

            <div className="flex items-start gap-3">
              <input
                id="acceptLegal"
                name="acceptLegal"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 shrink-0 accent-cyan-500"
              />
              <label htmlFor="acceptLegal" className="text-xs leading-relaxed text-[var(--text-secondary)]">
                J'accepte les{" "}
                <Link href="/terms" className="underline underline-offset-4 hover:text-[var(--text-primary)]">
                  conditions générales
                </Link>
                , la{" "}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-[var(--text-primary)]">
                  politique de confidentialité
                </Link>{" "}
                et la{" "}
                <Link
                  href="/acceptable-use"
                  className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  politique d'usage acceptable
                </Link>
                .
              </label>
            </div>

            <Button disabled={isLoading} type="submit" size="lg" className="mt-4 w-full rounded-full! bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              {isLoading ? "Création du compte..." : "Créer mon compte"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-cyan-500 hover:text-cyan-400 transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
