"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, CheckCircle2, X, HelpCircle } from "lucide-react";

const comparisonFeatures = [
  { key: "companies", pro: "Up to 5", ent: "Unlimited" },
  { key: "frameworks", pro: "GRI, SASB, TCFD", ent: "All + Custom" },
  { key: "reports", pro: "4/year (PDF)", ent: "Unlimited + White-label" },
  { key: "aiExtraction", pro: true, ent: true },
  { key: "esgScoring", pro: "Quarterly", ent: "Real-time" },
  { key: "support", pro: "AI 24/7 + Email", ent: "AI 24/7 + Priority" },
  { key: "api", pro: false, ent: true },
  { key: "sso", pro: false, ent: true },
  { key: "whiteLabelOpt", pro: false, ent: true },
  { key: "extraReports", pro: "$600 each", ent: "Included" },
];

export default function PricingPage() {
  const t = useTranslations();

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
                {t("pricing.badge") || "Pricing"}
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {t("pricing.title")}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("pricing.subtitle")}
              </p>
            </div>

            {/* Plans */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Professional Plan */}
              <Card className="relative border-2 border-primary shadow-xl shadow-primary/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold shadow-md">
                    {t("pricing.popular")}
                  </Badge>
                </div>
                <CardHeader className="pb-0 pt-8 px-8">
                  <h2 className="text-2xl font-bold text-foreground">{t("pricing.professional.name")}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{t("pricing.professional.desc")}</p>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-foreground">{t("pricing.professional.price")}</span>
                      <span className="text-muted-foreground text-sm">{t("pricing.professional.period")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("pricing.professional.monthlyNote")}</p>
                  </div>
                  <Link href="/register" className="block mt-8">
                    <Button className="w-full h-12 font-semibold text-base shadow-lg shadow-primary/25">
                      {t("pricing.professional.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Separator className="my-8" />
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
                    {t("pricing.includedLabel")}
                  </p>
                  <ul className="space-y-3">
                    {Array.from({ length: 8 }, (_, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground">
                          {t(`pricing.professional.feature${i + 1}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("pricing.professional.extrasLabel")}</p>
                    <p className="text-sm text-foreground">{t("pricing.professional.extrasReport")}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-0 pt-8 px-8">
                  <h2 className="text-2xl font-bold text-foreground">{t("pricing.enterprise.name")}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{t("pricing.enterprise.desc")}</p>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-foreground">{t("pricing.enterprise.price")}</span>
                      <span className="text-muted-foreground text-sm">{t("pricing.enterprise.period")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("pricing.enterprise.monthlyNote")}</p>
                  </div>
                  <Link href="/register" className="block mt-8">
                    <Button variant="outline" className="w-full h-12 font-semibold text-base">
                      {t("pricing.enterprise.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Separator className="my-8" />
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
                    {t("pricing.includedLabel")}
                  </p>
                  <ul className="space-y-3">
                    {Array.from({ length: 8 }, (_, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                        <span className="text-sm text-foreground">
                          {t(`pricing.enterprise.feature${i + 1}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                    <p className="text-sm font-semibold text-accent">{t("pricing.enterprise.noExtras")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-card/50 border-y border-border/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground text-center mb-12">
              Feature Comparison
            </h2>

            <div className="rounded-xl border border-border/50 overflow-hidden bg-background">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-muted/50 font-semibold text-sm">
                <span className="text-muted-foreground">Feature</span>
                <span className="text-center text-foreground">Professional</span>
                <span className="text-center text-foreground">Enterprise</span>
              </div>

              {/* Rows */}
              {comparisonFeatures.map((feature, idx) => (
                <div
                  key={feature.key}
                  className={`grid grid-cols-3 gap-4 px-6 py-3.5 text-sm ${
                    idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                  }`}
                >
                  <span className="text-foreground font-medium capitalize">
                    {feature.key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-center text-muted-foreground">
                    {typeof feature.pro === "boolean" ? (
                      feature.pro ? (
                        <CheckCircle2 className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                      )
                    ) : (
                      feature.pro
                    )}
                  </span>
                  <span className="text-center text-muted-foreground">
                    {typeof feature.ent === "boolean" ? (
                      feature.ent ? (
                        <CheckCircle2 className="h-4 w-4 text-accent mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                      )
                    ) : (
                      feature.ent
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ / CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-foreground">Ready to get started?</h2>
            <p className="mt-3 text-muted-foreground">
              Start your 14-day free trial. No credit card required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 font-semibold shadow-lg shadow-primary/25">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="lg" className="h-12 px-8 font-semibold">
                Contact Sales
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
