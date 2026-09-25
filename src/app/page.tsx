"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  GraduationCap,
  Briefcase,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

const STUDENT_LINKS = ["Dashboard", "Browse Jobs", "Skills", "Applications", "Assessment", "Scorecard", "Profile"];
const INDUSTRY_LINKS = ["Dashboard", "Post a Job", "Applications"];

const TRAIL_LAYERS = [
  { w: 288, g: "rgba(59,130,246,0.18)", b: 40 },
  { w: 176, g: "rgba(139,92,246,0.32)", b: 24 },
  { w: 96, g: "rgba(221,214,254,0.55)", b: 12 },
];

const EASE = [0.07, 0.14, 0.3];

export default function HomePage() {
  const [active, setActive] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("");
  const [hovering, setHovering] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const linksRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const targetX = useRef(0);
  const currentX = useRef([0, 0, 0]);

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
      setRole(localStorage.getItem("role") ?? "");
    };
    syncAuth();
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      currentX.current = currentX.current.map(
        (x, i) => x + (targetX.current - x) * EASE[i]
      );
      trailRefs.current.forEach((el, i) => {
        if (el) el.style.transform = `translate3d(${currentX.current[i]}px,0,0)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!linksRef.current) return;
    const rect = linksRef.current.getBoundingClientRect();
    targetX.current = e.clientX - rect.left;
  };

  return (
    <div className="relative h-screen w-full overflow-hidden font-sans">
      {/* Background image */}
      <img
        src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2400&auto=format&fit=crop"
        alt="Students collaborating"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050a1f]/80 via-[#0a1230]/75 to-[#050a1f]/90" />
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/60 via-transparent to-blue-950/50" />

      {/* Glow accents */}
      <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[140px]" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-start justify-center py-0">
        <div className="w-full bg-gradient-to-r from-violet-500/40 via-white/10 to-blue-500/40 p-px shadow-[0_0_70px_-18px_rgba(124,58,237,0.55)]">
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-2xl" style={{ minHeight: '48px', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '40px', paddingRight: '12px' }}>

            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <img src="/careergate.svg" alt="CareerGate" className="h-5 w-5" />
              <span className="text-xl font-bold tracking-tight text-white">CareerGate</span>
            </Link>

            <span className="hidden md:block h-6 w-px shrink-0 bg-gradient-to-b from-transparent via-white/15 to-transparent" />

            {/* Links with trail effect */}
            <div
              ref={linksRef}
              onMouseMove={handleMove}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              className="relative hidden md:flex flex-1 items-center justify-center gap-10"
            >
              <div
                className={`pointer-events-none absolute inset-y-0 left-0 transition-opacity duration-500 ${
                  hovering ? "opacity-100" : "opacity-0"
                }`}
              >
                {TRAIL_LAYERS.map((layer, i) => (
                  <div
                    key={i}
                    ref={(el) => { trailRefs.current[i] = el; }}
                    className="absolute inset-y-0 left-0 will-change-transform"
                  >
                    <div
                      className="h-full -translate-x-1/2"
                      style={{
                        width: layer.w,
                        filter: `blur(${layer.b}px)`,
                        background: `linear-gradient(90deg, transparent, ${layer.g}, transparent)`,
                      }}
                    />
                  </div>
                ))}
              </div>

              {(role === "industry" ? INDUSTRY_LINKS : STUDENT_LINKS).map((link) => (
                <button
                  key={link}
                  onClick={() => {
  setActive(link);

  if (!isLoggedIn) {
    window.location.href = "/auth/register";
    return;
  }

  if (role === "industry") {
    if (link === "Dashboard") window.location.href = "/dashboard/industry";
    if (link === "Post a Job") window.location.href = "/dashboard/industry/jobs/new";
    if (link === "Applications") window.location.href = "/dashboard/industry/applications";
  } else {
    if (link === "Dashboard") window.location.href = "/dashboard/student";
    if (link === "Browse Jobs") window.location.href = "/dashboard/student/jobs";
    if (link === "Skills") window.location.href = "/dashboard/student/skills";
    if (link === "Applications") window.location.href = "/dashboard/student/applications";
    if (link === "Assessment") window.location.href = "/dashboard/student/assessment";
    if (link === "Scorecard") window.location.href = "/dashboard/student/scorecard";
    if (link === "Profile") window.location.href = "/dashboard/student/profile";
  }
}}
                  className={`relative z-10 cursor-pointer px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] transition-colors duration-300 ${
  active === link ? "text-white" : "text-zinc-500 hover:text-zinc-200"
}`}
                >
                  {active === link && (
                    <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-violet-400/10 blur-md" />
                  )}
                  {link}
                  <span
                    className={`absolute -bottom-px left-1/2 h-px -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-violet-300 to-transparent transition-all duration-500 ${
                      active === link
                        ? "w-8 opacity-100 shadow-[0_0_8px_rgba(167,139,250,0.8)]"
                        : "w-0 opacity-0"
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Sign Up button */}
            {!isLoggedIn && (
            <Link
              href="/auth/register"
              className="group relative ml-1 shrink-0 hidden md:flex transition-transform duration-500 hover:scale-[1.05] active:scale-[0.98]"
            >
              <span className="absolute -inset-1.5 rounded-full bg-violet-600/50 blur-lg transition-all duration-500 group-hover:-inset-2.5 group-hover:bg-violet-500/60" />
              <span className="absolute -inset-1.5 translate-x-1 rounded-full bg-blue-500/40 blur-md transition-transform duration-500 group-hover:translate-x-2" />
              <span className="relative flex items-center gap-2 rounded-full border border-white/25 bg-gradient-to-b from-indigo-400 via-violet-500 to-violet-800 text-[13px] font-semibold uppercase tracking-[0.18em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" style={{ padding: '2px 10px' }}>
                Sign Up
                <ArrowUpRight className="h-3 w-3 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
            )}

          {/* Hamburger button - mobile only */}
          <button
            className="md:hidden ml-auto mr-3 flex flex-col gap-1.5 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>

          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[48px] left-0 right-0 z-20 bg-black/90 backdrop-blur-xl border-t border-white/10 flex flex-col py-4 px-6 gap-2">
          {(role === "industry" ? INDUSTRY_LINKS : STUDENT_LINKS).map((link) => (
            <button
              key={link}
              onClick={() => {
                setMobileMenuOpen(false);
                if (!isLoggedIn) { window.location.href = "/auth/register"; return; }
                if (role === "industry") {
                  if (link === "Dashboard") window.location.href = "/dashboard/industry";
                  if (link === "Post a Job") window.location.href = "/dashboard/industry/jobs/new";
                  if (link === "Applications") window.location.href = "/dashboard/industry/applications";
                } else {
                  if (link === "Dashboard") window.location.href = "/dashboard/student";
                  if (link === "Browse Jobs") window.location.href = "/dashboard/student/jobs";
                  if (link === "Skills") window.location.href = "/dashboard/student/skills";
                  if (link === "Applications") window.location.href = "/dashboard/student/applications";
                  if (link === "Asessment") window.location.href = "/dashboard/student/assessment";
                  if (link === "Profile") window.location.href = "/dashboard/student/profile";
                }
              }}
              className="text-left text-sm font-medium uppercase tracking-widest text-zinc-300 hover:text-white py-2 border-b border-white/5"
            >
              {link}
            </button>
          ))}
          {!isLoggedIn && (
            <Link href="/auth/register" className="mt-2 text-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 py-2 text-sm font-bold uppercase tracking-widest text-white">
              Sign Up
            </Link>
          )}
        </div>
      )}

      {/* Hero */}
      <main className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex max-w-5xl flex-col items-center"
        >
          <div className="mb-8 inline-flex items-center rounded-full border border-white/10 bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20 px-6 py-2 backdrop-blur-md" style={{ marginBottom: '32px', marginTop: '-50px' }}>
  <span className="bg-gradient-to-r from-violet-300 via-blue-300 to-cyan-300 bg-clip-text text-sm font-semibold uppercase tracking-[0.3em] text-transparent">
    AI-Powered Skill & Career Platform
  </span>
</div>

          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-white md:text-7xl">
            Map Your Skills.{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Land Opportunities.
            </span>
            <br />
            Bridge the{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Gap.
            </span>
          </h1>

          {!isLoggedIn && (
            <div style={{ marginTop: "60px" }} className="flex flex-col items-center gap-4 sm:flex-row">
              <Link
  href={isLoggedIn && role === "student" ? "/dashboard/student/profile" : "/auth/register"}
  className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-base font-bold text-white shadow-xl shadow-cyan-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-400/40"
  style={{ padding: '10px 20px' }}
>
  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
  <GraduationCap className="h-5 w-5" />
  Join as Student
</Link>

<Link
  href={isLoggedIn && role === "industry" ? "/dashboard/industry" : "/auth/register"}
  className="group relative flex items-center gap-3 overflow-hidden rounded-full border border-white/25 bg-white/10 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/40 hover:bg-white/20 hover:shadow-xl hover:shadow-blue-500/20"
  style={{ padding: '10px 20px' }}
>
  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
  <Briefcase className="h-5 w-5" />
  Join as Company
</Link>
          </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}