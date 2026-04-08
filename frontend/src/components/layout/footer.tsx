"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-border/40 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.desc")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("footer.product")}</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer.features")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer.pricing")}
                </Link>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">{t("footer.docs")}</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">{t("footer.api")}</span>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("footer.company")}</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <span className="text-sm text-muted-foreground">{t("footer.about")}</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">{t("footer.blog")}</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">{t("footer.careers")}</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">{t("footer.contact")}</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("footer.legal")}</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">{t("footer.cookies")}</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} ESG360. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
