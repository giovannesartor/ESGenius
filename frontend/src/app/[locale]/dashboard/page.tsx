"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Zap,
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
    hoverClass: "hover:border-emerald-500/30 hover:bg-emerald-500/4",
  },
  {
    href: "/dashboard/reports",
    icon: BarChart3,
    label: "quickReport",
    desc: "quickReportDesc",
    iconClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-500/8 border-blue-500/15",
    hoverClass: "hover:border-blue-500/30 hover:bg-blue-500/4",
  },
  {
    href: "/dashboard/insights",
    icon: Brain,
    label: "quickInsights",
    desc: "quickInsightsDesc",
    iconClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-500/8 border-violet-500/15",
    hoverClass: "hover:border-violet-500/30 hover:bg-violet-500/4",
  },
];

// ─── Types ───
interface PillarBreakdown { pillar: string; score: number; weight: number; grade: string; }
interface ScoreResponse { overall_score: number; grade: string; classification: string; pillars: PillarBreakdown[]; }
interface KPIItem { pillar: string; sub_indicator: string; kpi_name: string; description: string; target: string; timeframe: string; priority: number; measurement_method: string; }
interface KPIResponse { kpis: KPIItem[]; }

// ─── Score Ring (mini) ───
function MiniRing({ value, color, size = 56 }: { value: number; color: string; size?: number }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-2 rounded-full opacity-15 blur-md" style={{ backgroundColor: color }} />
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" className="dark:stroke-white/6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)", filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black tabular" style={{ color }}>{value || "—"}</span>
      </div>
    </div>
  );
}

// ─── Component ───
export default function DashboardPage() {
  const t = useTranslations();
  const { user } = useAuth();
  const { company, token } = useCompany();

  const EMPTY_STATS = [
    { key: "esgScore", value: "—", numericValue: 0, change: "", trend: "up" as const, icon: Target, iconClass: "text-emerald-600 dark:text-emerald-400", bgClass: "bg-emerald-500/8 border-emerald-500/15", progressColor: "#10b981", grade: "—" },
    { key: "environmental", value: "—", numericValue: 0, change: "", trend: "up" as const, icon: Leaf, iconClass: "text-teal-600 dark:text-teal-400", bgClass: "bg-teal-500/8 border-teal-500/15", progressColor: "#0d9488", grade: "—" },
    { key: "social", value: "—", numericValue: 0, change: "", trend: "up" as const, icon: Users, iconClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-500/8 border-blue-500/15", progressColor: "#3b82f6", grade: "—" },
    { key: "governance", value: "—", numericValue: 0, change: "", trend: "up" as const, icon: Activity, iconClass: "text-amber-600 dark:text-amber-400", bgClass: "bg-amber-500/8 border-amber-500/15", progressColor: "#f59e0b", grade: "—" },
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
          { name: t("dashboard.pillars.environmental"), value: pillarMap["E"]?.score ?? 0, color: "#10b981" },
          { name: t("dashboard.pillars.social"), value: pillarMap["S"]?.score ?? 0, color: "#3b82f6" },
          { name: t("dashboard.pillars.governance"), value: pillarMap["G"]?.score ?? 0, color: "#f59e0b" },
        ]);
      } catch { /* noop */ }
    };

    const fetchKPIs = async () => {
      try {
        const raw = await analyticsApi.getKPIs(token, company.id, undefined, 3);
        const kpiData = raw as KPIResponse;
        if (kpiData.kpis && kpiData.kpis.length > 0) {
          const pillarIcons: Record<string, typeof Lightbulb> = { E: Lightbulb, S: Lightbulb, G: ShieldAlert };
          const pillarIconClass: Record<string, string> = {
            E: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
            S: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
            G: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
          };
          const pillarBorderClass: Record<string, string> = {
            E: "border-l-emerald-500", S: "border-l-blue-500", G: "border-l-amber-500",
          };
          setAiInsights(
            kpiData.kpis.slice(0, 3).map((kpi) => ({
              type: kpi.priority >= 8 ? ("risk" as const) : ("recommendation" as const),
              title: kpi.kpi_name,
              desc: `${kpi.description} Target: ${kpi.target}. Timeframe: ${kpi.timeframe}.`,
              icon: pillarIcons[kpi.pillar] || Lightbulb,
              iconClass: `${pillarIconClass[kpi.pillar] || "text-violet-600 bg-violet-500/10"}`,
              borderClass: pillarBorderClass[kpi.pillar] || "border-l-violet-500",
              priority: kpi.priority >= 8 ? "high" : "medium",
            }))
          );
        }
      } catch { /* noop */ }
    };

    const fetchReports = async () => {
      try {
        const raw = await reportApi.list(token, company.id);
        const data = raw as Array<{ id: string; title?: string; framework_code?: string; status: string; created_at: string; }>;
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
      } catch { /* noop */ }
    };

    fetchScores();
    fetchKPIs();
    fetchReports();
  }, [token, company]);

  const firstName = user?.full_name?.split(" ")[0] || "User";

  const ringColors = ["#10b981", "#0d9488", "#3b82f6", "#f59e0b"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">

      {/* ─── Welcome Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.16em] mb-1.5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            {t("dashboard.nav.overview")}
          </p>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            {t("dashboard.welcome")}, {firstName}
            <Hand className="inline-block h-6 w-6 text-amber-500" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard/upload">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 text-sm font-semibold rounded-xl border-border/60"
            >
              <Upload className="mr-2 h-3.5 w-3.5" />
              {t("dashboard.quickUpload")}
            </Button>
          </Link>
          <Link href="/dashboard/reports">
            <Button
              size="sm"
              className="h-9 px-4 text-sm font-bold rounded-xl shadow-sm shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all bg-primary text-primary-foreground"
            >
              <BarChart3 className="mr-2 h-3.5 w-3.5" />
              {t("dashboard.quickReport")}
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── KPI Score Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.key}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card hover:shadow-md hover:border-border transition-all duration-200 p-5"
          >
            {/* Subtle top accent line */}
            <div
              className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl"
              style={{ backgroundColor: stat.progressColor, opacity: 0.6 }}
            />

            <div className="flex items-start justify-between mb-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${stat.bgClass} transition-transform group-hover:scale-105 duration-200`}
              >
                <stat.icon className={`h-4 w-4 ${stat.iconClass}`} />
              </div>
              <MiniRing value={stat.numericValue} color={stat.progressColor} size={44} />
            </div>

            <div className="mb-3">
              <div className="text-3xl font-black text-foreground leading-none mb-0.5 tabular">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {t(`dashboard.kpi.${stat.key}`)}
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${stat.numericValue}%`, backgroundColor: stat.progressColor, boxShadow: `0 0 6px ${stat.progressColor}60` }}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground/40">0</span>
                <span className="text-[10px] text-muted-foreground/40">100</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ESG Evolution */}
        <Card className="lg:col-span-2 border-border/60 rounded-2xl overflow-hidden">
          <CardHeader className="px-6 pb-0 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  {t("dashboard.esgEvolution")}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("dashboard.esgEvolutionDesc")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
                  {[["#10b981","E"],["#3b82f6","S"],["#f59e0b","G"]].map(([c,l]) => (
                    <span key={l} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />{l}
                    </span>
                  ))}
                </div>
                <Tabs defaultValue="6m">
                  <TabsList className="h-7 p-0.5 rounded-lg bg-muted/60">
                    {["1m", "3m", "6m", "1a"].map((p) => (
                      <TabsTrigger key={p} value={p}
                        className="h-6 px-2.5 text-[10px] font-bold uppercase rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                        {p}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pt-4 pb-6">
            <div className="h-[240px] w-full flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/50 bg-muted/10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <BarChart3 className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-muted-foreground">{t("dashboard.noEvolutionData")}</p>
                <p className="text-xs text-muted-foreground/50 mt-0.5">Upload data to visualize trends</p>
              </div>
              <Link href="/dashboard/upload">
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg">
                  <Upload className="mr-1.5 h-3 w-3" />
                  Upload data
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-border/60 rounded-2xl overflow-hidden">
          <CardHeader className="px-6 pb-0 pt-6">
            <CardTitle className="text-base font-bold text-foreground">
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
                      <Pie data={categoryBreakdown} cx="50%" cy="50%"
                        innerRadius={52} outerRadius={72} paddingAngle={4} dataKey="value" stroke="none">
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color}
                            style={{ filter: `drop-shadow(0 0 4px ${entry.color}60)` }} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{
                        backgroundColor: "var(--card)", border: "1px solid var(--border)",
                        borderRadius: "10px", fontSize: "12px",
                      }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-foreground tabular">{overallValue}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Score</span>
                  </div>
                </div>
                <div className="w-full space-y-2.5 mt-4">
                  {categoryBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-foreground font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                        </div>
                        <span className="text-sm font-black text-foreground tabular w-8 text-right">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4 opacity-50" />
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-2xl font-black text-primary tabular">{overallValue}</span>
                  <span className="text-sm text-muted-foreground">/100 {t("dashboard.overall")}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <Target className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground text-center">{t("dashboard.noDataTitle")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Recent Reports ─── */}
      <Card className="border-border/60 rounded-2xl overflow-hidden">
        <CardHeader className="px-6 pb-3 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                {t("dashboard.recentReports")}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("dashboard.recentReportsDesc")}
              </p>
            </div>
            <Link href="/dashboard/reports">
              <Button variant="ghost" size="sm"
                className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground rounded-lg">
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
                <p className="text-xs text-muted-foreground/50 mt-0.5">Your reports will appear here</p>
              </div>
              <Link href="/dashboard/upload">
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg mt-1">
                  <Upload className="mr-1.5 h-3 w-3" />
                  Upload first report
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {[t("dashboard.reportName"), t("dashboard.framework"), t("dashboard.date"), t("dashboard.status"), ""].map((h, i) => (
                      <th key={i}
                        className={`text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-3 ${i === 0 ? "px-6 text-left" : i === 4 ? "px-6 text-right" : "px-4 text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, idx) => (
                    <tr key={report.id}
                      className={`group border-b border-border/30 hover:bg-muted/30 transition-colors ${idx === reports.length - 1 ? "border-b-0" : ""}`}>
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
                        <Badge variant="outline" className="text-xs font-mono border-border/60 bg-muted/40">
                          {report.framework}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-muted-foreground">{report.date}</span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="secondary"
                          className={`text-xs font-medium border ${
                            report.status === "published"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          }`}>
                          {report.status === "published"
                            ? <><CheckCircle2 className="mr-1.5 h-3 w-3 inline" />{t("dashboard.published")}</>
                            : <><Clock className="mr-1.5 h-3 w-3 inline" />{t("dashboard.draft")}</>}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground/40 hover:text-foreground hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all">
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

        {/* AI Insights */}
        <Card className="lg:col-span-2 border-border/60 rounded-2xl overflow-hidden">
          <CardHeader className="px-6 pb-3 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/15">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    {t("dashboard.aiInsights")}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{t("dashboard.aiInsightsDesc")}</p>
                </div>
              </div>
              <Link href="/dashboard/insights">
                <Button variant="ghost" size="sm"
                  className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground rounded-lg">
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
                  <p className="text-xs text-muted-foreground/50 mt-0.5">AI insights will appear here after upload</p>
                </div>
              </div>
            ) : (
              aiInsights.map((insight, i) => (
                <div key={i}
                  className={`relative flex items-start gap-4 p-4 rounded-xl border-l-2 border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group ${insight.borderClass}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${insight.iconClass}`}>
                    <insight.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-foreground leading-tight">{insight.title}</p>
                      <Badge variant="secondary"
                        className={`text-[10px] px-1.5 h-4 shrink-0 border font-semibold ${
                          insight.priority === "high"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}>
                        {insight.priority === "high" ? <AlertCircle className="mr-0.5 h-2.5 w-2.5 inline" /> : null}
                        {insight.priority === "high" ? t("dashboard.priorityHigh") : t("dashboard.priorityMedium")}
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
        <Card className="border-border/60 rounded-2xl overflow-hidden">
          <CardHeader className="px-6 pb-3 pt-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  {t("dashboard.quickActions")}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("dashboard.quickActionsDesc")}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-2.5">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className={`group flex items-center gap-3.5 p-4 rounded-xl border border-border/50 ${action.hoverClass} hover:shadow-sm transition-all duration-150 cursor-pointer`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${action.bgClass} ${action.iconClass} transition-transform group-hover:scale-105 duration-150`}>
                    <action.icon className="h-4 w-4" />
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

            <Separator className="my-2 opacity-50" />

            {/* Company info */}
            <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/10">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground truncate">
                  {company?.name || "Company"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Active plan · Data up to date
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
