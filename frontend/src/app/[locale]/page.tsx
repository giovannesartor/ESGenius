"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  BarChart3,
  FileCheck,
  Shield,
  LayoutDashboard,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Globe,
  TrendingUp,
  FileText,
} from "lucide-react";

const featureIcons: Record<string, React.ReactNode> = {
  ai: <Brain className="h-6 w-6" />,
  frameworks: <Layers className="h-6 w-6" />,
  scoring: <TrendingUp className="h-6 w-6" />,
  reports: <FileCheck className="h-6 w-6" />,
  dashboard: <LayoutDashboard className="h-6 w-6" />,
  security: <Shield className="h-6 w-6" />,
};

const featureKeys = ["ai", "frameworks", "scoring", "reports", "dashboard", "security"] as const;

const stats = [
  { value: "98%", labelKey: "accuracy" },
  { value: "3x", labelKey: "faster" },
  { value: "150+", labelKey: "indicators" },
  { value: "24/7", labelKey: "monitoring" },
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 via-background to-brand-blue/5" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-green/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium border border-border/50">
                <Sparkles className="mr-2 h-3.5 w-3.5 text-brand-gold" />
                AI-Powered ESG Platform
              </Badge>

              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1]">
                {t("hero.title")}
              </h1>

              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                {t("hero.subtitle")}
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25">
                    {t("hero.cta")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold">
                    {t("hero.cta2")}
                  </Button>
                </Link>
              </div>

              {/* Trust signals */}
              <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <div key={stat.labelKey} className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                      {stat.labelKey === "accuracy" && "Data Accuracy"}
                      {stat.labelKey === "faster" && "Faster Reports"}
                      {stat.labelKey === "indicators" && "ESG Indicators"}
                      {stat.labelKey === "monitoring" && "Monitoring"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Framework Logos */}
        <section className="border-y border-border/40 bg-card/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
              Supports all major ESG frameworks
            </p>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
              {["GRI", "SASB", "TCFD", "CDP", "SDGs"].map((fw) => (
                <div key={fw} className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-muted-foreground/60" />
                  <span className="text-lg font-bold text-muted-foreground/70 tracking-wide">
                    {fw}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("features.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("features.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featureKeys.map((key) => (
                <Card
                  key={key}
                  className="group relative overflow-hidden border-border/50 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-primary/10 p-2.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      {featureIcons[key]}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {t(`features.${key}.title`)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(`features.${key}.desc`)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 sm:py-32 bg-card/50 border-y border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From raw data to audit-ready ESG reports in three steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: <FileText className="h-8 w-8" />,
                  title: "Upload Documents",
                  desc: "Upload PDFs, spreadsheets, or enter data manually. Our system accepts all common ESG data formats.",
                },
                {
                  step: "02",
                  icon: <Brain className="h-8 w-8" />,
                  title: "AI Processing",
                  desc: "DeepSeek AI extracts, classifies, and maps your data to GRI, SASB, and TCFD frameworks automatically.",
                },
                {
                  step: "03",
                  icon: <BarChart3 className="h-8 w-8" />,
                  title: "Reports & Insights",
                  desc: "Generate audit-ready reports, monitor your ESG score in real-time, and identify improvement areas.",
                },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full">
                    <span className="text-6xl font-bold text-muted-foreground/10">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("pricing.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("pricing.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Professional */}
              <Card className="relative border-2 border-primary shadow-lg shadow-primary/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold">
                    {t("pricing.popular")}
                  </Badge>
                </div>
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground">
                    {t("pricing.professional.name")}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("pricing.professional.desc")}
                  </p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{t("pricing.professional.price")}</span>
                    <span className="text-muted-foreground">{t("pricing.professional.period")}</span>
                  </div>
                  <Link href="/register" className="block mt-6">
                    <Button className="w-full h-11 font-semibold">
                      {t("pricing.professional.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <ul className="mt-8 space-y-3">
                    {Array.from({ length: 7 }, (_, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {t(`pricing.professional.feature${i + 1}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Enterprise */}
              <Card className="border border-border/50">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground">
                    {t("pricing.enterprise.name")}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("pricing.enterprise.desc")}
                  </p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{t("pricing.enterprise.price")}</span>
                    <span className="text-muted-foreground">{t("pricing.enterprise.period")}</span>
                  </div>
                  <Link href="/register" className="block mt-6">
                    <Button variant="outline" className="w-full h-11 font-semibold">
                      {t("pricing.enterprise.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <ul className="mt-8 space-y-3">
                    {Array.from({ length: 8 }, (_, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          {t(`pricing.enterprise.feature${i + 1}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 sm:py-32 bg-gradient-to-br from-brand-green/5 via-background to-brand-blue/5">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("cta.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("cta.subtitle")}
            </p>
            <div className="mt-8">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25">
                  {t("cta.button")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
