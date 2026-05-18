"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  FileText,
  FileCheck,
  Shield,
} from "lucide-react";

export default function PricingPage() {
  const t = useTranslations();

  const tiers = [
    { key: "professional" as const, featured: false, icon: <FileText className="h-5 w-5" /> },
    { key: "enterprise" as const, featured: true, icon: <Shield className="h-5 w-5" /> },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="secondary" className="mb-6">
                <HelpCircle className="mr-1.5 h-3 w-3" />
                {t("pricing.badge")}
              </Badge>
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                {t("pricing.title")}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">{t("pricing.subtitle")}</p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  {t("pricing.oneTime")}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-600 dark:text-violet-400">
                  <FileText className="h-3 w-3" />
                  {t("pricing.deliverables")}
                </span>
              </div>
            </div>

            {/* Plans */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {tiers.map((tier) => {
                const isEnt = tier.key === "enterprise";
                return (
                  <Card
                    key={tier.key}
                    className={`relative ${
                      tier.featured
                        ? "border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/10"
                        : "border border-border/60"
                    }`}
                  >
                    {tier.featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white px-4 py-1 text-xs font-black uppercase tracking-wide shadow-md">
                          {t("pricing.popular")}
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-0 pt-9 px-8">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                            isEnt
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {tier.icon}
                        </div>
                        <h2 className="text-2xl font-black text-foreground">
                          {t(`pricing.${tier.key}.name`)}
                        </h2>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(`pricing.${tier.key}.desc`)}
                      </p>
                    </CardHeader>

                    <CardContent className="px-8 pb-9">
                      <div className="mt-7">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black text-foreground tabular">
                            {t(`pricing.${tier.key}.price`)}
                          </span>
                          <span className="text-sm font-semibold text-muted-foreground">
                            {t(`pricing.${tier.key}.period`)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {t(`pricing.${tier.key}.monthlyNote`)}
                        </p>
                      </div>

                      <div
                        className={`mt-6 rounded-xl border p-4 ${
                          isEnt ? "border-emerald-500/20 bg-emerald-500/5" : "border-primary/20 bg-primary/5"
                        }`}
                      >
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                          {t(`pricing.${tier.key}.deliverablesHeader`)}
                        </div>
                        <div className="space-y-2.5">
                          {Array.from({ length: isEnt ? 12 : 8 }, (_, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <FileCheck className={`h-4 w-4 shrink-0 mt-0.5 ${isEnt ? "text-emerald-500" : "text-violet-500"}`} />
                              <span className="text-sm font-semibold text-foreground">
                                {t(`pricing.${tier.key}.deliverable${i + 1}`)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Link href="/register" className="block mt-6">
                        <Button
                          className={`w-full h-12 font-bold text-base ${
                            isEnt
                              ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25"
                              : "shadow-lg shadow-primary/25"
                          }`}
                        >
                          {t(`pricing.${tier.key}.cta`)}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>

                      <Separator className="my-7" />

                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-4">
                        {t("pricing.includedLabel")}
                      </p>
                      <ul className="space-y-2.5">
                        {Array.from({ length: 8 }, (_, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2
                              className={`h-4 w-4 mt-0.5 shrink-0 ${isEnt ? "text-emerald-500" : "text-primary"}`}
                            />
                            <span className="text-sm text-foreground/90">
                              {t(`pricing.${tier.key}.feature${i + 1}`)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {isEnt && (
                        <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {t("pricing.enterprise.noExtras")}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-card/40 border-t border-border/40">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-black text-foreground">{t("cta.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("cta.subtitle")}</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 font-bold shadow-lg shadow-primary/25">
                  {t("cta.button")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="mailto:sales@esg360.digital">
                <Button variant="outline" size="lg" className="h-12 px-8 font-semibold">
                  {t("home.contactSales")}
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
