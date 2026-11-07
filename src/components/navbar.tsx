"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  User as UserIcon,
  Bookmark,
  Send,
  ShieldCheck,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from "@/server/actions";

interface NavbarUser {
  id: string;
  email?: string;
}

interface NavbarProfile {
  id: string;
  displayName: string;
  role: string;
}

interface NavbarProps {
  user?: NavbarUser | null;
  profile?: NavbarProfile | null;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
] as const;

export function Navbar({ user, profile }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-close on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Auto-close if viewport grows to lg (>= 1024px)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setMobileMenuOpen(false);
      }
    };
    if (mediaQuery.matches) {
      setMobileMenuOpen(false);
    }
    mediaQuery.addEventListener("change", handleMediaChange);
    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  // Lock body scroll and trap/handle keyboard events
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileMenuOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const dialog = document.getElementById("mobile-menu");
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Focus management: move to Close button on open, return to hamburger on close
  useEffect(() => {
    if (mobileMenuOpen) {
      wasOpenRef.current = true;
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      hamburgerRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-4 z-50 w-full max-w-6xl mx-auto px-3 min-[420px]:px-4 sm:px-6 transition-all">
        {/* Floating Rounded Pill Container */}
        <div className="relative rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md shadow-sm dark:shadow-none px-3 min-[420px]:px-4 sm:px-6 py-2 transition-colors">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
            {/* LEFT CELL */}
            <div className="flex items-center justify-start">
              {/* Mobile/Tablet: ThemeToggle */}
              <div className="lg:hidden flex items-center">
                <ThemeToggle className="min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0" />
              </div>

              {/* Desktop: 4 Nav Links */}
              <nav
                className="hidden lg:flex items-center gap-1.5 lg:gap-2 xl:gap-3"
                aria-label="Primary navigation"
              >
                {navLinks.map(({ href, label }) => {
                  const isActive =
                    href === "/" ? pathname === "/" : pathname.startsWith(href);

                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`px-3 xl:px-3.5 py-1.5 text-xs font-semibold transition-all select-none ${
                        isActive
                          ? "text-brand-600 dark:text-brand-300 bg-brand-50/80 dark:bg-white/10 rounded-full dark:border dark:border-white/20 shadow-2xs dark:shadow-none"
                          : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 rounded-full dark:text-slate-300 dark:hover:text-white dark:border dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* CENTER CELL: Exactly centered logo */}
            <div className="flex items-center justify-center">
              <Link
                href="/"
                aria-label="Startup Showcase Global Home"
                className="group flex items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <Image
                  src="/logo-mark.png"
                  alt="Startup Showcase Global"
                  width={389}
                  height={512}
                  priority
                  className="h-10 lg:h-12 w-auto"
                />
                <span className="sr-only">Startup Showcase Global</span>
              </Link>
            </div>

            {/* RIGHT CELL */}
            <div className="flex items-center justify-end">
              {/* Mobile/Tablet: Hamburger button only */}
              <button
                ref={hamburgerRef}
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden min-w-[40px] min-h-[40px] w-10 h-10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shrink-0"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop: ThemeToggle, Auth, Submit Startup */}
              <div className="hidden lg:flex items-center gap-1.5 lg:gap-2 xl:gap-2.5 shrink-0">
                <ThemeToggle className="min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0" />

                {/* Auth Section */}
                {user ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl dark:rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-expanded={userDropdownOpen}
                    >
                      <div className="w-6 h-6 rounded-lg dark:rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
                        {(profile?.displayName || user.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <span className="inline-block max-w-[120px] truncate">
                        {profile?.displayName || user.email?.split("@")[0]}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {userDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setUserDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-3.5 py-2 border-b border-slate-100 dark:border-white/5">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {profile?.displayName || "User"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {user.email}
                            </p>
                            <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 uppercase">
                              {profile?.role || "community"}
                            </span>
                          </div>

                          <div className="py-1">
                            <Link
                              href={`/u/${user.id}`}
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                            >
                              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span>Public Profile</span>
                            </Link>
                            <Link
                              href="/me/submissions"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                            >
                              <Send className="w-3.5 h-3.5 text-slate-400" />
                              <span>My Submissions</span>
                            </Link>
                            <Link
                              href="/saved"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                            >
                              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                              <span>Saved Startups</span>
                            </Link>
                            {isAdmin && (
                              <Link
                                href="/admin"
                                onClick={() => setUserDropdownOpen(false)}
                                className="flex items-center gap-2 px-3.5 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-semibold"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Admin Review</span>
                              </Link>
                            )}
                          </div>

                          <div className="border-t border-slate-100 dark:border-white/5 pt-1">
                            <form action={signOutAction}>
                              <button
                                type="submit"
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Sign out</span>
                              </button>
                            </form>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-200 dark:rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shadow-xs dark:shadow-none"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      Sign up
                    </Link>
                  </div>
                )}

                {/* Submit Startup Button */}
                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center gap-1.5 min-w-[36px] min-h-[36px] px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold transition-all shadow-xs active:scale-95 bg-slate-900 hover:bg-slate-800 text-white rounded-xl dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 dark:rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 shrink-0"
                  aria-label="Submit Startup"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span>Submit Startup</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Full-Screen Mobile/Tablet Overlay Menu */}
      {mounted && mobileMenuOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
              className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors"
            >
              {/* Top Row: Small Logo + Close Button */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5 shrink-0">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Startup Showcase Global Home"
                  className="group flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-transform duration-200 hover:scale-105 active:scale-95"
                >
                  <Image
                    src="/logo-mark.png"
                    alt="Startup Showcase Global"
                    width={389}
                    height={512}
                    priority
                    className="h-9 w-auto"
                  />
                  <span className="sr-only">Startup Showcase Global</span>
                </Link>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="min-w-[40px] min-h-[40px] w-10 h-10 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Middle: Scrollable Vertical Links */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                  <nav className="flex flex-col" aria-label="Mobile primary navigation">
                    {navLinks.map(({ href, label }) => {
                      const isActive =
                        href === "/" ? pathname === "/" : pathname.startsWith(href);

                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`text-lg font-semibold py-3 px-1 transition-colors ${
                            isActive
                              ? "text-brand-600 dark:text-brand-400"
                              : "text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400"
                          }`}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </nav>

                  {user ? (
                    <div className="pt-2 flex flex-col">
                      <Link
                        href={`/u/${user.id}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`text-lg font-semibold py-3 px-1 transition-colors ${
                          pathname === `/u/${user.id}`
                            ? "text-brand-600 dark:text-brand-400"
                            : "text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400"
                        }`}
                      >
                        Public Profile
                      </Link>
                      <Link
                        href="/me/submissions"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`text-lg font-semibold py-3 px-1 transition-colors ${
                          pathname.startsWith("/me/submissions")
                            ? "text-brand-600 dark:text-brand-400"
                            : "text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400"
                        }`}
                      >
                        My Submissions
                      </Link>
                      <Link
                        href="/saved"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`text-lg font-semibold py-3 px-1 transition-colors ${
                          pathname === "/saved"
                            ? "text-brand-600 dark:text-brand-400"
                            : "text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400"
                        }`}
                      >
                        Saved Startups
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-lg font-semibold py-3 px-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                        >
                          Admin Review
                        </Link>
                      )}
                      <div className="pt-3 pb-1 px-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                        Signed in as{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {user.email}
                        </span>
                      </div>
                      <form action={signOutAction} className="w-full">
                        <button
                          type="submit"
                          className="text-lg font-semibold py-3 px-1 text-rose-600 dark:text-rose-400 hover:opacity-80 transition-opacity text-left w-full"
                        >
                          Sign out
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="pt-2 flex flex-col">
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`text-lg font-semibold py-3 px-1 transition-colors ${
                          pathname === "/login"
                            ? "text-brand-600 dark:text-brand-400"
                            : "text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400"
                        }`}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`text-lg font-semibold py-3 px-1 transition-colors ${
                          pathname === "/signup"
                            ? "text-brand-600 dark:text-brand-400"
                            : "text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400"
                        }`}
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom: Pinned CTA */}
              <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] border-t border-slate-100 dark:border-white/5 shrink-0 bg-white dark:bg-slate-950">
                <Link
                  href="/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-base font-bold transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Submit Startup</span>
                </Link>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
