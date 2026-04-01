"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const t = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Logo size="md" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("nav.features")}
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("nav.pricing")}
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost" size="sm">
              {t("nav.login")}
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">{t("nav.register")}</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-muted-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background p-4 space-y-3">
          <Link
            href="/#features"
            className="block text-sm font-medium text-muted-foreground py-2"
            onClick={() => setMobileOpen(false)}
          >
            {t("nav.features")}
          </Link>
          <Link
            href="/pricing"
            className="block text-sm font-medium text-muted-foreground py-2"
            onClick={() => setMobileOpen(false)}
          >
            {t("nav.pricing")}
          </Link>
          <div className="pt-3 border-t border-border/40 space-y-2">
            <LanguageSwitcher />
            <Link href="/login" className="block">
              <Button variant="outline" size="sm" className="w-full">
                {t("nav.login")}
              </Button>
            </Link>
            <Link href="/register" className="block">
              <Button size="sm" className="w-full">
                {t("nav.register")}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
