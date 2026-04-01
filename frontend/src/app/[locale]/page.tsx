"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  TrendingUp,
  FileText,
  Zap,
  Globe2,
  ChevronRight,
  Lock,
  LineChart,
  Leaf,
  Users,
  Building2,
} from "lucide-react";

/* ── Animated ESG Score Ring (CSS only) ──────────────────────────── */
function ScoreRing({
  label,
  score,
  color,
  delay = "0s",
}: {
  label: string;
  score: number;
  color: string;
  delay?: string;
}) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="42" fill="none" stroke="#f1f5f9" strokeWidth="6" />
          <circle
            cx="48"
            cy="48"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1)",
              transitionDelay: delay,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-extrabold text-slate-900">{score}</span>
        </div>
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
}

/* ── Mini bar chart (CSS) ────────────────────────────────────────── */
function MiniChart() {
  const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];
  return (
    <div className="flex items-end gap-[3px] h-12">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[6px] rounded-full bg-emerald-500/80"
          style={{
            height: `${h}%`,
            opacity: 0.4 + (h / 100) * 0.6,
            animation: `fadeInUp 0.5s ease-out ${0.1 * i}s both`,
          }}
        />
      ))}
    </div>
  );
}

const featureIcons: Record<string, React.ReactNode> = {
  ai: <Brain className="h-5 w-5" />,
  frameworks: <Layers className="h-5 w-5" />,
  scoring: <TrendingUp className="h-5 w-5" />,
  reports: <FileCheck className="h-5 w-5" />,
  dashboard: <LayoutDashboard className="h-5 w-5" />,
  security: <Shield className="h-5 w-5" />,
};

const featureKeys = ["ai", "frameworks", "scoring", "reports", "dashboard", "security"] as const;

const frameworks = [
  { name: "GRI", full: "Global Reporting Initiative" },
  { name: "SASB", full: "Sustainability Accounting" },
  { name: "TCFD", full: "Climate Disclosures" },
  { name: "CDP", full: "Carbon Disclosure Project" },
  { name: "SDGs", full: "UN Sustainable Goals" },
  { name: "ISSB", full: "Sustainability Standards" },
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes countPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>

      <Navbar />

      <main className="flex-1">
        {/* ════════════════════════════════════════════════════════════════
            HERO — Split: Text Left + Animated Stats Right
        ════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 right-0 w-[50%] h-full bg-slate-50/80" />
            <div className="absolute bottom-0 left-[45%] w-px h-[60%] bg-gradient-to-t from-slate-200/60 to-transparent" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[calc(100vh-4rem)] py-16 lg:py-0">
              {/* Left — Text */}
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px w-8 bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
                    ESG Intelligence Platform
                  </span>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem] leading-[1.1] mb-6">
                  {t("hero.title")}
                </h1>

                <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-md">
                  {t("hero.subtitle")}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-12">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="h-12 px-8 text-sm font-bold rounded-lg"
                    >
                      {t("hero.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 px-8 text-sm font-semibold rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      {t("hero.cta2")}
                    </Button>
                  </Link>
                </div>

                {/* Trust numbers */}
                <div className="flex gap-10">
                  {[
                    { value: "500+", label: "Companies" },
                    { value: "10M+", label: "Data Points" },
                    { value: "99.9%", label: "Uptime" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-2xl font-extrabold text-slate-900">{item.value}</div>
                      <div className="text-xs font-medium text-slate-400 mt-0.5">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Animated ESG Stats Panel */}
              <div className="relative" style={{ animation: "slideIn 0.8s ease-out 0.3s both" }}>
                {/* Main card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="text-sm font-bold text-slate-900">ESG Overview</div>
                      <div className="text-xs text-slate-400 mt-0.5">Q1 2026 · Consolidated</div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-bold text-emerald-700">On Track</span>
                    </div>
                  </div>

                  {/* Score Rings */}
                  <div className="flex items-center justify-between mb-8 px-4">
                    <ScoreRing label="Environmental" score={87} color="#16a34a" delay="0.3s" />
                    <ScoreRing label="Social" score={72} color="#2563eb" delay="0.6s" />
                    <ScoreRing label="Governance" score={91} color="#f59e0b" delay="0.9s" />
                  </div>

                  {/* Overall score bar */}
                  <div className="rounded-xl bg-slate-50 p-5 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Score</span>
                      <span className="text-2xl font-extrabold text-slate-900">83.4</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500"
                        style={{
                          width: "83.4%",
                          transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                          transitionDelay: "1s",
                        }}
                      />
                    </div>
                  </div>

                  {/* Mini metrics row */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Indicators", value: "147/156", icon: <BarChart3 className="h-3.5 w-3.5" /> },
                      { label: "Compliance", value: "94%", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                      { label: "Trend", value: "+12%", icon: <TrendingUp className="h-3.5 w-3.5" /> },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
                          {m.icon}
                          <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                        </div>
                        <div className="text-sm font-extrabold text-slate-900">{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating mini card — Framework coverage */}
                <div
                  className="absolute -bottom-4 -left-6 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-lg shadow-slate-200/40"
                  style={{ animation: "fadeInUp 0.6s ease-out 1.2s both" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">GRI Coverage</div>
                      <div className="text-[11px] text-slate-400">86% complete</div>
                    </div>
                  </div>
                </div>

                {/* Floating mini card — Activity */}
                <div
                  className="absolute -top-3 -right-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-lg shadow-slate-200/40"
                  style={{ animation: "fadeInUp 0.6s ease-out 1.5s both" }}
                >
                  <div className="flex items-center gap-3">
                    <MiniChart />
                    <div>
                      <div className="text-xs font-bold text-slate-900">+23%</div>
                      <div className="text-[11px] text-slate-400">vs last quarter</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            TRUST BAR — Frameworks
        ════════════════════════════════════════════════════════════════ */}
        <section className="border-y border-slate-100 bg-slate-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 shrink-0">
                Standards & Frameworks
              </span>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
                {frameworks.map((fw) => (
                  <span key={fw.name} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-default">
                    {fw.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FEATURES — Clean 3-col grid
        ════════════════════════════════════════════════════════════════ */}
        <section id="features" className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <div className="max-w-2xl mb-16">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
                  Capabilities
                </span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4">
                {t("features.title")}
              </h2>
              <p className="text-base text-slate-500 leading-relaxed max-w-lg">
                {t("features.subtitle")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3 rounded-2xl overflow-hidden border border-slate-100">
              {featureKeys.map((key, i) => (
                <div
                  key={key}
                  className="bg-white p-8 group hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors mb-5">
                    {featureIcons[key]}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {t(`features.${key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            HOW IT WORKS — Numbered steps, horizontal
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-slate-50 border-y border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-blue-500" />
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">
                  Process
                </span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4">
                De dados brutos a relatórios prontos
              </h2>
              <p className="text-base text-slate-500 leading-relaxed max-w-lg">
                Três passos para transformar seus dados ESG em insights acionáveis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: <FileText className="h-5 w-5" />,
                  title: "Upload de Documentos",
                  desc: "Envie PDFs, planilhas ou insira dados manualmente. Aceitamos todos os formatos ESG comuns.",
                },
                {
                  step: "02",
                  icon: <Brain className="h-5 w-5" />,
                  title: "Processamento Inteligente",
                  desc: "Extração, classificação e mapeamento automático para GRI, SASB, TCFD e outros frameworks.",
                },
                {
                  step: "03",
                  icon: <BarChart3 className="h-5 w-5" />,
                  title: "Relatórios & Insights",
                  desc: "Relatórios prontos para auditoria, monitoramento de scores e identificação de melhorias.",
                },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="flex items-start gap-5">
                    <div className="shrink-0">
                      <span className="block text-5xl font-extrabold text-slate-200 leading-none">{item.step}</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 mb-4">
                        {item.icon}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            METRICS BAND — Dark section with key numbers
        ════════════════════════════════════════════════════════════════ */}
        <section className="bg-slate-900 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "98%", label: "Data Accuracy", icon: <Zap className="h-5 w-5" /> },
                { value: "3x", label: "Faster Reports", icon: <TrendingUp className="h-5 w-5" /> },
                { value: "150+", label: "ESG Indicators", icon: <LineChart className="h-5 w-5" /> },
                { value: "24/7", label: "Monitoring", icon: <Shield className="h-5 w-5" /> },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center text-slate-600 mb-3">
                    {stat.icon}
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">{stat.value}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            WHY ESGenius — Split section
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left — reasons */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700">
                    Why ESGenius
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-12">
                  Construído para equipes ESG que levam compliance a sério
                </h2>

                <div className="space-y-8">
                  {[
                    {
                      icon: <Leaf className="h-4.5 w-4.5" />,
                      title: "Multi-Framework Coverage",
                      desc: "GRI, SASB, TCFD, CDP, ISSB — todos mapeados automaticamente a partir de um único dataset.",
                    },
                    {
                      icon: <Lock className="h-4.5 w-4.5" />,
                      title: "Enterprise Security",
                      desc: "SOC 2 compliant, dados encriptados em repouso e em trânsito, controles de acesso granulares.",
                    },
                    {
                      icon: <Users className="h-4.5 w-4.5" />,
                      title: "Colaboração em Equipe",
                      desc: "Roles e permissões por empresa, audit trails completos, workflows de aprovação.",
                    },
                    {
                      icon: <Building2 className="h-4.5 w-4.5" />,
                      title: "Multi-Company Management",
                      desc: "Gerencie o ESG de todo o grupo empresarial a partir de uma única plataforma centralizada.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — visual card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 lg:p-10">
                <div className="space-y-6">
                  {/* Coverage bars */}
                  {[
                    { fw: "GRI Standards", pct: 94, color: "bg-emerald-500" },
                    { fw: "SASB", pct: 88, color: "bg-blue-500" },
                    { fw: "TCFD", pct: 91, color: "bg-amber-500" },
                    { fw: "CDP", pct: 76, color: "bg-violet-500" },
                    { fw: "ISSB", pct: 82, color: "bg-teal-500" },
                  ].map((item) => (
                    <div key={item.fw}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">{item.fw}</span>
                        <span className="text-sm font-extrabold text-slate-900">{item.pct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Coverage</span>
                    <span className="text-lg font-extrabold text-slate-900">86.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PRICING
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-slate-50 border-y border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-8 bg-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
                  Pricing
                </span>
                <div className="h-px w-8 bg-emerald-500" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl mb-4">
                {t("pricing.title")}
              </h2>
              <p className="text-base text-slate-500 leading-relaxed">{t("pricing.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Professional */}
              <div className="relative rounded-2xl bg-white border-2 border-emerald-500 shadow-xl shadow-emerald-100/50 overflow-hidden">
                <div className="bg-emerald-500 px-8 py-3 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {t("pricing.popular")}
                  </span>
                </div>
                <div className="p-8">
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                    {t("pricing.professional.name")}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    {t("pricing.professional.desc")}
                  </p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      {t("pricing.professional.price")}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">{t("pricing.professional.period")}</span>
                  </div>
                  <Link href="/register" className="block mb-8">
                    <Button className="w-full h-11 font-bold text-sm rounded-lg">
                      {t("pricing.professional.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Separator className="mb-6" />
                  <ul className="space-y-3">
                    {Array.from({ length: 7 }, (_, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600">
                          {t(`pricing.professional.feature${i + 1}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Enterprise */}
              <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all">
                <div className="bg-slate-100 px-8 py-3 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Enterprise
                  </span>
                </div>
                <div className="p-8">
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                    {t("pricing.enterprise.name")}
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    {t("pricing.enterprise.desc")}
                  </p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      {t("pricing.enterprise.price")}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">{t("pricing.enterprise.period")}</span>
                  </div>
                  <Link href="/register" className="block mb-8">
                    <Button variant="outline" className="w-full h-11 font-bold text-sm rounded-lg border-slate-300">
                      {t("pricing.enterprise.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Separator className="mb-6" />
                  <ul className="space-y-3">
                    {Array.from({ length: 8 }, (_, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600">
                          {t(`pricing.enterprise.feature${i + 1}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl mb-6">
              {t("cta.title")}
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/register">
                <Button size="lg" className="h-12 px-10 text-sm font-bold rounded-lg">
                  {t("cta.button")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" size="lg" className="h-12 px-8 text-sm font-semibold text-slate-600 hover:text-slate-900">
                  Ver planos
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-6 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span>SOC 2</span>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>Encrypted</span>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
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
