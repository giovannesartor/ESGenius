"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, useInView } from "framer-motion";
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
  ChevronRight,
  Lock,
  LineChart,
  Leaf,
  Users,
  Building2,
  Star,
  Globe,
  Sparkles,
} from "lucide-react";

/* ── Scroll-animated wrapper ─────────────────────────────────────── */
function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated ESG Score Ring ──────────────────────────────────────── */
function ScoreRing({
  label,
  score,
  color,
  bgColor,
  delay = "0s",
}: {
  label: string;
  score: number;
  color: string;
  bgColor: string;
  delay?: string;
}) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative h-24 w-24">
        {/* Glow ring */}
        <div
          className="absolute inset-1 rounded-full opacity-20 blur-md"
          style={{ backgroundColor: color }}
        />
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" className="stroke-muted" strokeWidth="5" />
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="5"
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
          <span className="text-xl font-extrabold text-foreground">{score}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

/* ── Mini bar chart ────────────────────────────────────────────────── */
function MiniChart() {
  const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];
  return (
    <div className="flex items-end gap-[3px] h-12">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[5px] rounded-sm bg-emerald-500"
          style={{
            height: `${h}%`,
            opacity: 0.3 + (h / 100) * 0.7,
            animation: `fadeInUp 0.5s ease-out ${0.06 * i}s both`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Section Label ──────────────────────────────────────────────────── */
function SectionLabel({ children, color = "emerald" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    blue: "text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/5",
    amber: "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/5",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${colors[color]}`}>
      <Sparkles className="h-3 w-3" />
      {children}
    </span>
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

const featureColors: Record<string, { bg: string; text: string; glow: string }> = {
  ai: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", glow: "group-hover:shadow-violet-500/20" },
  frameworks: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", glow: "group-hover:shadow-blue-500/20" },
  scoring: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", glow: "group-hover:shadow-emerald-500/20" },
  reports: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", glow: "group-hover:shadow-amber-500/20" },
  dashboard: { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", glow: "group-hover:shadow-cyan-500/20" },
  security: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", glow: "group-hover:shadow-rose-500/20" },
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

  const coverageBars = [
    { key: "fwGri", pct: 94, color: "#16a34a" },
    { key: "fwSasb", pct: 88, color: "#2563eb" },
    { key: "fwTcfd", pct: 91, color: "#f59e0b" },
    { key: "fwCdp", pct: 76, color: "#8b5cf6" },
    { key: "fwIssb", pct: 82, color: "#06b6d4" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        .hero-grid {
          background-image: radial-gradient(circle, rgba(22,163,74,0.06) 1px, transparent 1px);
          background-size: 32px 32px;
        }
        .hero-radial {
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(22,163,74,0.12), transparent);
        }
        .feature-card:hover .feature-icon {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
      `}</style>

      <Navbar />

      <main className="flex-1">
        {/* ════════════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-background">
          {/* Background layers */}
          <div className="absolute inset-0 -z-10 hero-grid" />
          <div className="absolute inset-0 -z-10 hero-radial" />
          <div className="absolute top-0 right-0 -z-10 w-[55%] h-full bg-gradient-to-l from-muted/60 to-transparent" />
          <div className="absolute bottom-0 left-[48%] -z-10 w-px h-[55%] bg-gradient-to-t from-border/80 to-transparent" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center min-h-[calc(100vh-4rem)] py-16 lg:py-0">
              {/* Left — Text */}
              <motion.div
                className="max-w-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="mb-8">
                  <Badge
                    variant="secondary"
                    className="rounded-full border border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400 px-3.5 py-1.5 text-[11px] font-bold tracking-widest uppercase"
                  >
                    <div className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t("home.heroBadge")}
                  </Badge>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] leading-[1.1] mb-6">
                  {t("hero.title")}
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-md">
                  {t("hero.subtitle")}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-12">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="h-12 px-8 text-sm font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] transition-all duration-200"
                    >
                      {t("hero.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 px-8 text-sm font-semibold rounded-xl hover:bg-muted/70 transition-all duration-200"
                    >
                      {t("hero.cta2")}
                    </Button>
                  </Link>
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {["#16a34a", "#2563eb", "#f59e0b", "#8b5cf6"].map((c, i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: c }}
                      >
                        {["AB", "CD", "EF", "GH"][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 mb-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">500+</span> empresas confiam na plataforma
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Right — Animated ESG Stats Panel */}
              <motion.div
                className="relative hidden lg:block"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
              >
                {/* Main card */}
                <div className="rounded-2xl border border-border/80 bg-card p-8 shadow-2xl shadow-black/8 dark:shadow-black/30 backdrop-blur-sm">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="text-sm font-bold text-foreground">{t("home.statsTitle")}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{t("home.statsSubtitle")}</div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{t("home.statsOnTrack")}</span>
                    </div>
                  </div>

                  {/* Score Rings */}
                  <div className="flex items-center justify-around mb-8 px-2">
                    <ScoreRing label={t("home.environmental")} score={87} color="#16a34a" bgColor="bg-emerald-500/10" delay="0.3s" />
                    <ScoreRing label={t("home.social")} score={72} color="#2563eb" bgColor="bg-blue-500/10" delay="0.6s" />
                    <ScoreRing label={t("home.governance")} score={91} color="#f59e0b" bgColor="bg-amber-500/10" delay="0.9s" />
                  </div>

                  {/* Overall score bar */}
                  <div className="rounded-xl bg-muted/60 border border-border/50 p-5 mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("home.overallScore")}</span>
                      <span className="text-2xl font-extrabold text-foreground tabular-nums">83.4</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500"
                        style={{
                          width: "83.4%",
                          transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                          transitionDelay: "1s",
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-muted-foreground/60">0</span>
                      <span className="text-[10px] text-muted-foreground/60">100</span>
                    </div>
                  </div>

                  {/* Mini metrics row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: t("home.indicators"), value: "147/156", icon: <BarChart3 className="h-3.5 w-3.5" />, color: "text-emerald-600 bg-emerald-500/8" },
                      { label: t("home.compliance"), value: "94%", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-blue-600 bg-blue-500/8" },
                      { label: t("home.trend"), value: "+12%", icon: <TrendingUp className="h-3.5 w-3.5" />, color: "text-amber-600 bg-amber-500/8" },
                    ].map((m) => (
                      <div key={m.label} className={`rounded-lg ${m.color} px-3 py-2.5 text-center`}>
                        <div className="flex items-center justify-center mb-1">
                          {m.icon}
                        </div>
                        <div className="text-sm font-extrabold text-foreground tabular-nums">{m.value}</div>
                        <div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating mini card — Framework coverage */}
                <div
                  className="absolute -bottom-5 -left-8 rounded-xl border border-border bg-card px-4 py-3.5 shadow-xl shadow-black/8 dark:shadow-black/25"
                  style={{ animation: "fadeInUp 0.6s ease-out 1.2s both" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t("home.griCoverage")}</div>
                      <div className="text-[10px] text-muted-foreground">{t("home.griComplete")}</div>
                    </div>
                  </div>
                </div>

                {/* Floating mini card — Activity */}
                <div
                  className="absolute -top-4 -right-6 rounded-xl border border-border bg-card px-4 py-3.5 shadow-xl shadow-black/8 dark:shadow-black/25"
                  style={{ animation: "fadeInUp 0.6s ease-out 1.5s both" }}
                >
                  <div className="flex items-center gap-3">
                    <MiniChart />
                    <div>
                      <div className="text-xs font-bold text-foreground">{t("home.quarterChange")}</div>
                      <div className="text-[10px] text-muted-foreground">{t("home.vsLastQuarter")}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            TRUST BAR — Frameworks
        ════════════════════════════════════════════════════════════════ */}
        <section className="border-y border-border/80 bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70 shrink-0">
                {t("home.frameworksLabel")}
              </span>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex flex-wrap items-center justify-center gap-2">
                {frameworks.map((fw) => (
                  <span
                    key={fw.name}
                    className="inline-flex items-center rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/60 transition-all duration-150 cursor-default"
                  >
                    {fw.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FEATURES — Grid
        ════════════════════════════════════════════════════════════════ */}
        <section id="features" className="py-24 sm:py-32 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <FadeIn className="max-w-2xl mb-16">
              <div className="mb-4">
                <SectionLabel color="emerald">{t("home.capabilitiesLabel")}</SectionLabel>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mb-4">
                {t("features.title")}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
                {t("features.subtitle")}
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border/80 shadow-sm">
              {featureKeys.map((key, i) => {
                const colors = featureColors[key];
                return (
                  <FadeIn key={key} delay={i * 0.07}>
                    <div className="feature-card bg-card p-8 group hover:bg-muted/30 transition-colors duration-200 h-full cursor-default">
                      <div
                        className={`feature-icon inline-flex h-11 w-11 items-center justify-center rounded-xl ${colors.bg} ${colors.text} mb-5 transition-transform duration-200`}
                      >
                        {featureIcons[key]}
                      </div>
                      <h3 className="text-sm font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {t(`features.${key}.title`)}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t(`features.${key}.desc`)}
                      </p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-muted/40 border-y border-border/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="max-w-2xl mb-16">
              <div className="mb-4">
                <SectionLabel color="blue">{t("home.processLabel")}</SectionLabel>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mb-4">
                {t("home.howItWorksTitle")}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed max-w-lg">
                {t("home.howItWorksSubtitle")}
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div className="absolute top-8 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-emerald-500/40 via-blue-500/40 to-amber-500/40 hidden md:block" />

              {[
                {
                  step: "01",
                  icon: <FileText className="h-5 w-5" />,
                  title: t("home.step1Title"),
                  desc: t("home.step1Desc"),
                  color: "border-emerald-500/30 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400",
                  num: "text-emerald-500/20",
                },
                {
                  step: "02",
                  icon: <Brain className="h-5 w-5" />,
                  title: t("home.step2Title"),
                  desc: t("home.step2Desc"),
                  color: "border-blue-500/30 bg-blue-500/8 text-blue-600 dark:text-blue-400",
                  num: "text-blue-500/20",
                },
                {
                  step: "03",
                  icon: <BarChart3 className="h-5 w-5" />,
                  title: t("home.step3Title"),
                  desc: t("home.step3Desc"),
                  color: "border-amber-500/30 bg-amber-500/8 text-amber-600 dark:text-amber-400",
                  num: "text-amber-500/20",
                },
              ].map((item, i) => (
                <FadeIn key={item.step} delay={i * 0.15}>
                  <div className="relative bg-card rounded-2xl border border-border/80 p-7 hover:shadow-md hover:border-border transition-all duration-200">
                    {/* Step number watermark */}
                    <div className={`absolute top-4 right-5 text-7xl font-extrabold leading-none select-none pointer-events-none ${item.num}`}>
                      {item.step}
                    </div>
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${item.color} mb-5`}>
                      {item.icon}
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            METRICS BAND
        ════════════════════════════════════════════════════════════════ */}
        <FadeIn>
          <section className="relative bg-slate-900 dark:bg-slate-950 py-20 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-transparent to-blue-950/30" />
            <div className="absolute inset-0 hero-grid opacity-20" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {[
                  { value: "98%", label: t("home.metricAccuracy"), icon: <Zap className="h-5 w-5" />, color: "text-emerald-400 bg-emerald-400/10" },
                  { value: "3x", label: t("home.metricFaster"), icon: <TrendingUp className="h-5 w-5" />, color: "text-blue-400 bg-blue-400/10" },
                  { value: "150+", label: t("home.metricIndicators"), icon: <LineChart className="h-5 w-5" />, color: "text-amber-400 bg-amber-400/10" },
                  { value: "24/7", label: t("home.metricMonitoring"), icon: <Shield className="h-5 w-5" />, color: "text-violet-400 bg-violet-400/10" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center group">
                    <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${stat.color} mb-4 mx-auto border border-white/5`}>
                      {stat.icon}
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1.5 tabular-nums">{stat.value}</div>
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ════════════════════════════════════════════════════════════════
            WHY ESG360
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left — reasons */}
              <FadeIn>
                <div className="mb-4">
                  <SectionLabel color="amber">{t("home.whyLabel")}</SectionLabel>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mb-12">
                  {t("home.whyTitle")}
                </h2>

                <div className="space-y-7">
                  {[
                    {
                      icon: <Leaf className="h-4.5 w-4.5" />,
                      title: t("home.multiFrameworkTitle"),
                      desc: t("home.multiFrameworkDesc"),
                      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10",
                    },
                    {
                      icon: <Lock className="h-4.5 w-4.5" />,
                      title: t("home.securityTitle"),
                      desc: t("home.securityDesc"),
                      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/10",
                    },
                    {
                      icon: <Users className="h-4.5 w-4.5" />,
                      title: t("home.teamTitle"),
                      desc: t("home.teamDesc"),
                      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/10",
                    },
                    {
                      icon: <Building2 className="h-4.5 w-4.5" />,
                      title: t("home.multiCompanyTitle"),
                      desc: t("home.multiCompanyDesc"),
                      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 group">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.color} transition-transform group-hover:scale-105`}>
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </FadeIn>

              {/* Right — coverage card */}
              <FadeIn delay={0.2}>
                <div className="rounded-2xl border border-border/80 bg-card shadow-lg shadow-black/4 dark:shadow-black/20 overflow-hidden">
                  <div className="px-8 pt-8 pb-6 border-b border-border/60">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-foreground">Framework Coverage</h3>
                      <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                        {t("home.averageCoverage")}: 86.2%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Cobertura média por framework ESG</p>
                  </div>
                  <div className="px-8 py-6 space-y-5">
                    {coverageBars.map((item) => (
                      <div key={item.key}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-foreground/80">{t(`home.${item.key}`)}</span>
                          <span className="text-sm font-extrabold text-foreground tabular-nums">{item.pct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PRICING
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-muted/40 border-y border-border/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="max-w-2xl mx-auto text-center mb-16">
              <div className="mb-4 flex justify-center">
                <SectionLabel color="emerald">{t("home.pricingLabel")}</SectionLabel>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl mb-4">
                {t("pricing.title")}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">{t("pricing.subtitle")}</p>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Professional */}
              <FadeIn>
                <div className="relative rounded-2xl bg-card border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 overflow-hidden h-full flex flex-col">
                  {/* Popular ribbon */}
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-8 py-2.5 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white flex items-center justify-center gap-1.5">
                      <Star className="h-3 w-3 fill-white" />
                      {t("pricing.popular")}
                    </span>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-lg font-extrabold text-foreground mb-1">
                      {t("pricing.professional.name")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {t("pricing.professional.desc")}
                    </p>
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-5xl font-extrabold text-foreground tracking-tight">
                        {t("pricing.professional.price")}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">{t("pricing.professional.period")}</span>
                    </div>
                    <Link href="/register" className="block mb-8">
                      <Button className="w-full h-11 font-bold text-sm rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] transition-all">
                        {t("pricing.professional.cta")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Separator className="mb-6 opacity-60" />
                    <ul className="space-y-3 flex-1">
                      {Array.from({ length: 7 }, (_, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {t(`pricing.professional.feature${i + 1}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </FadeIn>

              {/* Enterprise */}
              <FadeIn delay={0.1}>
                <div className="rounded-2xl bg-card border border-border/80 overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-black/6 transition-all duration-300 h-full flex flex-col">
                  <div className="bg-muted/60 px-8 py-2.5 text-center border-b border-border/60">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t("pricing.enterprise.name")}
                    </span>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <h3 className="text-lg font-extrabold text-foreground mb-1">
                      {t("pricing.enterprise.name")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {t("pricing.enterprise.desc")}
                    </p>
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-5xl font-extrabold text-foreground tracking-tight">
                        {t("pricing.enterprise.price")}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">{t("pricing.enterprise.period")}</span>
                    </div>
                    <Link href="/register" className="block mb-8">
                      <Button variant="outline" className="w-full h-11 font-bold text-sm rounded-xl hover:bg-muted/60 transition-all">
                        {t("pricing.enterprise.cta")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Separator className="mb-6 opacity-60" />
                    <ul className="space-y-3 flex-1">
                      {Array.from({ length: 8 }, (_, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {t(`pricing.enterprise.feature${i + 1}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FINAL CTA
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-background relative overflow-hidden">
          <div className="absolute inset-0 -z-10 hero-grid opacity-50" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[600px] h-[400px]" style={{ background: "radial-gradient(ellipse at center, rgba(22,163,74,0.06) 0%, transparent 70%)" }} />

          <FadeIn className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-6 flex justify-center">
              <SectionLabel color="emerald">Começar agora</SectionLabel>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl mb-6">
              {t("cta.title")}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <Link href="/register">
                <Button size="lg" className="h-12 px-10 text-sm font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.02] transition-all duration-200">
                  {t("cta.button")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" size="lg" className="h-12 px-8 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-xl">
                  {t("home.viewPlans")}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {[
                { icon: <Shield className="h-3.5 w-3.5" />, label: t("home.trustSoc2") },
                { icon: <Lock className="h-3.5 w-3.5" />, label: t("home.trustEncrypted") },
                { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: t("home.trustUptime99") },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  {i > 0 && <div className="h-3.5 w-px bg-border hidden sm:block" />}
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground/60">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </section>
      </main>

      <Footer />
    </div>
  );
}
