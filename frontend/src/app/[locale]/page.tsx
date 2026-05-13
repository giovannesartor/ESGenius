"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Lock,
  LineChart,
  Leaf,
  Users,
  Building2,
  Sparkles,
  Globe,
  Star,
  ChevronRight,
  Activity,
  Target,
  Quote,
  X,
  Check,
  Upload,
  Cpu,
  FileBarChart,
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
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay }}
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
  delay = "0s",
}: {
  label: string;
  score: number;
  color: string;
  delay?: string;
}) {
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[88px] w-[88px]">
        <div
          className="absolute inset-2 rounded-full opacity-25 blur-md"
          style={{ backgroundColor: color }}
        />
        <svg className="h-[88px] w-[88px] -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4.5" />
          <circle
            cx="44" cy="44" r="38" fill="none"
            stroke={color} strokeWidth="4.5" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)",
              transitionDelay: delay,
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-white tabular">{score}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      </div>
    </div>
  );
}

/* ── Sparkline chart ────────────────────────────────────────────── */
function Sparkline() {
  const bars = [35, 52, 40, 68, 50, 82, 63, 88, 70, 94, 78, 91];
  return (
    <div className="flex items-end gap-[3px] h-10">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[4px] rounded-sm"
          style={{
            height: `${h}%`,
            backgroundColor: `rgba(16, 185, 129, ${0.25 + (h / 100) * 0.75})`,
            animation: `fadeInUp 0.4s ease-out ${0.05 * i}s both`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Typewriter headline ─────────────────────────────────────────── */
function TypewriterHeadline({
  text,
  className,
  highlightLast = 2,
  speed = 38,
}: {
  text: string;
  className?: string;
  highlightLast?: number;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  const words = text.split(" ");
  const mainWords = words.slice(0, -highlightLast).join(" ");
  const hlWords = words.slice(-highlightLast).join(" ");
  const mainLen = mainWords.length;

  if (done) {
    return (
      <h1 className={className}>
        {mainWords}{" "}
        <span className="text-gradient-emerald">{hlWords}</span>
      </h1>
    );
  }

  const visibleMain = displayed.slice(0, mainLen);
  const visibleHl = displayed.length > mainLen + 1 ? displayed.slice(mainLen + 1) : "";

  return (
    <h1 className={className}>
      {visibleMain}
      {displayed.length <= mainLen ? (
        <span className="animate-pulse text-emerald-500">|</span>
      ) : (
        <>
          {" "}
          <span className="text-gradient-emerald">
            {visibleHl}
            <span className="animate-pulse">|</span>
          </span>
        </>
      )}
    </h1>
  );
}

const frameworks = [
  { name: "GRI", full: "Global Reporting Initiative", pct: 94, color: "#10b981" },
  { name: "SASB", full: "Sustainability Accounting Standards", pct: 88, color: "#3b82f6" },
  { name: "TCFD", full: "Climate-related Disclosures", pct: 91, color: "#f59e0b" },
  { name: "CDP", full: "Carbon Disclosure Project", pct: 76, color: "#8b5cf6" },
  { name: "ISSB", full: "Sustainability Standards Board", pct: 82, color: "#06b6d4" },
  { name: "CSRD", full: "Corporate Sustainability Reporting", pct: 85, color: "#ec4899" },
  { name: "GHG", full: "Greenhouse Gas Protocol", pct: 79, color: "#f97316" },
  { name: "SDGs", full: "UN Sustainable Dev. Goals", pct: 71, color: "#84cc16" },
];

/* ─── Bento Feature Card ─── */
function FeatureCard({
  icon,
  title,
  desc,
  accent,
  large = false,
  extra,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: { bg: string; text: string; border: string; glow: string };
  large?: boolean;
  extra?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bento-card group relative overflow-hidden rounded-2xl border bg-card p-7 ${accent.border} hover:shadow-lg ${className}`}
      style={{ transition: "all 0.25s ease" }}
    >
      {/* Accent glow corner */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)` }}
      />
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${accent.bg} ${accent.text} mb-5 border ${accent.border} transition-transform duration-200 group-hover:scale-110`}>
        {icon}
      </div>
      <h3 className={`font-bold text-foreground mb-2.5 ${large ? "text-base" : "text-sm"}`}>{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      {extra && <div className="mt-5">{extra}</div>}
    </div>
  );
}

const coverageBars = [
  { key: "fwGri", pct: 94, color: "#10b981" },
  { key: "fwSasb", pct: 88, color: "#3b82f6" },
  { key: "fwTcfd", pct: 91, color: "#f59e0b" },
  { key: "fwCdp", pct: 76, color: "#8b5cf6" },
  { key: "fwIssb", pct: 82, color: "#06b6d4" },
];

/* ─── Product Showcase — Interactive tabs ─── */
function ProductShowcase() {
  const t = useTranslations();
  const [active, setActive] = useState(0);

  const tabs = [
    {
      label: t("home.showcaseTab1"),
      title: t("home.showcase1Title"),
      desc: t("home.showcase1Desc"),
      icon: <Upload className="h-4 w-4" />,
      accent: "emerald",
    },
    {
      label: t("home.showcaseTab2"),
      title: t("home.showcase2Title"),
      desc: t("home.showcase2Desc"),
      icon: <Cpu className="h-4 w-4" />,
      accent: "blue",
    },
    {
      label: t("home.showcaseTab3"),
      title: t("home.showcase3Title"),
      desc: t("home.showcase3Desc"),
      icon: <Activity className="h-4 w-4" />,
      accent: "amber",
    },
    {
      label: t("home.showcaseTab4"),
      title: t("home.showcase4Title"),
      desc: t("home.showcase4Desc"),
      icon: <FileBarChart className="h-4 w-4" />,
      accent: "violet",
    },
  ];

  const accentMap: Record<string, { bg: string; text: string; border: string; ring: string; bar: string }> = {
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", ring: "ring-emerald-500/30", bar: "bg-emerald-500" },
    blue:    { bg: "bg-blue-500/10",    text: "text-blue-600 dark:text-blue-400",       border: "border-blue-500/20",    ring: "ring-blue-500/30",    bar: "bg-blue-500" },
    amber:   { bg: "bg-amber-500/10",   text: "text-amber-600 dark:text-amber-400",     border: "border-amber-500/20",   ring: "ring-amber-500/30",   bar: "bg-amber-500" },
    violet:  { bg: "bg-violet-500/10",  text: "text-violet-600 dark:text-violet-400",   border: "border-violet-500/20",  ring: "ring-violet-500/30",  bar: "bg-violet-500" },
  };

  return (
    <section className="py-28 sm:py-36 bg-muted/30 border-y border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="mb-14 max-w-3xl">
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-600 dark:text-violet-400">
              <Sparkles className="h-3 w-3" />
              {t("home.showcaseLabel")}
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl mb-4">
            {t("home.showcaseTitle")}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">{t("home.showcaseSub")}</p>
        </FadeIn>

        <FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Tabs (left) */}
            <div className="lg:col-span-4 space-y-2">
              {tabs.map((tab, i) => {
                const a = accentMap[tab.accent];
                const isActive = active === i;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setActive(i)}
                    className={`w-full text-left rounded-xl border px-5 py-4 transition-all duration-200 ${
                      isActive
                        ? `${a.bg} ${a.border} ring-1 ${a.ring} shadow-md`
                        : "bg-card border-border/60 hover:border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${isActive ? `${a.bg} ${a.text} ${a.border}` : "bg-muted text-muted-foreground border-border/60"}`}>
                        {tab.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-[11px] font-bold uppercase tracking-[0.12em] mb-1 ${isActive ? a.text : "text-muted-foreground/60"}`}>
                          {tab.label}
                        </div>
                        <div className={`text-sm font-bold ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                          {tab.title}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Visual (right) */}
            <div className="lg:col-span-8">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="rounded-2xl border border-border/60 bg-card p-8 shadow-xl shadow-black/5 dark:shadow-black/20 min-h-[420px] flex flex-col"
              >
                <div className="flex items-center justify-between mb-6 pb-5 border-b border-border/40">
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{tabs[active].title}</h3>
                    <p className="text-sm text-muted-foreground max-w-xl">{tabs[active].desc}</p>
                  </div>
                  <div className={`shrink-0 ml-4 h-10 w-10 rounded-lg flex items-center justify-center ${accentMap[tabs[active].accent].bg} ${accentMap[tabs[active].accent].text} border ${accentMap[tabs[active].accent].border}`}>
                    {tabs[active].icon}
                  </div>
                </div>

                {/* Visualizations per tab */}
                <div className="flex-1">
                  {active === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { name: "sustainability_2025.pdf", size: "4.2 MB", type: "PDF", color: "text-emerald-500" },
                        { name: "scope1_2_emissions.xlsx", size: "812 KB", type: "XLSX", color: "text-blue-500" },
                        { name: "diversity_report.pdf", size: "1.8 MB", type: "PDF", color: "text-emerald-500" },
                        { name: "energy_invoices.csv", size: "318 KB", type: "CSV", color: "text-amber-500" },
                      ].map((f) => (
                        <div key={f.name} className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
                          <FileText className={`h-5 w-5 ${f.color}`} />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-foreground truncate">{f.name}</div>
                            <div className="text-[10px] text-muted-foreground">{f.type} · {f.size}</div>
                          </div>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        </div>
                      ))}
                      <div className="sm:col-span-2 rounded-lg border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 px-4 py-6 text-center">
                        <Upload className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Drop more files</div>
                      </div>
                    </div>
                  )}

                  {active === 1 && (
                    <div className="space-y-2">
                      {[
                        { metric: "Scope 1 GHG emissions", value: "12,480 tCO₂e", framework: "GRI 305-1", confidence: 98 },
                        { metric: "Scope 2 GHG emissions", value: "8,920 tCO₂e", framework: "GRI 305-2", confidence: 96 },
                        { metric: "Female board representation", value: "42%", framework: "GRI 405-1", confidence: 99 },
                        { metric: "Water consumption", value: "184,300 m³", framework: "SASB EM-IS-140a.1", confidence: 94 },
                        { metric: "Workplace injuries (TRIR)", value: "0.84", framework: "GRI 403-9", confidence: 92 },
                      ].map((d) => (
                        <div key={d.metric} className="grid grid-cols-12 gap-3 items-center rounded-lg border border-border/60 bg-muted/40 px-4 py-2.5">
                          <div className="col-span-5">
                            <div className="text-xs font-semibold text-foreground truncate">{d.metric}</div>
                            <div className="text-[10px] text-muted-foreground">{d.framework}</div>
                          </div>
                          <div className="col-span-3 text-sm font-black text-blue-600 dark:text-blue-400 tabular">{d.value}</div>
                          <div className="col-span-4 flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${d.confidence}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 w-7 text-right">{d.confidence}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {active === 2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: "Environmental", value: 87, color: "#10b981" },
                        { label: "Social", value: 72, color: "#3b82f6" },
                        { label: "Governance", value: 91, color: "#f59e0b" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-border/60 bg-muted/40 p-5 text-center">
                          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">{s.label}</div>
                          <div className="text-4xl font-black tabular mb-2" style={{ color: s.color }}>{s.value}</div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                          </div>
                        </div>
                      ))}
                      <div className="sm:col-span-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Top gaps to close</span>
                        </div>
                        <div className="space-y-2">
                          {[
                            "GRI 305-3 — Scope 3 emissions disclosure missing",
                            "TCFD — Scenario analysis not yet documented",
                            "SASB — Workforce health & safety incidents incomplete",
                          ].map((g) => (
                            <div key={g} className="flex items-start gap-2 text-[11px] text-foreground/80">
                              <ChevronRight className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                              {g}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {active === 3 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { name: "Executive Summary", pages: "12 pages", desc: "Investor & board-ready overview", icon: <FileText className="h-5 w-5" />, color: "violet" },
                        { name: "Full Compliance Report", pages: "98 pages", desc: "Audit-ready with evidence trail", icon: <FileCheck className="h-5 w-5" />, color: "emerald" },
                      ].map((p) => (
                        <div key={p.name} className={`rounded-xl border-2 ${p.color === "violet" ? "border-violet-500/20 bg-violet-500/5" : "border-emerald-500/20 bg-emerald-500/5"} p-6`}>
                          <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${p.color === "violet" ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"}`}>
                            {p.icon}
                          </div>
                          <div className="text-sm font-black text-foreground mb-1">{p.name}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-3">{p.pages} · PDF</div>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{p.desc}</p>
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground/80">
                            <CheckCircle2 className={`h-3.5 w-3.5 ${p.color === "violet" ? "text-violet-500" : "text-emerald-500"}`} />
                            Audit trail included
                          </div>
                        </div>
                      ))}
                      <div className="sm:col-span-2 rounded-xl bg-muted/40 border border-border/60 px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-semibold text-foreground">Both PDFs generated in under 60 seconds</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">READY</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">

        {/* ════════════════════════════════════════════════════════════════
            HERO — Dark, Immersive, Editorial
        ════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden hero-bg min-h-screen flex items-center">
          {/* Background layers — only visible in dark mode */}
          <div className="absolute inset-0 dot-grid-dark hidden dark:block" />
          <div className="absolute inset-0 line-grid-dark opacity-60 hidden dark:block" />

          {/* Floating orbs — subtle in light mode, prominent in dark */}
          <div className="pointer-events-none absolute -left-32 top-1/4 w-[500px] h-[500px] rounded-full opacity-40 dark:opacity-100"
            style={{ background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute -right-20 top-1/3 w-[400px] h-[400px] rounded-full opacity-40 dark:opacity-100"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-40 dark:opacity-100"
            style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)" }} />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-20 lg:py-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-screen">

              {/* LEFT — Text */}
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {/* Badge */}
                <div className="mb-7">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-500/8 dark:bg-emerald-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                    {t("home.heroBadge")}
                  </span>
                </div>

                {/* Headline — typewriter */}
                <TypewriterHeadline
                  text={t("hero.title")}
                  className="text-4xl font-black tracking-tight leading-[1.06] text-foreground dark:text-white sm:text-5xl lg:text-[3.6rem] mb-6"
                  highlightLast={2}
                  speed={38}
                />

                <p className="text-lg text-muted-foreground dark:text-slate-400 leading-relaxed mb-10 max-w-[480px]">
                  {t("hero.subtitle")}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 mb-12">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="h-12 px-8 text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all duration-200 border-0"
                    >
                      {t("hero.cta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 px-8 text-sm font-semibold rounded-xl border-border text-muted-foreground hover:bg-muted hover:text-foreground dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white dark:hover:border-white/20 dark:bg-transparent transition-all duration-200"
                    >
                      {t("hero.cta2")}
                    </Button>
                  </Link>
                </div>

                {/* Trust — minimal, no empty social proof */}
                <div className="flex flex-wrap items-center gap-4">
                  {[
                    { icon: <Lock className="h-3.5 w-3.5" />, text: t("home.trustEncrypted") },
                    { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: t("home.trustUptime99") },
                  ].map((b) => (
                    <div key={b.text} className="flex items-center gap-1.5 text-muted-foreground/60 dark:text-slate-500">
                      <span className="text-emerald-600 dark:text-emerald-500/70">{b.icon}</span>
                      <span className="text-[11px] font-semibold tracking-wide">{b.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* RIGHT — Stats Panel */}
              <motion.div
                className="hidden lg:flex flex-col gap-0"
                initial={{ opacity: 0, x: 40, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.25 }}
              >
                {/* Main glassmorphic panel */}
                <div className="glass-dark-card rounded-2xl p-7 glow-emerald-sm">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-7">
                    <div>
                      <div className="text-sm font-bold text-white">{t("home.statsTitle")}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t("home.statsSubtitle")}</div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-400">{t("home.statsOnTrack")}</span>
                    </div>
                  </div>

                  {/* Score Rings */}
                  <div className="flex items-center justify-around mb-7 px-2">
                    <ScoreRing label={t("home.environmental")} score={87} color="#10b981" delay="0.4s" />
                    <ScoreRing label={t("home.social")} score={72} color="#3b82f6" delay="0.7s" />
                    <ScoreRing label={t("home.governance")} score={91} color="#f59e0b" delay="1s" />
                  </div>

                  {/* Overall score */}
                  <div className="rounded-xl border border-white/6 bg-white/3 p-5 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.14em]">{t("home.overallScore")}</span>
                      <span className="text-2xl font-black text-white tabular">83.4</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: "83.4%",
                          background: "linear-gradient(90deg, #10b981, #3b82f6, #f59e0b)",
                          transition: "width 1.8s cubic-bezier(0.4, 0, 0.2, 1)",
                          transitionDelay: "1.2s",
                          boxShadow: "0 0 12px rgba(16,185,129,0.5)",
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-slate-600">0</span>
                      <span className="text-[10px] text-slate-600">100</span>
                    </div>
                  </div>

                  {/* Mini metrics */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { label: t("home.indicators"), value: "147/156", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" },
                      { label: t("home.compliance"), value: "94%", color: "bg-blue-500/10 text-blue-400 border-blue-500/10" },
                      { label: t("home.trend"), value: "+12%", color: "bg-amber-500/10 text-amber-400 border-amber-500/10" },
                    ].map((m) => (
                      <div key={m.label} className={`rounded-lg border px-2 py-2.5 text-center ${m.color}`}>
                        <div className="text-sm font-black tabular">{m.value}</div>
                        <div className="text-[9px] font-bold uppercase tracking-wide opacity-60 mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom card row — inline, no absolute overlaps */}
                <motion.div
                  className="mt-3 grid grid-cols-2 gap-3"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                  {/* GRI coverage */}
                  <div className="glass-dark-card rounded-xl px-4 py-3 glow-blue-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/15">
                        <Globe className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{t("home.griCoverage")}</div>
                        <div className="text-[10px] text-slate-500">{t("home.griComplete")}</div>
                      </div>
                    </div>
                  </div>
                  {/* Activity trend */}
                  <div className="glass-dark-card rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Sparkline />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{t("home.quarterChange")}</div>
                        <div className="text-[10px] text-slate-500">{t("home.vsLastQuarter")}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Bottom fade to next section */}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FRAMEWORKS GRID
        ════════════════════════════════════════════════════════════════ */}
        <section className="border-b border-border/60 bg-muted/30 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                {t("home.frameworksLabel")}
              </span>
            </FadeIn>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {frameworks.map((fw, i) => (
                <FadeIn key={fw.name} delay={i * 0.05}>
                  <div className="group flex flex-col items-center gap-2.5 rounded-xl border border-border/60 bg-card p-4 hover:border-border hover:shadow-sm transition-all duration-200">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-[11px] font-black"
                      style={{ background: `${fw.color}18`, color: fw.color, border: `1px solid ${fw.color}28` }}
                    >
                      {fw.name.slice(0, 3)}
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] font-bold text-foreground">{fw.name}</div>
                      <div className="text-[9px] text-muted-foreground/60 mt-0.5 leading-tight line-clamp-2">{fw.full}</div>
                    </div>
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold" style={{ color: fw.color }}>{fw.pct}%</span>
                        <span className="text-[9px] text-muted-foreground/50">{t("home.fwCoverageLabel")}</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${fw.pct}%`, backgroundColor: fw.color }}
                        />
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            VALUE PROPS — 3 columns
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mb-16 max-w-3xl">
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  {t("home.valuePropsLabel")}
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {t("home.valuePropsTitle")}
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: <Zap className="h-5 w-5" />,
                  title: t("home.valueProp1Title"),
                  desc: t("home.valueProp1Desc"),
                  stat: "80%",
                  statLabel: "time saved",
                  accent: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/15", ring: "from-emerald-500/40" },
                },
                {
                  icon: <Shield className="h-5 w-5" />,
                  title: t("home.valueProp2Title"),
                  desc: t("home.valueProp2Desc"),
                  stat: "6+",
                  statLabel: "frameworks",
                  accent: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/15", ring: "from-blue-500/40" },
                },
                {
                  icon: <Target className="h-5 w-5" />,
                  title: t("home.valueProp3Title"),
                  desc: t("home.valueProp3Desc"),
                  stat: "Live",
                  statLabel: "scoring & gaps",
                  accent: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/15", ring: "from-amber-500/40" },
                },
              ].map((vp, i) => (
                <FadeIn key={vp.title} delay={i * 0.08}>
                  <div className={`group relative h-full rounded-2xl border ${vp.accent.border} bg-card p-7 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden`}>
                    <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${vp.accent.ring} via-transparent to-transparent opacity-60`} />
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${vp.accent.bg} ${vp.accent.text} ${vp.accent.border} mb-6 transition-transform duration-300 group-hover:scale-110`}>
                      {vp.icon}
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className={`text-3xl font-black tabular ${vp.accent.text}`}>{vp.stat}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60">{vp.statLabel}</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2.5">{vp.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{vp.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PRODUCT SHOWCASE — Interactive tabs
        ════════════════════════════════════════════════════════════════ */}
        <ProductShowcase />

        {/* ════════════════════════════════════════════════════════════════
            FEATURES — Bento Grid
        ════════════════════════════════════════════════════════════════ */}
        <section id="features" className="py-28 sm:py-36 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <FadeIn className="mb-16">
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  {t("home.capabilitiesLabel")}
                </span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl max-w-xl">
                  {t("features.title")}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
                  {t("features.subtitle")}
                </p>
              </div>
            </FadeIn>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* AI — Large card spans 2 cols */}
              <FadeIn delay={0} className="sm:col-span-2 lg:col-span-2">
                <FeatureCard
                  icon={<Brain className="h-5 w-5" />}
                  title={t("features.ai.title")}
                  desc={t("features.ai.desc")}
                  accent={{
                    bg: "bg-violet-500/10",
                    text: "text-violet-600 dark:text-violet-400",
                    border: "border-violet-500/15 hover:border-violet-500/30",
                    glow: "rgba(139, 92, 246, 0.15)",
                  }}
                  large
                  className="h-full"
                  extra={
                    <div className="flex flex-wrap gap-2">
                      {(["features.ai.tag1", "features.ai.tag2", "features.ai.tag3", "features.ai.tag4"] as const).map((key) => (
                        <span key={key} className="inline-flex items-center rounded-md bg-violet-500/8 border border-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                          {t(key)}
                        </span>
                      ))}
                    </div>
                  }
                />
              </FadeIn>

              {/* Frameworks */}
              <FadeIn delay={0.08}>
                <FeatureCard
                  icon={<Layers className="h-5 w-5" />}
                  title={t("features.frameworks.title")}
                  desc={t("features.frameworks.desc")}
                  accent={{
                    bg: "bg-blue-500/10",
                    text: "text-blue-600 dark:text-blue-400",
                    border: "border-blue-500/15 hover:border-blue-500/30",
                    glow: "rgba(59, 130, 246, 0.15)",
                  }}
                  className="h-full"
                  extra={
                    <div className="grid grid-cols-3 gap-1.5">
                      {["GRI", "SASB", "TCFD", "CDP", "ISSB", "CSRD"].map((fw) => (
                        <span key={fw} className="text-center rounded bg-blue-500/6 border border-blue-500/10 px-1.5 py-1 text-[10px] font-black text-blue-600 dark:text-blue-400">
                          {fw}
                        </span>
                      ))}
                    </div>
                  }
                />
              </FadeIn>

              {/* Scoring */}
              <FadeIn delay={0.12}>
                <FeatureCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  title={t("features.scoring.title")}
                  desc={t("features.scoring.desc")}
                  accent={{
                    bg: "bg-emerald-500/10",
                    text: "text-emerald-600 dark:text-emerald-400",
                    border: "border-emerald-500/15 hover:border-emerald-500/30",
                    glow: "rgba(16, 185, 129, 0.15)",
                  }}
                  className="h-full"
                  extra={
                    <div className="flex items-end gap-[3px] h-8">
                      {[40, 55, 48, 70, 58, 85, 72, 90].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm"
                          style={{ height: `${h}%`, background: `rgba(16,185,129,${0.2 + (h/100)*0.8})` }} />
                      ))}
                    </div>
                  }
                />
              </FadeIn>

              {/* Reports */}
              <FadeIn delay={0.16}>
                <FeatureCard
                  icon={<FileCheck className="h-5 w-5" />}
                  title={t("features.reports.title")}
                  desc={t("features.reports.desc")}
                  accent={{
                    bg: "bg-amber-500/10",
                    text: "text-amber-600 dark:text-amber-400",
                    border: "border-amber-500/15 hover:border-amber-500/30",
                    glow: "rgba(245, 158, 11, 0.15)",
                  }}
                  className="h-full"
                  extra={
                    <div className="space-y-1.5">
                      {(["features.reports.item1", "features.reports.item2", "features.reports.item3"] as const).map((key) => (
                        <div key={key} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0" />
                          {t(key)}
                        </div>
                      ))}
                    </div>
                  }
                />
              </FadeIn>

              {/* Security */}
              <FadeIn delay={0.2}>
                <FeatureCard
                  icon={<Shield className="h-5 w-5" />}
                  title={t("features.security.title")}
                  desc={t("features.security.desc")}
                  accent={{
                    bg: "bg-rose-500/10",
                    text: "text-rose-600 dark:text-rose-400",
                    border: "border-rose-500/15 hover:border-rose-500/30",
                    glow: "rgba(244, 63, 94, 0.15)",
                  }}
                  className="h-full"
                  extra={
                    <div className="space-y-1.5">
                      {(["features.security.item1", "features.security.item2", "features.security.item3"] as const).map((key) => (
                        <div key={key} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Lock className="h-3 w-3 text-rose-500 shrink-0" />
                          {t(key)}
                        </div>
                      ))}
                    </div>
                  }
                />
              </FadeIn>

              {/* Dashboard — Full width card */}
              <FadeIn delay={0.28} className="sm:col-span-2 lg:col-span-3">
                <FeatureCard
                  icon={<LayoutDashboard className="h-5 w-5" />}
                  title={t("features.dashboard.title")}
                  desc={t("features.dashboard.desc")}
                  accent={{
                    bg: "bg-cyan-500/10",
                    text: "text-cyan-600 dark:text-cyan-400",
                    border: "border-cyan-500/15 hover:border-cyan-500/30",
                    glow: "rgba(6, 182, 212, 0.15)",
                  }}
                  large
                  className="h-full"
                  extra={
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {[
                        { key: "eScore", value: "87", color: "text-emerald-600 dark:text-emerald-400" },
                        { key: "sScore", value: "72", color: "text-blue-600 dark:text-blue-400" },
                        { key: "gScore", value: "91", color: "text-amber-600 dark:text-amber-400" },
                        { key: "overall", value: "83", color: "text-cyan-600 dark:text-cyan-400" },
                        { key: "reports", value: "12", color: "text-violet-600 dark:text-violet-400" },
                        { key: "frameworks", value: "8", color: "text-rose-600 dark:text-rose-400" },
                        { key: "indicators", value: "156", color: "text-amber-600 dark:text-amber-400" },
                        { key: "compliance", value: "94%", color: "text-emerald-600 dark:text-emerald-400" },
                      ].map((s) => (
                        <div key={s.key} className="rounded-lg bg-muted/60 border border-border/60 p-2 text-center">
                          <div className={`text-base font-black tabular ${s.color}`}>{s.value}</div>
                          <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wide mt-0.5">{t(`features.dashboard.${s.key}`)}</div>
                        </div>
                      ))}
                    </div>
                  }
                />
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-28 sm:py-36 bg-muted/30 border-y border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mb-16">
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
                  <Sparkles className="h-3 w-3" />
                  {t("home.processLabel")}
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl max-w-2xl">
                {t("home.howItWorksTitle")}
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connecting line */}
              <div className="absolute top-10 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-emerald-500/30 via-blue-500/30 to-amber-500/30 hidden md:block" />

              {[
                {
                  step: "01",
                  icon: <FileText className="h-5 w-5" />,
                  title: t("home.step1Title"),
                  desc: t("home.step1Desc"),
                  accent: { bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400", watermark: "text-emerald-500/8" },
                },
                {
                  step: "02",
                  icon: <Brain className="h-5 w-5" />,
                  title: t("home.step2Title"),
                  desc: t("home.step2Desc"),
                  accent: { bg: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400", watermark: "text-blue-500/8" },
                },
                {
                  step: "03",
                  icon: <BarChart3 className="h-5 w-5" />,
                  title: t("home.step3Title"),
                  desc: t("home.step3Desc"),
                  accent: { bg: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400", watermark: "text-amber-500/8" },
                },
              ].map((item, i) => (
                <FadeIn key={item.step} delay={i * 0.12}>
                  <div className="relative bg-card rounded-2xl border border-border/60 p-8 hover:shadow-lg hover:border-border transition-all duration-200 overflow-hidden group">
                    <div className={`absolute top-3 right-5 text-8xl font-black leading-none select-none pointer-events-none ${item.accent.watermark} transition-all duration-300 group-hover:scale-110`}>
                      {item.step}
                    </div>
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${item.accent.bg} mb-6`}>
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
            METRICS BAND — Dark, Bold
        ════════════════════════════════════════════════════════════════ */}
        <FadeIn>
          <section className="relative overflow-hidden py-24" style={{ background: "#060c14" }}>
            <div className="absolute inset-0 dot-grid-dark opacity-50" />
            <div className="pointer-events-none absolute -left-40 top-0 w-[500px] h-full rounded-full"
              style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)" }} />
            <div className="pointer-events-none absolute -right-40 top-0 w-[500px] h-full rounded-full"
              style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)" }} />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {/* Section label */}
              <div className="text-center mb-16">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  {t("home.platformByNumbers")}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {[
                  { value: "98%", label: t("home.metricAccuracy"), icon: <Zap className="h-4 w-4" />, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/10" },
                  { value: "3x", label: t("home.metricFaster"), icon: <TrendingUp className="h-4 w-4" />, color: "text-blue-400 bg-blue-400/10 border-blue-400/10" },
                  { value: "150+", label: t("home.metricIndicators"), icon: <LineChart className="h-4 w-4" />, color: "text-amber-400 bg-amber-400/10 border-amber-400/10" },
                  { value: "24/7", label: t("home.metricMonitoring"), icon: <Shield className="h-4 w-4" />, color: "text-violet-400 bg-violet-400/10 border-violet-400/10" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center group">
                    <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl border ${stat.color} mb-5 mx-auto transition-transform group-hover:scale-110 duration-200`}>
                      {stat.icon}
                    </div>
                    <div className="text-4xl sm:text-5xl font-black text-white mb-2 tabular"
                      style={{ textShadow: "0 0 40px rgba(255,255,255,0.1)" }}>
                      {stat.value}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ════════════════════════════════════════════════════════════════
            WHY ESG360 + Framework Coverage
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-28 sm:py-36 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left */}
              <FadeIn>
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-3 w-3" />
                    {t("home.whyLabel")}
                  </span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl mb-12 max-w-md">
                  {t("home.whyTitle")}
                </h2>
                <div className="space-y-6">
                  {[
                    { icon: <Leaf className="h-4.5 w-4.5" />, title: t("home.multiFrameworkTitle"), desc: t("home.multiFrameworkDesc"), accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10" },
                    { icon: <Lock className="h-4.5 w-4.5" />, title: t("home.securityTitle"), desc: t("home.securityDesc"), accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/10" },
                    { icon: <Users className="h-4.5 w-4.5" />, title: t("home.teamTitle"), desc: t("home.teamDesc"), accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/10" },
                    { icon: <Building2 className="h-4.5 w-4.5" />, title: t("home.multiCompanyTitle"), desc: t("home.multiCompanyDesc"), accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10" },
                  ].map((item, i) => (
                    <FadeIn key={item.title} delay={i * 0.08}>
                      <div className="flex gap-4 group">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${item.accent} transition-transform group-hover:scale-105`}>
                          {item.icon}
                        </div>
                        <div className="pt-0.5">
                          <h3 className="text-sm font-bold text-foreground mb-1">{item.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </FadeIn>

              {/* Right — Framework coverage */}
              <FadeIn delay={0.15}>
                <div className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
                  <div className="px-8 pt-8 pb-6 border-b border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-foreground">{t("home.frameworkCoverageTitle")}</h3>
                      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        {t("home.averageCoverage")}: 86.2%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("home.frameworkCoverageDesc")}</p>
                  </div>
                  <div className="px-8 py-7 space-y-5">
                    {coverageBars.map((item) => (
                      <div key={item.key}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-foreground/80">{t(`home.${item.key}`)}</span>
                          <span className="text-sm font-black text-foreground tabular">{item.pct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${item.pct}%`,
                              backgroundColor: item.color,
                              boxShadow: `0 0 8px ${item.color}60`,
                            }}
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
            COMPARISON TABLE — Spreadsheets vs Consultants vs ESG360
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-28 sm:py-36 bg-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mb-14 text-center max-w-3xl mx-auto">
              <div className="mb-4 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-600 dark:text-rose-400">
                  <Sparkles className="h-3 w-3" />
                  {t("home.compareLabel")}
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl mb-4">
                {t("home.compareTitle")}
              </h2>
              <p className="text-base text-muted-foreground">{t("home.compareSub")}</p>
            </FadeIn>

            <FadeIn>
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20">
                {/* Header */}
                <div className="grid grid-cols-12 bg-muted/40 border-b border-border/60">
                  <div className="col-span-4 px-6 py-5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    &nbsp;
                  </div>
                  <div className="col-span-3 px-4 py-5 text-center border-l border-border/40">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("home.compareCol1")}</div>
                  </div>
                  <div className="col-span-2 px-4 py-5 text-center border-l border-border/40">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("home.compareCol2")}</div>
                  </div>
                  <div className="col-span-3 px-4 py-5 text-center border-l border-emerald-500/20 bg-emerald-500/5 relative">
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center justify-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      {t("home.compareCol3")}
                    </div>
                  </div>
                </div>

                {/* Rows */}
                {[1, 2, 3, 4, 5].map((n, idx) => (
                  <div key={n} className={`grid grid-cols-12 ${idx < 4 ? "border-b border-border/40" : ""}`}>
                    <div className="col-span-4 px-6 py-5 text-sm font-semibold text-foreground/90 flex items-center">
                      {t(`home.compareRow${n}`)}
                    </div>
                    <div className="col-span-3 px-4 py-5 text-center border-l border-border/40 flex items-center justify-center gap-2">
                      <X className="h-3.5 w-3.5 text-rose-500/70 shrink-0" />
                      <span className="text-xs text-muted-foreground">{t(`home.compareRow${n}a`)}</span>
                    </div>
                    <div className="col-span-2 px-4 py-5 text-center border-l border-border/40 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">{t(`home.compareRow${n}b`)}</span>
                    </div>
                    <div className="col-span-3 px-4 py-5 text-center border-l border-emerald-500/20 bg-emerald-500/[0.03] flex items-center justify-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-foreground">{t(`home.compareRow${n}c`)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            TESTIMONIALS
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-28 sm:py-36 bg-muted/30 border-y border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mb-14 max-w-3xl">
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-600 dark:text-amber-400">
                  <Quote className="h-3 w-3" />
                  {t("home.testimonialsLabel")}
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {t("home.testimonialsTitle")}
              </h2>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map((n, i) => (
                <FadeIn key={n} delay={i * 0.08}>
                  <div className="group h-full rounded-2xl border border-border/60 bg-card p-7 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
                    <div className="flex items-center gap-1 mb-5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <Quote className="h-6 w-6 text-amber-500/40 mb-3" />
                    <p className="text-sm text-foreground/90 leading-relaxed mb-6 flex-1">
                      “{t(`home.testimonial${n}Quote`)}”
                    </p>
                    <div className="flex items-center gap-3 pt-5 border-t border-border/40">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-border/60 text-sm font-black text-foreground">
                        {t(`home.testimonial${n}Name`).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{t(`home.testimonial${n}Name`)}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {t(`home.testimonial${n}Role`)} · {t(`home.testimonial${n}Company`)}
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PRICING TEASER
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-24 sm:py-32 bg-background border-y border-border/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-14">
              <div className="mb-4 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  {t("home.pricingLabel")}
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl mb-4">
                {t("pricing.title")}
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                {t("pricing.subtitle")}
              </p>
            </FadeIn>

            {/* Pricing teaser cards */}
            <FadeIn delay={0.05}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto mb-10">
                {([
                  { tier: "professional", border: "border-border/60", glow: "" },
                  { tier: "enterprise", border: "border-emerald-500/30", glow: "shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/10" },
                ] as const).map((p) => (
                  <div key={p.tier} className={`relative rounded-2xl border ${p.border} bg-card p-7 ${p.glow}`}>
                    {p.tier === "enterprise" && (
                      <span className="absolute -top-3 right-6 inline-flex items-center rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                        {t("pricing.popular")}
                      </span>
                    )}
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                      {t(`pricing.${p.tier}.name`)}
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-black text-foreground tabular">{t(`pricing.${p.tier}.price`)}</span>
                      <span className="text-sm font-semibold text-muted-foreground">{t(`pricing.${p.tier}.period`)}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-5">
                      <CheckCircle2 className="h-3 w-3" />
                      {t("pricing.oneTime")}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <FileText className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                        {t("pricing.deliverable1")}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <FileCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {t("pricing.deliverable2")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn className="text-center" delay={0.1}>
              <Link href="/pricing">
                <Button
                  size="lg"
                  className="h-12 px-8 text-sm font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-200"
                >
                  {t("home.viewPlans")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </FadeIn>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FAQ
        ════════════════════════════════════════════════════════════════ */}
        <section className="py-28 sm:py-36 bg-background">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="text-center mb-16">
              <div className="mb-4 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {t("home.faqLabel")}
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl mb-4">
                {t("home.faqTitle")}
              </h2>
              <p className="text-base text-muted-foreground">{t("home.faqSubtitle")}</p>
            </FadeIn>
            <FadeIn>
              <Accordion type="single" collapsible className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <AccordionItem
                    key={n}
                    value={`faq${n}`}
                    className="rounded-xl border border-border/60 bg-card px-6 overflow-hidden data-[state=open]:border-primary/20 transition-colors"
                  >
                    <AccordionTrigger className="text-sm font-semibold text-foreground py-5 hover:no-underline hover:text-primary transition-colors">
                      {t(`home.faq${n}q`)}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                      {t(`home.faq${n}a`)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeIn>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            CTA — Dark, Immersive
        ════════════════════════════════════════════════════════════════ */}
        <FadeIn>
          <section className="relative overflow-hidden py-28 sm:py-36 cta-gradient">
            <div className="absolute inset-0 dot-grid-dark opacity-40" />
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
              style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 65%)" }} />

            <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t("home.ctaLabel")}
                </span>
              </div>

              <h2 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-white mb-6 leading-[1.05]">
                {t("cta.title").split(" ").slice(0, -2).join(" ")}{" "}
                <span className="text-gradient-emerald">{t("cta.title").split(" ").slice(-2).join(" ")}</span>
              </h2>

              <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
                {t("cta.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="h-13 px-10 text-base font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.03] transition-all duration-200 border-0"
                  >
                    {t("cta.button")}
                    <ArrowRight className="ml-2.5 h-4.5 w-4.5" />
                  </Button>
                </Link>
                <a href="mailto:sales@esg360.digital">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-13 px-8 text-base font-semibold rounded-xl border-white/10 text-slate-300 hover:bg-white/5 hover:text-white hover:border-white/20 bg-transparent transition-all duration-200"
                  >
                    {t("home.contactSales")}
                  </Button>
                </a>
              </div>

              {/* Minimal trust */}
              <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
                {[
                  { icon: <Lock className="h-3.5 w-3.5" />, text: t("home.trustEncrypted") },
                  { icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: t("home.trustUptime99") },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-emerald-600/70">{b.icon}</span>
                    <span className="text-[11px] font-semibold tracking-wide">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom fade out */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
          </section>
        </FadeIn>

      </main>

      <Footer />
    </div>
  );
}
