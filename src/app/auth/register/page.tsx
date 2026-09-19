"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, Briefcase  } from 'lucide-react';
import HomePage from "../../page";

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:border-indigo-300/40 transition-all duration-300';

function Field({ icon: Icon, type, placeholder, value, onChange, right }: any) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={inputCls}
      />
      {right}
    </div>
  );
}

export default function App() {
  const router = useRouter();
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'student', companyName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const transitionTo = (next: 'signup' | 'signin') => {
    if (phase !== 'idle') return;
    setError('');
    setPhase('out');
    setTimeout(() => {
      setMode(next);
      setPhase('in');
      setTimeout(() => setPhase('idle'), 650);
    }, 620);
  };

  const cardAnim =
    phase === 'out'
      ? 'portal-out'
      : phase === 'in'
      ? 'portal-in'
      : '';

  const isSignup = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role, companyName: form.companyName }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Registration failed'); return; }
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", data.redirectPath.includes("industry") ? "industry" : "student");
        window.location.href = "/";
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Login failed'); return; }
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", data.redirectPath.includes("industry") ? "industry" : "student");
        window.location.href = "/";
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <HomePage />
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-hidden bg-black/60">
      <style>{`
        @keyframes portalOut {
          0%   { transform: perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1); opacity: 1; filter: brightness(1); }
          35%  { transform: perspective(1200px) rotateX(6deg) rotateY(-10deg) scale(0.96); filter: brightness(1.6); }
          100% { transform: perspective(1200px) rotateX(14deg) rotateY(-24deg) scale(0.72); opacity: 0; filter: brightness(2.4) blur(6px); }
        }
        @keyframes portalIn {
          0%   { transform: perspective(1200px) rotateX(-14deg) rotateY(24deg) scale(0.72); opacity: 0; filter: brightness(2.4) blur(6px); }
          55%  { transform: perspective(1200px) rotateX(-4deg) rotateY(8deg) scale(0.98); opacity: 1; filter: brightness(1.5) blur(0px); }
          100% { transform: perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1); opacity: 1; filter: brightness(1); }
        }
        .portal-out { animation: portalOut 0.62s cubic-bezier(0.55, 0, 0.85, 0.4) forwards; }
        .portal-in  { animation: portalIn 0.65s cubic-bezier(0.2, 0.8, 0.25, 1) forwards; }
        @keyframes glowPulse {
          0%   { opacity: 0; transform: scale(0.7); }
          40%  { opacity: 1; }
          100% { opacity: 0; transform: scale(1.15); }
        }
        .glow-pulse { animation: glowPulse 1.25s ease-in-out forwards; }
        @keyframes borderFlash {
          0%   { opacity: 0; }
          35%  { opacity: 1; }
          100% { opacity: 0; }
        }
        .border-flash { animation: borderFlash 1.25s ease-in-out forwards; }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -25px); }
        }
        .drift { animation: drift 14s ease-in-out infinite; }
      `}</style>

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="drift absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="drift absolute -bottom-40 -right-24 w-[520px] h-[520px] rounded-full bg-violet-600/15 blur-[130px]" style={{ animationDelay: '-6s' }} />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* Card wrapper */}
      <div className="relative w-full max-w-md" style={{ perspective: '1200px' }}>
        {/* Portal glow burst */}
        {phase !== 'idle' && (
          <div className="glow-pulse absolute -inset-10 rounded-[3rem] bg-[radial-gradient(circle_at_center,rgba(129,140,248,0.5),rgba(99,102,241,0.15)_55%,transparent_75%)] blur-2xl pointer-events-none" />
        )}

        <div
          className={`relative rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ${cardAnim}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Border flash overlay */}
          {phase !== 'idle' && (
            <div className="border-flash absolute -inset-px rounded-3xl border-2 border-indigo-300/80 shadow-[0_0_40px_rgba(129,140,248,0.6),inset_0_0_30px_rgba(129,140,248,0.25)] pointer-events-none" />
          )}

          {/* Top reflection sheen */}
          <div className="absolute inset-x-0 top-0 h-24 rounded-t-3xl bg-gradient-to-b from-white/[0.09] to-transparent pointer-events-none" />
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          <div className="relative p-8 sm:p-10">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-600 shadow-lg shadow-indigo-500/40 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mt-2 text-sm text-white/50">
                {isSignup
                  ? 'Start your journey with a free account'
                  : 'Sign in to continue to your workspace'}
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {isSignup && (
                <Field
                  icon={User}
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={set('name')}
                />
              )}
                            {isSignup && (
                <>
                  {/* Role selector */}
                  <div className="flex rounded-xl border border-white/10 p-1 gap-1">
                    {(['student', 'industry'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, role: r }))}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
                          form.role === r
                            ? 'bg-indigo-500 text-white'
                            : 'text-white/40 hover:text-white'
                        }`}
                      >
                        {r === 'student' ? '🎓 Student' : '🏢 Company'}
                      </button>
                    ))}
                  </div>

                  {form.role === 'industry' && (
                    <Field
                      icon={Briefcase}
                      type="text"
                      placeholder="Company name"
                      value={form.companyName}
                      onChange={set('companyName')}
                    />
                  )}
                </>
              )}

              <Field
                icon={Mail}
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={set('email')}
              />
              <Field
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={set('password')}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              {isSignup && (
                <Field
                  icon={Lock}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={form.confirm}
                  onChange={set('confirm')}
                />
              )}

              {!isSignup && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-indigo-300/80 hover:text-indigo-200 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (isSignup ? 'Creating account…' : 'Signing in…') : (isSignup ? 'Sign Up' : 'Sign In')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
              </button>
            </form>

            {/* Divider */}
            <div className="my-7 flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] uppercase tracking-widest text-white/30">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Switch mode */}
            <button
              onClick={() => transitionTo(isSignup ? 'signin' : 'signup')}
              className="w-full py-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/70 hover:text-white hover:border-indigo-300/40 hover:bg-indigo-500/10 hover:shadow-[0_0_25px_rgba(99,102,241,0.25)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSignup ? (
                <>
                  Already have an account?
                  <span className="font-semibold text-indigo-300 flex items-center gap-1">
                    Sign In <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </>
              ) : (
                <>
                  <ArrowLeft className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="font-semibold text-indigo-300">Back to Sign Up</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Floor reflection */}
        <div className="mx-8 mt-1 h-16 rounded-b-3xl bg-gradient-to-b from-indigo-500/10 to-transparent blur-md scale-y-[-1] opacity-60 pointer-events-none" />
      </div>
    </div>
    </>
  );
}