"use client";

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
} from "recharts";

// ─── Mock Data ───

const overallScore = {
  value: 72,
  change: "+4.2%",
  trend: "up",
  rating: "Good",
  percentile: 78,
};

const pillarScores = [
  {
    key: "environmental",
    score: 68,
    change: "+2.1%",
    trend: "up",
    icon: Leaf,
    color: "#16a34a",
    bgClass: "bg-brand-green/10",
    textClass: "text-brand-green",
    indicators: [
      { name: "Carbon Emissions", score: 72, status: "good" },
      { name: "Energy Management", score: 65, status: "fair" },
      { name: "Water & Waste", score: 58, status: "fair" },
      { name: "Biodiversity", score: 45, status: "poor" },
      { name: "Climate Risk", score: 82, status: "good" },
    ],
  },
  {
    key: "social",
    score: 75,
    change: "+5.8%",
    trend: "up",
    icon: Users,
    color: "#2563eb",
    bgClass: "bg-brand-blue/10",
    textClass: "text-brand-blue",
    indicators: [
      { name: "Labor Practices", score: 80, status: "good" },
      { name: "Human Rights", score: 72, status: "good" },
      { name: "Community Impact", score: 68, status: "fair" },
      { name: "Health & Safety", score: 85, status: "excellent" },
      { name: "Diversity & Inclusion", score: 62, status: "fair" },
    ],
  },
  {
    key: "governance",
    score: 73,
    change: "-1.2%",
    trend: "down",
    icon: Activity,
    color: "#f59e0b",
    bgClass: "bg-brand-gold/10",
    textClass: "text-brand-gold",
    indicators: [
      { name: "Board Structure", score: 78, status: "good" },
      { name: "Ethics & Compliance", score: 82, status: "good" },
      { name: "Risk Management", score: 70, status: "fair" },
      { name: "Transparency", score: 65, status: "fair" },
      { name: "Stakeholder Rights", score: 68, status: "fair" },
    ],
  },
];

const radarData = [
  { subject: "Carbon", A: 72, fullMark: 100 },
  { subject: "Energy", A: 65, fullMark: 100 },
  { subject: "Labor", A: 80, fullMark: 100 },
  { subject: "Rights", A: 72, fullMark: 100 },
  { subject: "Board", A: 78, fullMark: 100 },
  { subject: "Ethics", A: 82, fullMark: 100 },
  { subject: "Safety", A: 85, fullMark: 100 },
  { subject: "Diversity", A: 62, fullMark: 100 },
];

const benchmarkData = [
  { name: "Your Company", score: 72, color: "#16a34a" },
  { name: "Industry Avg", score: 58, color: "#94a3b8" },
  { name: "Top 10%", score: 88, color: "#2563eb" },
  { name: "Peer Median", score: 65, color: "#f59e0b" },
];

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

export default function ESGScorePage() {
  const t = useTranslations();

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
                      {indicator.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
