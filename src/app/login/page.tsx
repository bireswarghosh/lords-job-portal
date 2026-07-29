"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { loginUser } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter email and password"); return; }
    setLoading(true);
    setError(null);

    const res = await loginUser({ email, password });

    if (res.success) {
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      router.push("/dashboard");
    } else {
      setError(res.error || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left: Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        <div className="relative flex flex-col justify-between p-16 w-full">
          <div>
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L12 8" /><path d="M8 6L16 6" /><path d="M6 12L18 12" /><path d="M6 12L6 20" /><path d="M18 12L18 20" /><path d="M6 20L18 20" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">LordsJobs</span>
            </div>
          </div>
          <div className="space-y-6">
            <blockquote className="text-2xl font-light leading-relaxed text-white/90 italic">
              &ldquo;Waste no more time arguing what a good man should be &mdash; be one.&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
                MA
              </div>
              <div>
                <p className="text-sm font-medium text-white">Marcus Aurelius</p>
                <p className="text-xs text-white/60">Meditations</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-white/40">&copy; {new Date().getFullYear()} LordsJobs. All rights reserved.</p>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-blue-900 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L12 8" /><path d="M8 6L16 6" /><path d="M6 12L18 12" /><path d="M6 12L6 20" /><path d="M18 12L18 20" /><path d="M6 20L18 20" />
              </svg>
            </div>
            <span className="text-lg font-bold text-neutral-900">LordsJobs</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
            <p className="text-sm text-neutral-500 mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 placeholder:text-neutral-400 transition-shadow"
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-11 text-sm bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 placeholder:text-neutral-400 transition-shadow"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Demo Login Options */}
            <div className="pt-4 border-t border-neutral-200 mt-6">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2.5">
                Quick Demo Accounts
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setEmail("soyeb.alam@lordshealthcare.org"); setPassword("123456"); }}
                  className="px-3 py-2 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 text-left transition-colors"
                >
                  <div className="font-semibold">Tenant Admin</div>
                  <div className="text-[10px] text-neutral-500 truncate">soyeb.alam@...</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail("appstrice@gmail.com"); setPassword("123456"); }}
                  className="px-3 py-2 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 text-left transition-colors"
                >
                  <div className="font-semibold">Super Admin</div>
                  <div className="text-[10px] text-neutral-500 truncate">appstrice@...</div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
