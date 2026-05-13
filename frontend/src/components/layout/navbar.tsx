"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X, ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";

export function Navbar() {
  const t = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [onHero, setOnHero] = useState(true);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      // Hero is roughly viewport height
      setOnHero(y < window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Only render dark nav styles when actually in dark mode on the hero section
  const darkMode = onHero && !mobileOpen && resolvedTheme === "dark";

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-background/92 backdrop-blur-xl shadow-sm"
          : darkMode
          ? "border-b border-transparent bg-transparent"
          : "border-b border-transparent bg-background/80 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo — doubled in size, overflows header without expanding it */}
        <Link href="/" className="relative flex items-center -my-7">
          <Image
            src="/logo-icon.png"
            alt="ESG360"
            width={384}
            height={256}
            className="h-28 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/#features"
            className={`flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              darkMode
                ? "text-slate-400 hover:text-white hover:bg-white/8"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            {t("nav.features")}
          </Link>
          <Link
            href="/pricing"
            className={`flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              darkMode
                ? "text-slate-400 hover:text-white hover:bg-white/8"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            {t("nav.pricing")}
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <div className={darkMode ? "[&_button]:text-slate-400 [&_button:hover]:text-white [&_button]:hover:bg-white/8" : ""}>
            <LanguageSwitcher />
          </div>
          <div className={darkMode ? "[&_button]:text-slate-400 [&_button:hover]:text-white" : ""}>
            <ThemeToggle />
          </div>

          <div className={`h-5 w-px mx-1 ${darkMode ? "bg-white/10" : "bg-border"}`} />

          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 text-sm font-medium transition-colors ${
                darkMode
                  ? "text-slate-400 hover:text-white hover:bg-white/8"
                  : ""
              }`}
            >
              {t("nav.login")}
            </Button>
          </Link>

          <Link href="/register">
            <Button
              size="sm"
              className={`h-8 px-4 text-sm font-bold rounded-xl transition-all hover:scale-[1.02] ${
                darkMode
                  ? "bg-emerald-500 hover:bg-emerald-400 text-white border-0 shadow-lg shadow-emerald-500/25"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20"
              }`}
            >
              {t("nav.register")}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className={`md:hidden flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            darkMode
              ? "text-slate-400 hover:bg-white/8 hover:text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/98 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            <Link
              href="/#features"
              className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.features")}
            </Link>
            <Link
              href="/pricing"
              className="flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.pricing")}
            </Link>
          </div>
          <div className="border-t border-border/40 mx-4" />
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Link href="/login" className="block" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="sm" className="w-full h-10 text-sm font-medium rounded-xl">
                {t("nav.login")}
              </Button>
            </Link>
            <Link href="/register" className="block" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="w-full h-10 text-sm font-bold rounded-xl bg-primary hover:bg-primary/90">
                {t("nav.register")}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
