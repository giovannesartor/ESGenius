"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { analyticsApi } from "@/services/api";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart3,
  ArrowRight,
  Leaf,
  Users,
  Activity,
  Target,
  Upload,
  Clock,
  Star,
  ChevronRight,
  Brain,
  CheckCircle2,
  Download,
  Lightbulb,
  ShieldAlert,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Fallback Mock Data ───

const MOCK_STATS = [
  {
    key: "esgScore",
    value: "72",
    change: "+4.2%",
    trend: "up" as const,
    icon: Target,
    accent: "text-brand-green",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
  },
  {
    key: "environmental",
    value: "68",
    change: "+2.1%",
    trend: "up" as const,
    icon: Leaf,
    accent: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  {
    key: "social",
    value: "75",
    change: "+5.8%",
    trend: "up" as const,
    icon: Users,
    accent: "text-brand-blue",
    bg: "bg-brand-blue/10",
    border: "border-brand-blue/20",
  },
  {
    key: "governance",
    value: "73",
    change: "-1.2%",
    trend: "down" as const,
    icon: Activity,
    accent: "text-brand-gold",
    bg: "bg-brand-gold/10",
    border: "border-brand-gold/20",
  },
];

const MOCK_EVOLUTION = [
  { month: "Jan", overall: 58, env: 52, social: 62, gov: 60 },
  { month: "Feb", overall: 60, env: 55, social: 63, gov: 62 },
  { month: "Mar", overall: 62, env: 57, social: 64, gov: 65 },
  { month: "Apr", overall: 63, env: 58, social: 66, gov: 65 },
  { month: "May", overall: 65, env: 60, social: 68, gov: 67 },
  { month: "Jun", overall: 64, env: 59, social: 67, gov: 66 },
  { month: "Jul", overall: 66, env: 61, social: 69, gov: 68 },
  { month: "Aug", overall: 67, env: 63, social: 70, gov: 68 },
  { month: "Sep", overall: 68, env: 64, social: 71, gov: 69 },
  { month: "Oct", overall: 69, env: 65, social: 72, gov: 70 },
  { month: "Nov", overall: 71, env: 67, social: 74, gov: 72 },
  { month: "Dec", overall: 72, env: 68, social: 75, gov: 73 },
];

const MOCK_CATEGORY = [
  { name: "Environmental", value: 68, color: "#16a34a" },
  { name: "Social", value: 75, color: "#2563eb" },
  { name: "Governance", value: 73, color: "#f59e0b" },
];

const MOCK_REPORTS = [
  { id: "1", name: "GRI Annual Report 2025", date: "2026-03-15", score: 78, framework: "GRI", status: "published" },
  { id: "2", name: "SASB Disclosure Q1 2026", date: "2026-03-01", score: 72, framework: "SASB", status: "published" },
  { id: "3", name: "TCFD Climate Report", date: "2026-02-20", score: 65, framework: "TCFD", status: "draft" },
  { id: "4", name: "CDP Response 2025", date: "2026-02-10", score: 70, framework: "CDP", status: "published" },
  { id: "5", name: "SDG Impact Assessment", date: "2026-01-28", score: 82, framework: "SDGs", status: "draft" },
];

const MOCK_INSIGHTS = [
  {
    type: "recommendation" as const,
    title: "Improve Carbon Disclosure",
    desc: "Your Scope 3 emissions reporting covers only 40% of categories. Expanding coverage could improve your Environmental score by 8-12 points.",
    icon: Lightbulb,
    color: "text-brand-green bg-brand-green/10",
    priority: "high",
  },
  {
    type: "risk" as const,
    title: "Governance Gap Detected",
    desc: "Board diversity metrics are below industry median. Consider documenting your diversity policy to avoid regulatory scrutiny.",
    icon: ShieldAlert,
    color: "text-destructive bg-destructive/10",
    priority: "high",
  },
  {
    type: "recommendation" as const,
    title: "Supply Chain Due Diligence",
    desc: "Add supplier ESG assessments to strengthen your Social pillar. Current coverage: 23% of Tier 1 suppliers.",
    icon: Lightbulb,
    color: "text-brand-blue bg-brand-blue/10",
    priority: "medium",
  },
];

const quickActions = [
  {
    href: "/dashboard/upload",
    icon: Upload,
    label: "quickUpload",
    desc: "quickUploadDesc",
    accent: "text-brand-green bg-brand-green/10 border-brand-green/20",
  },
  {
    href: "/dashboard/reports",
    icon: BarChart3,
    label: "quickReport",
    desc: "quickReportDesc",
    accent: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
  },
  {
    href: "/dashboard/insights",
    icon: Brain,
    label: "quickInsights",
    desc: "quickInsightsDesc",
    accent: "text-violet-600 bg-violet-500/10 border-violet-500/20",
  },
];

// ─── Types for API response ───
interface PillarBreakdown {
  pillar: string;
  score: number;
  weight: number;
  grade: string;
}
interface ScoreResponse {
  overall_score: number;
  grade: string;
  classification: string;
  pillars: PillarBreakdown[];
}
interface KPIItem {
  pillar: string;
  sub_indicator: string;
  kpi_name: string;
  description: string;
  target: string;
  timeframe: string;
  priority: number;
  measurement_method: string;
}
interface KPIResponse {
  kpis: KPIItem[];
}

// ─── Component ───

export default function DashboardPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const { company, token } = useCompany();

  const [stats, setStats] = useState(MOCK_STATS);
  const [categoryBreakdown, setCategoryBreakdown] = useState(MOCK_CATEGORY);
  const [overallValue, setOverallValue] = useState(72);
  const [aiInsights, setAiInsights] = useState(MOCK_INSIGHTS);

  useEffect(() => {
    if (!token || !company) return;

    const fetchScores = async () => {
      try {
        const raw = await analyticsApi.getScores(token, company.id);
        const scores = raw as ScoreResponse;

        const pillarMap: Record<string, { score: number }> = {};
        for (const p of scores.pillars) {
          pillarMap[p.pillar] = { score: Math.round(p.score) };
        }

        const overall = Math.round(scores.overall_score);
        setOverallValue(overall);

        setStats([
          { ...MOCK_STATS[0], value: String(overall) },
          { ...MOCK_STATS[1], value: String(pillarMap["E"]?.score ?? 0) },
          { ...MOCK_STATS[2], value: String(pillarMap["S"]?.score ?? 0) },
          { ...MOCK_STATS[3], value: String(pillarMap["G"]?.score ?? 0) },
        ]);

        setCategoryBreakdown([
          { name: "Environmental", value: pillarMap["E"]?.score ?? 0, color: "#16a34a" },
          { name: "Social", value: pillarMap["S"]?.score ?? 0, color: "#2563eb" },
          { name: "Governance", value: pillarMap["G"]?.score ?? 0, color: "#f59e0b" },
        ]);
      } catch {
        // Use mock data fallback
      }
    };

    const fetchKPIs = async () => {
      try {
        const raw = await analyticsApi.getKPIs(token, company.id, undefined, 3);
        const kpiData = raw as KPIResponse;

        if (kpiData.kpis && kpiData.kpis.length > 0) {
          const pillarIcons: Record<string, typeof Lightbulb> = {
            E: Lightbulb,
            S: Lightbulb,
            G: ShieldAlert,
          };
          const pillarColors: Record<string, string> = {
            E: "text-brand-green bg-brand-green/10",
            S: "text-brand-blue bg-brand-blue/10",
            G: "text-brand-gold bg-brand-gold/10",
          };

          setAiInsights(
            kpiData.kpis.slice(0, 3).map((kpi) => ({
              type: kpi.priority >= 8 ? ("risk" as const) : ("recommendation" as const),
              title: kpi.kpi_name,
              desc: `${kpi.description} Target: ${kpi.target}. Timeframe: ${kpi.timeframe}.`,
              icon: pillarIcons[kpi.pillar] || Lightbulb,
              color: pillarColors[kpi.pillar] || "text-violet-600 bg-violet-500/10",
              priority: kpi.priority >= 8 ? "high" : "medium",
            }))
          );
        }
      } catch {
        // Use mock data fallback
      }
    };

    fetchScores();
    fetchKPIs();
  }, [token, company]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Welcome Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t("dashboard.nav.overview")}
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t("dashboard.welcome")}, {user?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <Link href="/dashboard/reports">
          <Button size="sm" className="font-semibold shadow-sm shadow-primary/15 h-9 px-4 text-sm">
            <BarChart3 className="mr-2 h-3.5 w-3.5" />
            {t("dashboard.quickReport")}
          </Button>
        </Link>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.key}
            className="border-border/60 bg-card hover:shadow-md transition-all duration-200 rounded-2xl"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${stat.bg} ${stat.border}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.accent}`} />
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs font-medium px-2 py-0.5 ${
                    stat.trend === "up"
                      ? "bg-brand-green/10 text-brand-green border border-brand-green/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="mr-1 h-2.5 w-2.5 inline" />
                  ) : (
                    <TrendingDown className="mr-1 h-2.5 w-2.5 inline" />
                  )}
                  {stat.change}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-foreground leading-none mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {t(`dashboard.kpi.${stat.key}`)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ESG Evolution Line Chart */}
        <Card className="lg:col-span-2 border-border/60 rounded-2xl">
          <CardHeader className="px-6 pb-0 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  {t("dashboard.esgEvolution")}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("dashboard.esgEvolutionDesc")}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-green" />E
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-blue" />S
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-brand-gold" />G
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-foreground" />{t("dashboard.overall")}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 pt-4 pb-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_EVOLUTION} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[40, 100]}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Line type="monotone" dataKey="overall" stroke="var(--foreground)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="env" stroke="#16a34a" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="social" stroke="#2563eb" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="gov" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown Pie Chart */}
        <Card className="border-border/60 rounded-2xl">
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle className="text-base font-semibold text-foreground">
              {t("dashboard.categoryBreakdown")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("dashboard.categoryBreakdownDesc")}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-2 pb-6">
            <div className="h-[180px] w-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="w-full space-y-3 mt-2">
              {categoryBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-foreground font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-foreground">{item.value}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex items-baseline gap-1">
              <Star className="h-4 w-4 text-brand-gold mr-1" />
              <span className="text-2xl font-bold text-primary">{overallValue}</span>
              <span className="text-sm text-muted-foreground">/100 {t("dashboard.overall")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Recent Reports Table ─── */}
      <Card className="border-border/60 rounded-2xl">
        <CardHeader className="px-6 pb-3 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                {t("dashboard.recentReports")}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("dashboard.recentReportsDesc")}
              </p>
            </div>
            <Link href="/dashboard/reports">
              <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-foreground">
                {t("dashboard.viewAll")}
                <ArrowRight className="ml-1.5 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">{t("dashboard.reportName")}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{t("dashboard.framework")}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{t("dashboard.date")}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{t("dashboard.score")}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{t("dashboard.status")}</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_REPORTS.map((report) => (
                  <tr key={report.id} className="border-b border-border/30 hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{report.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="text-xs font-mono">
                        {report.framework}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-muted-foreground">{report.date}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              report.score >= 75
                                ? "bg-brand-green"
                                : report.score >= 60
                                ? "bg-brand-gold"
                                : "bg-destructive"
                            }`}
                            style={{ width: `${report.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{report.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          report.status === "published"
                            ? "text-brand-green bg-brand-green/10"
                            : "text-brand-gold bg-brand-gold/10"
                        }`}
                      >
                        {report.status === "published" ? (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        ) : (
                          <Clock className="mr-1 h-3 w-3" />
                        )}
                        {report.status === "published" ? t("dashboard.published") : t("dashboard.draft")}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ─── AI Insights + Quick Actions ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Insights Panel */}
        <Card className="lg:col-span-2 border-border/60 rounded-2xl">
          <CardHeader className="px-6 pb-3 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Brain className="h-4.5 w-4.5 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {t("dashboard.aiInsights")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{t("dashboard.aiInsightsDesc")}</p>
                </div>
              </div>
              <Link href="/dashboard/insights">
                <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-foreground">
                  {t("dashboard.viewAll")}
                  <ArrowRight className="ml-1.5 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-3">
            {aiInsights.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${insight.color}`}>
                  <insight.icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 h-4 ${
                        insight.priority === "high"
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"
                      }`}
                    >
                      {insight.priority === "high" ? "High" : "Medium"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.desc}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border/60 rounded-2xl">
          <CardHeader className="px-6 pb-3 pt-6">
            <CardTitle className="text-base font-semibold text-foreground">
              {t("dashboard.quickActions")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("dashboard.quickActionsDesc")}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-2">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="group flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 cursor-pointer">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${action.accent} transition-colors`}
                  >
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {t(`dashboard.${action.label}`)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {t(`dashboard.${action.desc}`)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
