"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Target,
  Leaf,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useCompany } from "@/hooks/useCompany";
import { analyticsApi } from "@/services/api";

// ─── Meta ───

const PILLAR_META = {
  E: { key: "environmental", icon: Leaf, color: "#16a34a", bgClass: "bg-brand-green/10", textClass: "text-brand-green" },
  S: { key: "social", icon: Users, color: "#2563eb", bgClass: "bg-brand-blue/10", textClass: "text-brand-blue" },
  G: { key: "governance", icon: Activity, color: "#f59e0b", bgClass: "bg-brand-gold/10", textClass: "text-brand-gold" },
};

// ─── Helpers ───

function scoreToStatus(score: number): string {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

function getStatusColor(status: string) {
  switch (status) {
    case "excellent": return "text-brand-green bg-brand-green/10 border-brand-green/20";
    case "good": return "text-brand-blue bg-brand-blue/10 border-brand-blue/20";
    case "fair": return "text-brand-gold bg-brand-gold/10 border-brand-gold/20";
    case "poor": return "text-destructive bg-destructive/10 border-destructive/20";
    default: return "text-muted-foreground bg-muted";
  }
}

function getScoreBarColor(score: number) {
  if (score >= 80) return "bg-brand-green";
  if (score >= 65) return "bg-brand-blue";
  if (score >= 50) return "bg-brand-gold";
  return "bg-destructive";
}

// ─── Types for API response ───
interface SubIndicator {
  code: string;
  name: string;
  score: number;
  weight: number;
  data_points_used: number;
}
interface PillarBreakdown {
  pillar: string;
  score: number;
  weight: number;
  grade: string;
  sub_indicators: SubIndicator[];
}
interface ScoreResponse {
  overall_score: number;
  grade: string;
  classification: string;
  pillars: PillarBreakdown[];
  penalties_applied: string[];
  methodology_version: string;
}
interface BenchmarkResponse {
  company_score: number;
  sector: string;
  industry_average: number;
  comparisons: { label: string; value: number }[];
  percentile: number;
  classification: string;
}

export default function ESGScorePage() {
  const t = useTranslations();
  const { company, loading: companyLoading, token } = useCompany();

  const [overallScore, setOverallScore] = useState<{ value: number; change: string; trend: "up" | "down"; rating: string; percentile: number } | null>(null);
  const [pillarScores, setPillarScores] = useState<Array<{
    key: string; score: number; change: string; trend: "up" | "down";
    icon: typeof Leaf; color: string; bgClass: string; textClass: string;
    indicators: Array<{ name: string; score: number; status: string }>;
  }>>([]);
  const [radarData, setRadarData] = useState<Array<{ subject: string; A: number; fullMark: number }>>([]);
  const [benchmarkData, setBenchmarkData] = useState<Array<{ name: string; score: number; color: string }>>([]);
  const [historicalData, setHistoricalData] = useState<Array<{ year: number; overall: number; E: number; S: number; G: number }>>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const statusLabelMap: Record<string, string> = {
    excellent: t("dashboard.statusExcellent"),
    good: t("dashboard.statusGood"),
    fair: t("dashboard.statusFair"),
    poor: t("dashboard.statusPoor"),
  };

  useEffect(() => {
    if (!token || !company) return;
    setDataLoading(true);

    const fetchData = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];

        // Fetch scores, benchmark and historical data in parallel
        const [scoresRaw, benchmarkRaw, ...historicalRaw] = await Promise.all([
          analyticsApi.getScores(token, company.id),
          analyticsApi.getBenchmark(token, company.id),
          ...years.map((y) => analyticsApi.getScores(token, company.id, y).catch(() => null)),
        ]);
        const scores = scoresRaw as ScoreResponse;
        const benchmark = benchmarkRaw as BenchmarkResponse;

        // Map overall score
        setOverallScore({
          value: Math.round(scores.overall_score),
          change: "+0.0%",
          trend: "up",
          rating: scores.grade,
          percentile: Math.round(benchmark.percentile),
        });

        // Map pillars
        const pillarOrder: ("E" | "S" | "G")[] = ["E", "S", "G"];
        const mappedPillars = pillarOrder.map((code) => {
          const pillar = scores.pillars.find((p) => p.pillar === code);
          const meta = PILLAR_META[code];
          const score = pillar ? Math.round(pillar.score) : 0;
          return {
            key: meta.key,
            score,
            change: "+0.0%",
            trend: "up" as const,
            icon: meta.icon,
            color: meta.color,
            bgClass: meta.bgClass,
            textClass: meta.textClass,
            indicators: (pillar?.sub_indicators || []).map((si) => ({
              name: si.name,
              score: Math.round(si.score),
              status: scoreToStatus(Math.round(si.score)),
            })),
          };
        });
        setPillarScores(mappedPillars);

        // Map radar data from all sub-indicators
        const allSubs = scores.pillars.flatMap((p) => p.sub_indicators);
        if (allSubs.length > 0) {
          setRadarData(
            allSubs.map((si) => ({
              subject: si.name.length > 10 ? si.name.slice(0, 10) + "…" : si.name,
              A: Math.round(si.score),
              fullMark: 100,
            }))
          );
        }

        // Map benchmark data
        if (benchmark.comparisons && benchmark.comparisons.length > 0) {
          const colors = ["#16a34a", "#94a3b8", "#2563eb", "#f59e0b", "#8b5cf6", "#ef4444"];
          setBenchmarkData(
            benchmark.comparisons.map((c, i) => ({
              name: c.label,
              score: Math.round(c.value),
              color: colors[i % colors.length],
            }))
          );
        }

        // Map historical trend data
        const trend = years.map((y, i) => {
          const s = historicalRaw[i] as ScoreResponse | null;
          if (!s) return null;
          return {
            year: y,
            overall: Math.round(s.overall_score),
            E: Math.round(s.pillars.find((p) => p.pillar === "E")?.score ?? 0),
            S: Math.round(s.pillars.find((p) => p.pillar === "S")?.score ?? 0),
            G: Math.round(s.pillars.find((p) => p.pillar === "G")?.score ?? 0),
          };
        }).filter(Boolean) as typeof historicalData;
        setHistoricalData(trend);
      } catch {
        // No fallback to mock data
      } finally {
        setDataLoading(false);
        setDataLoaded(true);
      }
    };

    fetchData();
  }, [token, company]);

  if (companyLoading || dataLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col gap-3">
          <div className="h-8 w-52 rounded-xl bg-muted animate-pulse" />
          <div className="h-4 w-80 rounded-lg bg-muted animate-pulse" />
        </div>
        {/* Pillar score bar skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["#10b981", "#3b82f6", "#f59e0b"].map((color, i) => (
            <div key={i} className="rounded-2xl border border-border/60 p-5 space-y-4 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl" style={{ backgroundColor: `${color}20` }} />
                <div className="h-4 w-28 rounded-lg bg-muted" />
              </div>
              <div className="h-8 w-16 rounded-lg bg-muted" />
              <div className="h-2 w-full rounded-full bg-muted" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-12 rounded-xl bg-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Chart skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 rounded-2xl border border-border/60 bg-muted/30 animate-pulse" />
          <div className="h-72 rounded-2xl border border-border/60 bg-muted/30 animate-pulse" style={{ animationDelay: "0.15s" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          {t("dashboard.nav.esgScore")}
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t("dashboard.esgScoreTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dashboard.esgScoreSubtitle")}
        </p>
      </div>

      {dataLoaded && !overallScore ? (
        <Card className="border-dashed border-2 border-border/50 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">{t("dashboard.noScoreTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {t("dashboard.noScoreDesc")}
            </p>
          </CardContent>
        </Card>
      ) : overallScore ? (
      <>

      {/* ─── Overall Score Card ─── */}
      <Card className="border-border/60 rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-brand-green/5 via-brand-blue/5 to-brand-gold/5 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            {/* Score Ring */}
            <div className="relative flex items-center justify-center">
              <svg className="h-36 w-36" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" opacity="0.3" />
                <circle
                  cx="60" cy="60" r="52" fill="none" stroke="#16a34a" strokeWidth="8"
                  strokeDasharray={`${(overallScore.value / 100) * 327} 327`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-foreground">{overallScore.value}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>

            {/* Score details */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                <Badge className="bg-brand-green/15 text-brand-green border border-brand-green/25 text-sm px-3 py-1">
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {overallScore.rating}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    overallScore.trend === "up"
                      ? "bg-brand-green/10 text-brand-green"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {overallScore.trend === "up" ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {overallScore.change}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t("dashboard.esgScorePercentile", { percentile: overallScore.percentile })}
              </p>

              {/* Mini pillar scores */}
              <div className="grid grid-cols-3 gap-4">
                {pillarScores.map((p) => (
                  <div key={p.key} className="text-center">
                    <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${p.bgClass} mb-1.5`}>
                      <p.icon className={`h-4 w-4 ${p.textClass}`} />
                    </div>
                    <p className="text-lg font-bold text-foreground">{p.score}</p>
                    <p className="text-[11px] text-muted-foreground">{t(`dashboard.pillars.${p.key}`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── Radar + Benchmark ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/60 rounded-2xl">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="text-base font-semibold">{t("dashboard.esgRadar")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("dashboard.esgRadarDesc")}</p>
          </CardHeader>
          <CardContent className="px-2 pb-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" opacity={0.5} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  />
                  <Radar
                    dataKey="A"
                    stroke="#16a34a"
                    fill="#16a34a"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 rounded-2xl">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="text-base font-semibold">{t("dashboard.benchmark")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("dashboard.benchmarkDesc")}</p>
          </CardHeader>
          <CardContent className="px-4 pb-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={benchmarkData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
                    {benchmarkData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Pillar Detail Cards ─── */}
      <div className="space-y-4">
        {pillarScores.map((pillar) => (
          <Card key={pillar.key} className="border-border/60 rounded-2xl">
            <CardHeader className="px-6 pt-6 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${pillar.bgClass}`}>
                    <pillar.icon className={`h-5 w-5 ${pillar.textClass}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {t(`dashboard.pillars.${pillar.key}`)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pillar.indicators.length} {t("dashboard.indicators")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      pillar.trend === "up"
                        ? "bg-brand-green/10 text-brand-green"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {pillar.trend === "up" ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {pillar.change}
                  </Badge>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{pillar.score}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                {pillar.indicators.map((indicator) => (
                  <div key={indicator.name} className="flex items-center gap-4">
                    <span className="text-sm text-foreground font-medium w-40 shrink-0">
                      {indicator.name}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(indicator.score)}`}
                        style={{ width: `${indicator.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground w-8 text-right">{indicator.score}</span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 h-4 border capitalize ${getStatusColor(indicator.status)}`}
                    >
                      {statusLabelMap[indicator.status] || indicator.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      </>
      ) : null}

      {/* ─── Historical Trend ─── */}
      {historicalData.length > 1 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t("dashboard.historicalTrend")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={historicalData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="overall" name="Overall" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="E" name="Environmental" stroke="#059669" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="S" name="Social" stroke="#2563eb" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="G" name="Governance" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
