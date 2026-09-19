"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Dashboard", href: "/dashboard/industry" },
  { label: "Post a Job", href: "/dashboard/industry/jobs/new" },
  { label: "Applications", href: "/dashboard/industry/applications" },
];

export default function IndustryNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentPage = LINKS.find((link) =>
    link.href === "/dashboard/industry"
      ? pathname === "/dashboard/industry"
      : pathname.startsWith(link.href)
  )?.label ?? "Dashboard";

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-start justify-center py-0">
        <div className="w-full bg-gradient-to-r from-violet-500/40 via-white/10 to-blue-500/40 p-px shadow-[0_0_70px_-18px_rgba(124,58,237,0.55)]">
          <div
            className="flex items-center bg-black/60 backdrop-blur-2xl"
            style={{ minHeight: "48px", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px" }}
          >
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <img src="/careergate.svg" alt="CareerGate" className="h-5 w-5" />
              <span className="text-xl font-bold tracking-tight text-white">CareerGate</span>
            </Link>

            {/* Separator - desktop only */}
            <span className="hidden md:block mx-4 h-6 w-px shrink-0 bg-gradient-to-b from-transparent via-white/15 to-transparent" />

            {/* Desktop Links */}
            <div className="hidden md:flex flex-1 items-center justify-center gap-10">
              {LINKS.map((link) => {
                const isActive =
                  link.href === "/dashboard/industry"
                    ? pathname === "/dashboard/industry"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative z-10 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.15em] transition-colors duration-300 ${
                      isActive ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {isActive && (
                      <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-violet-400/10 blur-md" />
                    )}
                    {link.label}
                    <span className={`absolute -bottom-px left-1/2 h-px -translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-violet-300 to-transparent transition-all duration-500 ${
                      isActive ? "w-8 opacity-100 shadow-[0_0_8px_rgba(167,139,250,0.8)]" : "w-0 opacity-0"
                    }`} />
                  </Link>
                );
              })}
            </div>

            {/* Mobile: page name center */}
            <span className="md:hidden flex-1 text-center text-sm font-semibold uppercase tracking-widest text-white">
              {currentPage}
            </span>

            {/* Mobile: hamburger */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-2 ml-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-6 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-[48px] left-0 right-0 z-20 bg-black/90 backdrop-blur-xl border-t border-white/10 flex flex-col py-4 px-6 gap-2">
          {LINKS.map((link) => {
            const isActive =
              link.href === "/dashboard/industry"
                ? pathname === "/dashboard/industry"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`text-left text-sm font-medium uppercase tracking-widest py-2 border-b border-white/5 transition-colors ${
                  isActive ? "text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}