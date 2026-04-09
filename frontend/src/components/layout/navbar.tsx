"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X, ChevronRight } from "lucide-react";

export function Navbar() {
  const t = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? "border-b border-border/60 bg-background/90 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-background/60 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="relative flex items-center">
          <Image
            src="/logo-icon.png"
            alt="ESG360"
            width={240}
            height={160}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/#features"
            className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            {t("nav.features")}
          </Link>
          <Link
            href="/pricing"
            className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            {t("nav.pricing")}
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Separator orientation="vertical" className="h-5 mx-1" />
          <Link href="/login">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-sm font-medium">
              {t("nav.login")}
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="h-8 px-4 text-sm font-semibold shadow-sm shadow-primary/20"
            >
              {t("nav.register")}
              <ChevronRight className="ml-1 h-3 w-3 opacity-70" />
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            <Link
              href="/#features"
              className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.features")}
            </Link>
            <Link
              href="/pricing"
              className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {t("nav.pricing")}
            </Link>
          </div>
          <Separator />
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-2">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <Link href="/login" className="block" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" size="sm" className="w-full h-9 text-sm font-medium">
                {t("nav.login")}
              </Button>
            </Link>
            <Link href="/register" className="block" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="w-full h-9 text-sm font-semibold">
                {t("nav.register")}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
