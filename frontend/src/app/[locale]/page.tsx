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
  Star,
  Play,
  Lock,
  LineChart,
  Target,
  Award,
} from "lucide-react";

const featureIcons: Record<string, React.ReactNode> = {
  ai: <Brain className="h-6 w-6" />,
  frameworks: <Layers className="h-6 w-6" />,
  scoring: <TrendingUp className="h-6 w-6" />,
  reports: <FileCheck className="h-6 w-6" />,
  dashboard: <LayoutDashboard className="h-6 w-6" />,
  security: <Shield className="h-6 w-6" />,
};

const featureGradients: Record<string, string> = {
  ai: "from-emerald-500 to-green-600",
  frameworks: "from-blue-500 to-indigo-600",
  scoring: "from-amber-400 to-orange-500",
  reports: "from-teal-500 to-emerald-600",
  dashboard: "from-violet-500 to-purple-600",
  security: "from-slate-500 to-slate-700",
};

const featureKeys = ["ai", "frameworks", "scoring", "reports", "dashboard", "security"] as const;

const stats = [
  { value: "98%", label: "Data Accuracy", icon: <Target className="h-5 w-5" /> },
  { value: "3x", label: "Faster Reports", icon: <Zap className="h-5 w-5" /> },
  { value: "150+", label: "ESG Indicators", icon: <LineChart className="h-5 w-5" /> },
  { value: "24/7", label: "AI Monitoring", icon: <Shield className="h-5 w-5" /> },
];

const frameworks = [
  { name: "GRI", full: "Global Reporting Initiative" },
  { name: "SASB", full: "Sustainability Accounting" },
  { name: "TCFD", full: "Climate Disclosures" },
  { name: "CDP", full: "Carbon Disclosure Project" },
  { name: "SDGs", full: "UN Sustainable Goals" },
  { name: "ISSB", full: "Sustainability Standards" },
];

const trustedLogos = [
  "Fortune 500 Companies",
  "Big4 Audit Firms",
  "Leading ESG Funds",
  "Government Agencies",
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col bg-[#fafbfd]">
      <Navbar />

      <main className="flex-1">
        {/* ════════════════════════════════════════════════════════════════
            HERO — Premium gradient with floating elements
        ════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          {/* Rich layered background */}
          <div className="absolute inset-0 -z-10">
            {/* Main gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-green-50/40 to-blue-50/30" />
            {/* Accent orbs */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-100/50 via-transparent to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/40 via-transparent to-transparent rounded-full blur-3xl" />
            {/* Subtle dot pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: "radial-gradient(circle, #0f172a 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            {/* Decorative lines */}
            <div className="absolute top-32 left-[10%] w-px h-40 bg-gradient-to-b from-transparent via-emerald-300/30 to-transparent" />
            <div className="absolute top-48 right-[15%] w-px h-32 bg-gradient-to-b from-transparent via-blue-300/30 to-transparent" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-24 lg:pt-36 lg:pb-32">
            <div className="mx-auto max-w-4xl text-center">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/80 border border-emerald-200/60 px-5 py-2 text-sm font-medium text-slate-600 shadow-sm shadow-emerald-100/50 backdrop-blur-sm mb-8 hover:shadow-md transition-shadow">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>AI-Powered ESG Intelligence</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-[4.5rem] leading-[1.08] mb-6">
                {t("hero.title").split(" ").slice(0, -2).join(" ")}{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-500 bg-clip-text text-transparent">
                    {t("hero.title").split(" ").slice(-2).join(" ")}
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/40 via-green-400/60 to-teal-400/40 rounded-full blur-sm" />
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10">
                {t("hero.subtitle")}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="h-13 px-10 text-base font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {t("hero.cta")}
                    <ArrowRight className="ml-2 h-4.5 w-4.5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-13 px-10 text-base font-semibold rounded-xl border-slate-200 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-slate-300 transition-all duration-300"
                  >
                    <Play className="mr-2 h-4 w-4 text-emerald-600" />
                    {t("hero.cta2")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats bar — floating card */}
            <div className="mt-20 mx-auto max-w-4xl">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-200/40 via-blue-200/30 to-amber-200/30 rounded-3xl blur-lg" />
                <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200/60 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 border border-white/60">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex flex-col items-center justify-center bg-white py-7 px-4 group hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-3 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
                      <div className="text-xs font-medium text-slate-400 mt-0.5 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            TRUST BAR — Framework logos
        ════════════════════════════════════════════════════════════════ */}
        <section className="border-y border-slate-200/60 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">
              Frameworks & Standards Supported
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {frameworks.map((fw) => (
                <div
                  key={fw.name}
                  className="group flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 px-5 py-3 hover:border-emerald-300/60 hover:bg-emerald-50/30 hover:shadow-sm transition-all duration-300"
                >
                  <Globe2 className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-sm font-bold text-slate-700">{fw.name}</span>
                  <span className="hidden sm:inline text-xs text-slate-400 font-medium">{fw.full}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FEATURES — Premium card grid with gradient icons
        ════════════════════════════════════════════════════════════════ */}
        <section id="features" className="py-24 sm:py-32 bg-[#fafbfd]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <div className="mx-auto max-w-2xl text-center mb-20">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/60 px-4 py-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Features
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl mb-5">
                {t("features.title")}
              </h2>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed">
                {t("features.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featureKeys.map((key, i) => (
                <Card
                  key={key}
                  className="group relative overflow-hidden bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/40 hover:-translate-y-1 transition-all duration-500 rounded-2xl"
                >
                  <CardContent className="p-7">
                    {/* Gradient icon */}
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${featureGradients[key]} text-white shadow-lg shadow-slate-300/30`}
                    >
                      {featureIcons[key]}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        {t(`features.${key}.title`)}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-50 rounded-md px-2 py-0.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {t(`features.${key}.desc`)}
                    </p>

                    {/* Hover accent line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${featureGradients[key]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            HOW IT WORKS — Timeline-style steps
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-white border-y border-slate-200/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-20">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200/60 px-4 py-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider mb-6">
                <Zap className="h-3.5 w-3.5" />
                How it Works
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl mb-5">
                De dados brutos a relatórios prontos
              </h2>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed">
                Três passos simples para transformar seus dados ESG em insights acionáveis
              </p>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
              {/* Connector line */}
              <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px">
                <div className="h-full bg-gradient-to-r from-emerald-300 via-blue-300 to-amber-300 opacity-40" />
                <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-emerald-300 via-blue-300 to-amber-300 opacity-20 blur-sm" />
              </div>

              {[
                {
                  step: "01",
                  icon: <FileText className="h-7 w-7" />,
                  title: "Upload de Documentos",
                  desc: "Envie PDFs, planilhas ou insira dados manualmente. Aceitamos todos os formatos ESG comuns.",
                  gradient: "from-emerald-500 to-green-600",
                  glow: "shadow-emerald-500/20",
                },
                {
                  step: "02",
                  icon: <Brain className="h-7 w-7" />,
                  title: "Processamento com IA",
                  desc: "A IA extrai, classifica e mapeia seus dados para GRI, SASB e TCFD automaticamente.",
                  gradient: "from-blue-500 to-indigo-600",
                  glow: "shadow-blue-500/20",
                },
                {
                  step: "03",
                  icon: <BarChart3 className="h-7 w-7" />,
                  title: "Relatórios & Insights",
                  desc: "Gere relatórios prontos para auditoria, monitore seu score ESG e identifique áreas de melhoria.",
                  gradient: "from-amber-400 to-orange-500",
                  glow: "shadow-amber-500/20",
                },
              ].map((item) => (
                <div key={item.step} className="relative flex flex-col items-center text-center group">
                  {/* Icon with number */}
                  <div className="relative mb-7">
                    <div
                      className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br ${item.gradient} text-white shadow-xl ${item.glow} group-hover:scale-105 transition-transform duration-300`}
                    >
                      {item.icon}
                    </div>
                    <div className="absolute -top-3 -right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-slate-200 text-xs font-extrabold text-slate-700 shadow-md">
                      {item.step.replace("0", "")}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-[280px]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SOCIAL PROOF — Metrics with visual emphasis
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-slate-900 relative overflow-hidden">
          {/* Background texture */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(22,163,74,0.1),transparent)]" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl mb-5">
                Trusted by Industry Leaders
              </h2>
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
                Empresas líderes confiam no ESGenius para seus relatórios ESG
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {trustedLogos.map((logo) => (
                <div
                  key={logo}
                  className="flex items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm py-8 px-6 hover:border-emerald-500/30 hover:bg-slate-800/60 transition-all duration-300"
                >
                  <span className="text-sm font-semibold text-slate-400 text-center">{logo}</span>
                </div>
              ))}
            </div>

            {/* Big metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { value: "500+", label: "Empresas Ativas", sub: "growing monthly" },
                { value: "10M+", label: "Data Points Processados", sub: "and counting" },
                { value: "99.9%", label: "Uptime Garantido", sub: "SLA enterprise" },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <div className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-2">
                    {m.value}
                  </div>
                  <div className="text-base font-semibold text-white mb-1">{m.label}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PRICING PREVIEW
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-[#fafbfd]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-20">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200/60 px-4 py-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-6">
                <Award className="h-3.5 w-3.5" />
                Pricing
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl mb-5">
                {t("pricing.title")}
              </h2>
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed">{t("pricing.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Professional — highlighted */}
              <div className="relative">
                <div className="absolute -inset-[2px] bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 rounded-3xl opacity-100" />
                <div className="relative bg-white rounded-[22px] overflow-hidden">
                  {/* Top accent */}
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-emerald-100 fill-emerald-100" />
                        <span className="text-sm font-bold text-white">{t("pricing.popular")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                      {t("pricing.professional.name")}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                      {t("pricing.professional.desc")}
                    </p>
                    <div className="flex items-baseline gap-1.5 mb-8">
                      <span className="text-5xl font-extrabold text-slate-900 tracking-tight">
                        {t("pricing.professional.price")}
                      </span>
                      <span className="text-sm font-medium text-slate-400">{t("pricing.professional.period")}</span>
                    </div>
                    <Link href="/register" className="block mb-8">
                      <Button className="w-full h-12 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-shadow">
                        {t("pricing.professional.cta")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Separator className="mb-6" />
                    <ul className="space-y-3.5">
                      {Array.from({ length: 7 }, (_, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-slate-600">
                            {t(`pricing.professional.feature${i + 1}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Enterprise */}
              <Card className="rounded-3xl border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="bg-slate-50 px-8 py-4 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-500">Enterprise</span>
                  </div>
                </div>
                <CardContent className="p-8">
                  <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                    {t("pricing.enterprise.name")}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    {t("pricing.enterprise.desc")}
                  </p>
                  <div className="flex items-baseline gap-1.5 mb-8">
                    <span className="text-5xl font-extrabold text-slate-900 tracking-tight">
                      {t("pricing.enterprise.price")}
                    </span>
                    <span className="text-sm font-medium text-slate-400">{t("pricing.enterprise.period")}</span>
                  </div>
                  <Link href="/register" className="block mb-8">
                    <Button variant="outline" className="w-full h-12 font-bold text-sm rounded-xl border-slate-300 hover:bg-slate-50 transition-colors">
                      {t("pricing.enterprise.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Separator className="mb-6" />
                  <ul className="space-y-3.5">
                    {Array.from({ length: 8 }, (_, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600">
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

        {/* ════════════════════════════════════════════════════════════════
            FINAL CTA — Premium gradient section
        ════════════════════════════════════════════════════════════════ */}
        <section className="relative py-28 sm:py-36 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-100/40 to-transparent rounded-full blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: "radial-gradient(circle, #0f172a 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </div>

          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Pill */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/80 border border-emerald-200/60 px-5 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur-sm mb-10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Comece gratuitamente hoje
            </div>

            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl mb-6">
              {t("cta.title")}
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed mb-12 max-w-xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-14 px-10 text-base font-bold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-300"
                >
                  {t("cta.button")}
                  <ArrowRight className="ml-2 h-4.5 w-4.5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" size="lg" className="h-14 px-10 text-base font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-xl transition-all">
                  Ver planos
                  <ChevronRight className="ml-1 h-4.5 w-4.5" />
                </Button>
              </Link>
            </div>

            {/* Trust signal */}
            <div className="mt-12 flex items-center justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                <span>Encrypted Data</span>
              </div>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
