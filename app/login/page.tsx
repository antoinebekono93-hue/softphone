import Link from "next/link";

export const metadata = {
  title: "Log in | Antigravity",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--apple-bg-primary)] text-[var(--apple-text-primary)] flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 text-2xl font-bold tracking-tight">
        Antigravity
      </Link>
      
      <div className="w-full max-w-md apple-surface p-8 sm:p-10 relative">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2 tracking-tight">Welcome back</h1>
          <p className="text-[var(--apple-text-secondary)] mb-8 text-[15px]">Enter your details to access your dashboard.</p>
          
          <form className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[var(--apple-text-secondary)]">Email</label>
              <input type="email" placeholder="name@company.com" className="w-full bg-[var(--apple-bg-primary)] border border-[var(--apple-border)] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[var(--apple-accent)] transition-colors" />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[var(--apple-text-secondary)]">Password</label>
              <input type="password" placeholder="••••••••" className="w-full bg-[var(--apple-bg-primary)] border border-[var(--apple-border)] rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[var(--apple-accent)] transition-colors" />
            </div>

            <Link href="/dashboard/softphone" className="mt-4 w-full apple-btn text-[15px]">
              Sign In (Demo Bypass)
            </Link>
          </form>

          <p className="mt-8 text-center text-[14px] text-[var(--apple-text-secondary)]">
            Don't have an account? <Link href="/register" className="text-[var(--apple-accent)] hover:text-[var(--apple-accent-hover)] transition-colors">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
