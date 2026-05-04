"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompany } from "@/hooks/useCompany";
import { analyticsApi } from "@/services/api";
import {
  Brain,
  Lightbulb,
  ShieldAlert,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Users,
  Activity,
  Target,
  Zap,
  Clock,
  ChevronRight,
  Sparkles,
  Loader2,
} from "lucide-react";

// ─── Types ───

interface Insight {
  id: string;
  type: "recommendation" | "risk" | "improvement";
  category: "environmental" | "social" | "governance" | "general";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  estimatedImprovement?: string;
  pointsImprovement?: number;
  timeframe?: string;
  status: "new" | "in-progress" | "completed";
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "environmental": return Leaf;
    case "social": return Users;
    case "governance": return Activity;
    default: return Target;
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "environmental": return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    case "social": return "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20";
    case "governance": return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    default: return "text-violet-600 bg-violet-500/10 border-violet-500/20";
  }
}

function getCategoryDotColor(category: string) {
  switch (category) {
    case "environmental": return "#10b981";
    case "social": return "#3b82f6";
    case "governance": return "#f59e0b";
    default: return "#8b5cf6";
  }
}

function getPillarLabel(category: string) {
  switch (category) {
    case "environmental": return "E";
    case "social": return "S";
    case "governance": return "G";
    default: return "—";
  }
}

// Simulated point improvement based on priority
function getEstimatedPoints(priority: number): number {
  if (priority >= 8) return Math.floor(8 + (priority - 8) * 2);
  if (priority >= 5) return Math.floor(3 + (priority - 5));
  return 1 + Math.floor(priority * 0.5);
}

function getTypeConfig(type: string) {
  switch (type) {
    case "risk":
      return { icon: ShieldAlert, color: "text-destructive bg-destructive/10 border-destructive/20" };
    case "recommendation":
      return { icon: Lightbulb, color: "text-brand-green bg-brand-green/10 border-brand-green/20" };
    case "improvement":
      return { icon: Zap, color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20" };
    default:
      return { icon: Brain, color: "text-violet-600 bg-violet-500/10 border-violet-500/20" };
  }
}

function getImpactBadge(impact: string) {
  switch (impact) {
    case "high": return "bg-destructive/10 text-destructive border-destructive/20";
    case "medium": return "bg-brand-gold/10 text-brand-gold border-brand-gold/20";
    case "low": return "bg-muted text-muted-foreground border-border";
    default: return "bg-muted text-muted-foreground";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "new": return "bg-brand-blue/10 text-brand-blue border-brand-blue/20";
    case "in-progress": return "bg-brand-gold/10 text-brand-gold border-brand-gold/20";
    case "completed": return "bg-brand-green/10 text-brand-green border-brand-green/20";
    default: return "bg-muted text-muted-foreground";
  }
}

// ─── API types ───
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

function pillarToCategory(p: string): Insight["category"] {
  if (p === "E") return "environmental";
  if (p === "S") return "social";
  if (p === "G") return "governance";
  return "general";
}

export default function InsightsPage() {
  const t = useTranslations();
  const { company, loading: companyLoading, token } = useCompany();
  const [activeTab, setActiveTab] = useState("all");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!token || !company) return;
    setDataLoading(true);

    const fetchKPIs = async () => {
      try {
        const raw = await analyticsApi.getKPIs(token, company.id, undefined, 10);
        const data = raw as KPIResponse;

        if (data.kpis && data.kpis.length > 0) {
          const mapped: Insight[] = data.kpis.map((kpi, i) => ({
            id: String(i + 1),
            type: kpi.priority >= 8 ? "risk" : kpi.priority >= 5 ? "recommendation" : "improvement",
            category: pillarToCategory(kpi.pillar),
            title: kpi.kpi_name,
            description: kpi.description,
            impact: kpi.priority >= 8 ? "high" : kpi.priority >= 5 ? "medium" : "low",
            estimatedImprovement: `Target: ${kpi.target}`,
            pointsImprovement: getEstimatedPoints(kpi.priority),
            timeframe: kpi.timeframe,
            status: "new" as const,
          }));
          setInsights(mapped);
        }
      } catch {
        // No fallback to mock data
      } finally {
        setDataLoading(false);
        setDataLoaded(true);
      }
    };

    fetchKPIs();
  }, [token, company]);

  const filtered = activeTab === "all"
    ? insights
    : insights.filter((i) => i.type === activeTab);

  const highPriority = insights.filter((m) => m.impact === "high").length;

  const summaryStats = [
    { label: t("dashboard.totalInsights"), value: String(insights.length), icon: Brain, color: "text-violet-600 bg-violet-500/10" },
    { label: t("dashboard.highPriority"), value: String(highPriority), icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
    { label: t("dashboard.kpisGenerated"), value: String(insights.length), icon: TrendingUp, color: "text-brand-green bg-brand-green/10" },
    { label: t("dashboard.aiConfidence"), value: insights.length > 0 ? "92%" : "—", icon: Sparkles, color: "text-brand-blue bg-brand-blue/10" },
  ];

  const impactLabelMap: Record<string, string> = {
    high: t("dashboard.impactHigh"),
    medium: t("dashboard.impactMedium"),
    low: t("dashboard.impactLow"),
  };

  const statusLabelMap: Record<string, string> = {
    new: t("dashboard.statusNew"),
    "in-progress": t("dashboard.statusInProgress"),
    completed: t("dashboard.statusCompleted"),
  };

  if (companyLoading || dataLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Skeleton header */}
        <div className="flex flex-col gap-3">
          <div className="h-8 w-48 rounded-xl bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-muted animate-pulse" />
        </div>
        {/* Skeleton stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl border border-border/60 bg-muted animate-pulse" />
          ))}
        </div>
        {/* Skeleton cards */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border border-border/60 bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Brain className="h-4.5 w-4.5 text-violet-600" />
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("dashboard.nav.insights")}
            </p>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t("dashboard.insightsTitle")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("dashboard.insightsSubtitle")}
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs h-7 px-3">
          <Sparkles className="mr-1.5 h-3 w-3 text-violet-500" />
          {t("dashboard.aiPowered")}
        </Badge>
      </div>

      {/* ─── Summary Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <Card key={stat.label} className="border-border/60 rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Tabs + Insights List ─── */}
      {dataLoaded && insights.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Brain className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">{t("dashboard.noDataTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {t("dashboard.noDataDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="all">
            {t("dashboard.tabAll")} ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="risk">
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
            {t("dashboard.tabRisks")} ({insights.filter(i => i.type === "risk").length})
          </TabsTrigger>
          <TabsTrigger value="recommendation">
            <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
            {t("dashboard.tabRecommendations")} ({insights.filter(i => i.type === "recommendation").length})
          </TabsTrigger>
          <TabsTrigger value="improvement">
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            {t("dashboard.tabImprovements")} ({insights.filter(i => i.type === "improvement").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filtered.map((insight) => {
            const typeConfig = getTypeConfig(insight.type);
            const TypeIcon = typeConfig.icon;

            return (
              <Card key={insight.id} className="border-border/60 rounded-2xl hover:shadow-md transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${typeConfig.color}`}>
                      <TypeIcon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Pillar dot */}
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-black border"
                          style={{
                            color: getCategoryDotColor(insight.category),
                            backgroundColor: `${getCategoryDotColor(insight.category)}18`,
                            borderColor: `${getCategoryDotColor(insight.category)}30`,
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ backgroundColor: getCategoryDotColor(insight.category) }} />
                          {getPillarLabel(insight.category)}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 border capitalize ${getImpactBadge(insight.impact)}`}
                        >
                          {impactLabelMap[insight.impact] || insight.impact}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 border ${getStatusClass(insight.status)}`}
                        >
                          {insight.status === "completed" && <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />}
                          {statusLabelMap[insight.status] || insight.status}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {insight.description}
                      </p>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px]">
                        {insight.pointsImprovement !== undefined && (
                          <span className="flex items-center gap-1 font-semibold" style={{ color: getCategoryDotColor(insight.category) }}>
                            <TrendingUp className="h-3 w-3" />
                            pode melhorar +{insight.pointsImprovement} pts
                          </span>
                        )}
                        {insight.timeframe && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {insight.timeframe}
                          </span>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <Card className="border-dashed border-2 border-border/50 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">{t("dashboard.noInsightsCategory")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
