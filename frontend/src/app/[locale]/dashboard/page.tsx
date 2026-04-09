"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { analyticsApi, reportApi } from "@/services/api";
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
  Sparkles,
  AlertCircle,
  MoreHorizontal,
  Building2,
  Hand,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

// ─── Quick Actions Config ───

const quickActions = [
  {
    href: "/dashboard/upload",
    icon: Upload,
    label: "quickUpload",
    desc: "quickUploadDesc",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/8 border-emerald-500/15",
    hoverClass: "hover:border-emerald-500/30 hover:bg-emerald-500/5",
  },
  {
    href: "/dashboard/reports",
    icon: BarChart3,
    label: "quickReport",
    desc: "quickReportDesc",
    iconClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/8 border-blue-500/15",
    hoverClass: "hover:border-blue-500/30 hover:bg-blue-500/5",
  },
  {
    href: "/dashboard/insights",
    icon: Brain,
    label: "quickInsights",
    desc: "quickInsightsDesc",
    iconClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/8 border-violet-500/15",
    hoverClass: "hover:border-violet-500/30 hover:bg-violet-500/5",
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

// ─── Grade Badge ───
function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    B: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    C: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    D: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    F: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };
  return (
    <Badge variant="secondary" className={`text-xs px-2 py-0.5 border font-bold ${colors[grade] || colors.C}`}>
      {grade}
    </Badge>
  );
}

// ─── Component ───

export default function DashboardPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const { company, token } = useCompany();

  const EMPTY_STATS = [
    {
      key: "esgScore",
      value: "—",
      numericValue: 0,
      change: "",
      trend: "up" as const,
      icon: Target,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-500/8 border-emerald-500/15",
      progressColor: "#16a34a",
      grade: "—",
    },
    {
      key: "environmental",
      value: "—",
      numericValue: 0,
      change: "",
      trend: "up" as const,
      icon: Leaf,
      iconClass: "text-teal-600 dark:text-teal-400",
      bgClass: "bg-teal-500/8 border-teal-500/15",
      progressColor: "#0d9488",
      grade: "—",
    },
    {
      key: "social",
      value: "—",
      numericValue: 0,
      change: "",
      trend: "up" as const,
      icon: Users,
      iconClass: "text-blue-600 dark:text-blue-400",
      bgClass: "bg-blue-500/8 border-blue-500/15",
      progressColor: "#2563eb",
      grade: "—",
    },
    {
      key: "governance",
      value: "—",
      numericValue: 0,
      change: "",
      trend: "up" as const,
      icon: Activity,
      iconClass: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-500/8 border-amber-500/15",
      progressColor: "#f59e0b",
      grade: "—",
    },
  ];

  const [stats, setStats] = useState(EMPTY_STATS);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [overallValue, setOverallValue] = useState(0);
  const [aiInsights, setAiInsights] = useState<Array<{
    type: "recommendation" | "risk";
    title: string;
    desc: string;
    icon: typeof Lightbulb;
    iconClass: string;
    borderClass: string;
    priority: string;
  }>>([]);
  const [reports, setReports] = useState<Array<{
    id: string;
    name: string;
    date: string;
    score: number;
    framework: string;
    status: string;
  }>>([]);

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
          { ...EMPTY_STATS[0], value: String(overall), numericValue: overall },
          { ...EMPTY_STATS[1], value: String(pillarMap["E"]?.score ?? 0), numericValue: pillarMap["E"]?.score ?? 0 },
          { ...EMPTY_STATS[2], value: String(pillarMap["S"]?.score ?? 0), numericValue: pillarMap["S"]?.score ?? 0 },
          { ...EMPTY_STATS[3], value: String(pillarMap["G"]?.score ?? 0), numericValue: pillarMap["G"]?.score ?? 0 },
        ]);

        setCategoryBreakdown([
          { name: t("dashboard.pillars.environmental"), value: pillarMap["E"]?.score ?? 0, color: "#16a34a" },
          { name: t("dashboard.pillars.social"), value: pillarMap["S"]?.score ?? 0, color: "#2563eb" },
          { name: t("dashboard.pillars.governance"), value: pillarMap["G"]?.score ?? 0, color: "#f59e0b" },
        ]);
      } catch {
        // No fallback
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
          const pillarIconClass: Record<string, string> = {
            E: "text-emerald-600 dark:text-emerald-400",
            S: "text-blue-600 dark:text-blue-400",
            G: "text-amber-600 dark:text-amber-400",
          };
          const pillarBgClass: Record<string, string> = {
            E: "bg-emerald-500/10",
            S: "bg-blue-500/10",
            G: "bg-amber-500/10",
          };
          const pillarBorderClass: Record<string, string> = {
            E: "border-l-emerald-500",
            S: "border-l-blue-500",
            G: "border-l-amber-500",
          };

          setAiInsights(
            kpiData.kpis.slice(0, 3).map((kpi) => ({
              type: kpi.priority >= 8 ? ("risk" as const) : ("recommendation" as const),
              title: kpi.kpi_name,
              desc: `${kpi.description} Target: ${kpi.target}. Timeframe: ${kpi.timeframe}.`,
              icon: pillarIcons[kpi.pillar] || Lightbulb,
              iconClass: `${pillarIconClass[kpi.pillar] || "text-violet-600"} ${pillarBgClass[kpi.pillar] || "bg-violet-500/10"}`,
              borderClass: pillarBorderClass[kpi.pillar] || "border-l-violet-500",
              priority: kpi.priority >= 8 ? "high" : "medium",
            }))
          );
        }
      } catch {
        // No fallback
      }
    };

    const fetchReports = async () => {
      try {
        const raw = await reportApi.list(token, company.id);
        const data = raw as Array<{
          id: string;
          title?: string;
          framework_code?: string;
          status: string;
          created_at: string;
        }>;
        setReports(
          data.slice(0, 5).map((r) => ({
            id: r.id,
            name: r.title || `Report ${r.id.slice(0, 8)}`,
            date: new Date(r.created_at).toLocaleDateString(),
            score: 0,
            framework: r.framework_code || "—",
            status: r.status,
          }))
        );
      } catch {
        // No fallback
      }
    };

    fetchScores();
    fetchKPIs();
    fetchReports();
  }, [token, company]);

  const firstName = user?.full_name?.split(" ")[0] || "User";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* ─── Welcome Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {t("dashboard.nav.overview")}
            </p>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {t("dashboard.welcome")}, {firstName} <Hand className="inline-block h-6 w-6 ml-1 text-amber-500 dark:text-amber-400" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t("dashboard.subtitle")}</p>
        </div>
        <div className="shrink-0">
          <Link href="/dashboard/reports">
            <Button
              size="sm"
              className="h-9 px-4 text-sm font-semibold rounded-xl shadow-sm shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.01] transition-all"
            >
              <BarChart3 className="mr-2 h-3.5 w-3.5" />
              {t("dashboard.quickReport")}
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.key}
            className="border-border/60 bg-card hover:shadow-md hover:border-border transition-all duration-200 rounded-2xl overflow-hidden group"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${stat.bgClass} transition-transform group-hover:scale-105 duration-200`}
                >
                  <stat.icon className={`h-4.5 w-4.5 ${stat.iconClass}`} />
                </div>
                {stat.change ? (
                  <Badge
                    variant="secondary"
                    className={`text-[11px] font-semibold px-2 py-0.5 border rounded-lg ${
                      stat.trend === "up"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="mr-1 h-2.5 w-2.5 inline" />
                    ) : (
                      <TrendingDown className="mr-1 h-2.5 w-2.5 inline" />
                    )}
                    {stat.change}
                  </Badge>
                ) : (
                  <div className="h-6 w-6 rounded-lg bg-muted/60 flex items-center justify-center">
                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              <div className="mb-3">
                <div className="text-3xl font-extrabold text-foreground leading-none mb-0.5 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {t(`dashboard.kpi.${stat.key}`)}
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <Progress
                  value={stat.numericValue}
                  className="h-1.5 rounded-full bg-muted"
                  indicatorClassName="!bg-none"
                  indicatorStyle={{ backgroundColor: stat.progressColor }}
                />
                <div className="flex justify-between">
                  <span className="text-[10px] text-muted-foreground/50">0</span>
                  <span className="text-[10px] text-muted-foreground/50">100</span>
                </div>
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
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />E
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />S
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />G
                  </span>
                </div>
                <Tabs defaultValue="6m">
                  <TabsList className="h-7 p-0.5 rounded-lg bg-muted/60">
                    {["1m", "3m", "6m", "1a"].map((p) => (
                      <TabsTrigger
                        key={p}
                        value={p}
                        className="h-6 px-2.5 text-[10px] font-bold uppercase rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm"
                      >
                        {p}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pt-4 pb-6">
            <div className="h-[240px] w-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <BarChart3 className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">{t("dashboard.noEvolutionData")}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Faça upload de dados para visualizar</p>
              </div>
              <Link href="/dashboard/upload">
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg mt-1">
                  <Upload className="mr-1.5 h-3 w-3" />
                  Enviar dados
                </Button>
              </Link>
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
          <CardContent className="flex flex-col items-center pt-4 pb-6 px-6">
            {categoryBreakdown.length > 0 ? (
              <>
                <div className="relative h-[160px] w-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={75}
                        paddingAngle={3}
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
                          borderRadius: "10px",
                          fontSize: "12px",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center score */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-foreground tabular-nums">{overallValue}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Score</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="w-full space-y-2.5 mt-4">
                  {categoryBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-foreground font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={item.value}
                          className="w-16 h-1.5 bg-muted"
                          indicatorClassName="!bg-none"
                          indicatorStyle={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-bold text-foreground tabular-nums w-8 text-right">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4 opacity-60" />
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-2xl font-extrabold text-primary tabular-nums">{overallValue}</span>
                  <span className="text-sm text-muted-foreground">/100 {t("dashboard.overall")}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Target className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground text-center">{t("dashboard.noDataTitle")}</p>
              </div>
            )}
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
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground rounded-lg"
              >
                {t("dashboard.viewAll")}
                <ArrowRight className="ml-1.5 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <FileText className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-muted-foreground">{t("dashboard.noReportsYet")}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Seus relatórios aparecerão aqui</p>
              </div>
              <Link href="/dashboard/upload">
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg mt-1">
                  <Upload className="mr-1.5 h-3 w-3" />
                  Enviar primeiro relatório
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      {t("dashboard.reportName")}
                    </th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      {t("dashboard.framework")}
                    </th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      {t("dashboard.date")}
                    </th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                      {t("dashboard.status")}
                    </th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, idx) => (
                    <tr
                      key={report.id}
                      className={`group border-b border-border/30 hover:bg-muted/30 transition-colors duration-150 ${
                        idx === reports.length - 1 ? "border-b-0" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 border border-primary/10 group-hover:bg-primary/12 transition-colors">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-semibold text-foreground truncate max-w-[200px]">
                            {report.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className="text-xs font-mono border-border/60 bg-muted/40 hover:bg-muted/60 transition-colors"
                        >
                          {report.framework}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-muted-foreground">{report.date}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant="secondary"
                          className={`text-xs font-medium border ${
                            report.status === "published"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {report.status === "published" ? (
                            <CheckCircle2 className="mr-1.5 h-3 w-3" />
                          ) : (
                            <Clock className="mr-1.5 h-3 w-3" />
                          )}
                          {report.status === "published"
                            ? t("dashboard.published")
                            : t("dashboard.draft")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-foreground hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── AI Insights + Quick Actions ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Insights Panel */}
        <Card className="lg:col-span-2 border-border/60 rounded-2xl">
          <CardHeader className="px-6 pb-3 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/15">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {t("dashboard.aiInsights")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{t("dashboard.aiInsightsDesc")}</p>
                </div>
              </div>
              <Link href="/dashboard/insights">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  {t("dashboard.viewAll")}
                  <ArrowRight className="ml-1.5 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-3">
            {aiInsights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Brain className="h-7 w-7 text-muted-foreground/30" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-muted-foreground">{t("dashboard.noDataTitle")}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Insights gerados pela IA aparecerão aqui</p>
                </div>
              </div>
            ) : (
              aiInsights.map((insight, i) => (
                <div
                  key={i}
                  className={`relative flex items-start gap-4 p-4 rounded-xl border-l-2 border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group ${insight.borderClass}`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${insight.iconClass}`}>
                    <insight.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-foreground leading-tight">{insight.title}</p>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 h-4 shrink-0 border font-semibold ${
                          insight.priority === "high"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {insight.priority === "high" ? (
                          <AlertCircle className="mr-0.5 h-2.5 w-2.5 inline" />
                        ) : null}
                        {insight.priority === "high"
                          ? t("dashboard.priorityHigh")
                          : t("dashboard.priorityMedium")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{insight.desc}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0 mt-0.5 transition-colors" />
                </div>
              ))
            )}
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
          <CardContent className="px-6 pb-6 space-y-2.5">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div
                  className={`group flex items-center gap-3.5 p-4 rounded-xl border border-border/50 ${action.hoverClass} hover:shadow-sm transition-all duration-150 cursor-pointer`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${action.bgClass} ${action.iconClass} transition-transform group-hover:scale-105 duration-150`}
                  >
                    <action.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                      {t(`dashboard.${action.label}`)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                      {t(`dashboard.${action.desc}`)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            ))}

            {/* Divider + company info */}
            <Separator className="my-2 opacity-50" />
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/10">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground truncate">
                  {company?.name || "Empresa"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Plano ativo · Dados atualizados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
