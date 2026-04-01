"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  TrendingUp,
  FileText,
  Zap,
  Globe2,
  ChevronRight,
} from "lucide-react";

const featureIcons: Record<string, React.ReactNode> = {
  ai: <Brain className="h-5 w-5" />,
  frameworks: <Layers className="h-5 w-5" />,
  scoring: <TrendingUp className="h-5 w-5" />,
  reports: <FileCheck className="h-5 w-5" />,
  dashboard: <LayoutDashboard className="h-5 w-5" />,
  security: <Shield className="h-5 w-5" />,
};

const featureColors: Record<string, string> = {
  ai: "bg-brand-green/10 text-brand-green border border-brand-green/20",
  frameworks: "bg-brand-blue/10 text-brand-blue border border-brand-blue/20",
  scoring: "bg-brand-gold/10 text-brand-gold border border-brand-gold/20",
  reports: "bg-brand-green/10 text-brand-green border border-brand-green/20",
  dashboard: "bg-brand-blue/10 text-brand-blue border border-brand-blue/20",
  security: "bg-violet-500/10 text-violet-600 border border-violet-500/20",
};

const featureKeys = ["ai", "frameworks", "scoring", "reports", "dashboard", "security"] as const;

const stats = [
  { value: "98%", label: "Data Accuracy", icon: <Zap className="h-4 w-4" /> },
  { value: "3×", label: "Faster Reports", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "150+", label: "ESG Indicators", icon: <BarChart3 className="h-4 w-4" /> },
  { value: "24/7", label: "Monitoring", icon: <Shield className="h-4 w-4" /> },
];

const frameworks = [
  { name: "GRI", desc: "Global Reporting Initiative" },
  { name: "SASB", desc: "Sustainability Accounting" },
  { name: "TCFD", desc: "Climate Disclosures" },
  { name: "CDP", desc: "Carbon Disclosure Project" },
  { name: "SDGs", desc: "UN Sustainable Goals" },
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(22,163,74,0.08),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(37,99,235,0.06),transparent)]" />
            {/* Subtle grid */}
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(to right, #0f172a 1px, transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-36">
            <div className="mx-auto max-w-3xl text-center">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm mb-8">
                <span className="flex h-1.5 w-1.5 rounded-full bg-brand-green" />
                <Sparkles className="h-3 w-3 text-brand-gold" />
                AI-Powered ESG Platform
                <ChevronRight className="h-3 w-3 opacity-50" />
              </div>

              {/* Headline */}
              <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-[1.05] mb-6">
                {t("hero.title")}
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10">
                {t("hero.subtitle")}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                  >
                    {t("hero.cta")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 text-sm font-semibold border-border hover:bg-muted/50"
                  >
                    {t("hero.cta2")}
                  </Button>
                </Link>
              </div>

              {/* Stats strip */}
              <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-1 items-center justify-center gap-3 px-6 py-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      {stat.icon}
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold text-foreground leading-none">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Frameworks ─── */}
        <section className="border-y border-border/50 bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 shrink-0">
                Frameworks suportados
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {frameworks.map((fw) => (
                  <div
                    key={fw.name}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2 hover:border-border hover:bg-muted transition-colors"
                  >
                    <Globe2 className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <span className="text-sm font-semibold text-foreground/80">{fw.name}</span>
                    <span className="hidden sm:inline text-xs text-muted-foreground/60">— {fw.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section id="features" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mx-auto max-w-2xl text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-xs font-semibold uppercase tracking-wider">
                Funcionalidades
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                {t("features.title")}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t("features.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featureKeys.map((key, i) => (
                <Card
                  key={key}
                  className="group relative overflow-hidden border-border/60 bg-card hover:border-border hover:shadow-md transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${featureColors[key]} transition-all duration-300`}
                      >
                        {featureIcons[key]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <h3 className="text-sm font-semibold text-foreground">
                            {t(`features.${key}.title`)}
                          </h3>
                          <span className="text-xs font-mono text-muted-foreground/40 font-bold">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t(`features.${key}.desc`)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="py-24 sm:py-32 bg-card border-y border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-xs font-semibold uppercase tracking-wider">
                Como funciona
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                De dados brutos a relatórios prontos
              </h2>
              <p className="text-base text-muted-foreground">
                Três passos simples para transformar seus dados ESG em insights acionáveis
              </p>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Connector line */}
              <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {[
                {
                  step: "01",
                  icon: <FileText className="h-6 w-6" />,
                  title: "Upload de Documentos",
                  desc: "Envie PDFs, planilhas ou insira dados manualmente. Aceitamos todos os formatos ESG comuns.",
                  color: "bg-brand-green/10 text-brand-green border border-brand-green/20",
                },
                {
                  step: "02",
                  icon: <Brain className="h-6 w-6" />,
                  title: "Processamento com IA",
                  desc: "A IA extrai, classifica e mapeia seus dados para GRI, SASB e TCFD automaticamente.",
                  color: "bg-brand-blue/10 text-brand-blue border border-brand-blue/20",
                },
                {
                  step: "03",
                  icon: <BarChart3 className="h-6 w-6" />,
                  title: "Relatórios & Insights",
                  desc: "Gere relatórios prontos para auditoria, monitore seu score ESG e identifique áreas de melhoria.",
                  color: "bg-brand-gold/10 text-brand-gold border border-brand-gold/20",
                },
              ].map((item) => (
                <div key={item.step} className="relative flex flex-col items-center text-center">
                  <div
                    className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl ${item.color} shadow-sm mb-5`}
                  >
                    {item.icon}
                    <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border text-[10px] font-bold text-foreground">
                      {item.step.replace("0", "")}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pricing Preview ─── */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-xs font-semibold uppercase tracking-wider">
                Planos
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                {t("pricing.title")}
              </h2>
              <p className="text-base text-muted-foreground">{t("pricing.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Professional */}
              <div className="relative">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-brand-green via-primary/60 to-brand-blue opacity-40 blur-sm" />
                <Card className="relative border-2 border-primary/40 bg-card shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold mb-3">
                          {t("pricing.popular")}
                        </Badge>
                        <h3 className="text-xl font-bold text-foreground">
                          {t("pricing.professional.name")}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("pricing.professional.desc")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold text-foreground">
                        {t("pricing.professional.price")}
                      </span>
                      <span className="text-sm text-muted-foreground">{t("pricing.professional.period")}</span>
                    </div>
                    <Link href="/register" className="block mb-8">
                      <Button className="w-full h-11 font-semibold text-sm shadow-md shadow-primary/20">
                        {t("pricing.professional.cta")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Separator className="mb-6" />
                    <ul className="space-y-3">
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
              </div>

              {/* Enterprise */}
              <Card className="border border-border/60 bg-card">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <Badge variant="secondary" className="text-xs font-semibold mb-3 opacity-0 pointer-events-none">
                        placeholder
                      </Badge>
                      <h3 className="text-xl font-bold text-foreground">
                        {t("pricing.enterprise.name")}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("pricing.enterprise.desc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-foreground">
                      {t("pricing.enterprise.price")}
                    </span>
                    <span className="text-sm text-muted-foreground">{t("pricing.enterprise.period")}</span>
                  </div>
                  <Link href="/register" className="block mb-8">
                    <Button variant="outline" className="w-full h-11 font-semibold text-sm">
                      {t("pricing.enterprise.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Separator className="mb-6" />
                  <ul className="space-y-3">
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

        {/* ─── CTA ─── */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(22,163,74,0.07),transparent)]" />
            <div className="absolute inset-0 border-y border-border/50" />
          </div>
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm mb-8">
              <span className="flex h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
              Comece gratuitamente hoje
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-base text-muted-foreground mb-10">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-12 px-8 text-sm font-semibold shadow-lg shadow-primary/20"
                >
                  {t("cta.button")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" size="lg" className="h-12 px-8 text-sm font-semibold">
                  Ver planos
                  <ChevronRight className="ml-1 h-4 w-4" />
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
