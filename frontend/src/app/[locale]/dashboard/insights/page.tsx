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

// ─── Mock Data ───

interface Insight {
  id: string;
  type: "recommendation" | "risk" | "improvement";
  category: "environmental" | "social" | "governance" | "general";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  estimatedImprovement?: string;
  timeframe?: string;
  status: "new" | "in-progress" | "completed";
}

const MOCK_INSIGHTS: Insight[] = [
  {
    id: "1",
    type: "risk",
    category: "governance",
    title: "Board Diversity Gap",
    description: "Your board composition shows less than 25% gender diversity, which is below the industry median of 35%. This could trigger increased regulatory scrutiny under upcoming EU CSRD requirements and may negatively impact your governance rating in major ESG indices.",
    impact: "high",
    estimatedImprovement: "+8 pts Governance",
    timeframe: "6-12 months",
    status: "new",
  },
  {
    id: "2",
    type: "recommendation",
    category: "environmental",
    title: "Expand Scope 3 Emissions Coverage",
    description: "Currently reporting Scope 3 emissions for only 6 of 15 categories. Categories 1 (Purchased Goods), 4 (Upstream Transport), and 11 (Use of Sold Products) represent an estimated 45% of your total carbon footprint and should be prioritized.",
    impact: "high",
    estimatedImprovement: "+12 pts Environmental",
    timeframe: "3-6 months",
    status: "new",
  },
  {
    id: "3",
    type: "improvement",
    category: "social",
    title: "Supply Chain Labor Assessment",
    description: "Only 23% of Tier 1 suppliers have undergone labor practice assessments. Industry leaders assess 80%+. Implementing a systematic supplier ESG screening program would significantly improve your Social pillar score.",
    impact: "medium",
    estimatedImprovement: "+6 pts Social",
    timeframe: "6-12 months",
    status: "in-progress",
  },
  {
    id: "4",
    type: "recommendation",
    category: "environmental",
    title: "Set Science-Based Targets (SBTi)",
    description: "Your emission reduction targets are not yet aligned with the Paris Agreement. Committing to SBTi would demonstrate climate leadership and is increasingly expected by institutional investors for portfolio inclusion.",
    impact: "high",
    estimatedImprovement: "+10 pts Environmental",
    timeframe: "3-6 months",
    status: "new",
  },
  {
    id: "5",
    type: "risk",
    category: "general",
    title: "Data Completeness Alert",
    description: "12 out of 48 material ESG indicators have no data for the current reporting period. Missing data significantly reduces confidence scores and may result in lower third-party ESG ratings.",
    impact: "high",
    timeframe: "Immediate",
    status: "new",
  },
  {
    id: "6",
    type: "improvement",
    category: "governance",
    title: "Anti-Corruption Training Coverage",
    description: "Anti-corruption training reaches 67% of employees. Extending coverage to 95%+ with documented records would strengthen your Ethics & Compliance score and meet GRI 205 disclosure requirements.",
    impact: "medium",
    estimatedImprovement: "+4 pts Governance",
    timeframe: "3-6 months",
    status: "completed",
  },
  {
    id: "7",
    type: "recommendation",
    category: "social",
    title: "Employee Well-being Program",
    description: "Implement a comprehensive mental health and well-being program. Companies with such programs report 23% lower turnover and score 15% higher on Social pillar assessments.",
    impact: "medium",
    estimatedImprovement: "+5 pts Social",
    timeframe: "6-12 months",
    status: "new",
  },
  {
    id: "8",
    type: "risk",
    category: "environmental",
    title: "Water Stress Exposure",
    description: "32% of your operational facilities are in high water-stress regions. CDP Water Security disclosure is recommended. This is also a material risk under TCFD physical risk categories.",
    impact: "medium",
    timeframe: "Monitor quarterly",
    status: "in-progress",
  },
];

const MOCK_SUMMARY = [
  { label: "Total Insights", value: "8", icon: Brain, color: "text-violet-600 bg-violet-500/10" },
  { label: "High Priority", value: "4", icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
  { label: "Potential Improvement", value: "+45 pts", icon: TrendingUp, color: "text-brand-green bg-brand-green/10" },
  { label: "AI Confidence", value: "92%", icon: Sparkles, color: "text-brand-blue bg-brand-blue/10" },
];

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
    case "environmental": return "text-brand-green bg-brand-green/10";
    case "social": return "text-brand-blue bg-brand-blue/10";
    case "governance": return "text-brand-gold bg-brand-gold/10";
    default: return "text-violet-600 bg-violet-500/10";
  }
}

function getTypeConfig(type: string) {
  switch (type) {
    case "risk":
      return { icon: ShieldAlert, label: "Risk Alert", color: "text-destructive bg-destructive/10 border-destructive/20" };
    case "recommendation":
      return { icon: Lightbulb, label: "Recommendation", color: "text-brand-green bg-brand-green/10 border-brand-green/20" };
    case "improvement":
      return { icon: Zap, label: "Improvement", color: "text-brand-blue bg-brand-blue/10 border-brand-blue/20" };
    default:
      return { icon: Brain, label: "Insight", color: "text-violet-600 bg-violet-500/10 border-violet-500/20" };
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

function getStatusBadge(status: string) {
  switch (status) {
    case "new": return { label: "New", class: "bg-brand-blue/10 text-brand-blue border-brand-blue/20" };
    case "in-progress": return { label: "In Progress", class: "bg-brand-gold/10 text-brand-gold border-brand-gold/20" };
    case "completed": return { label: "Completed", class: "bg-brand-green/10 text-brand-green border-brand-green/20" };
    default: return { label: status, class: "bg-muted text-muted-foreground" };
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
  const [insights, setInsights] = useState<Insight[]>(MOCK_INSIGHTS);
  const [summaryStats, setSummaryStats] = useState(MOCK_SUMMARY);
  const [dataLoading, setDataLoading] = useState(false);

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
            timeframe: kpi.timeframe,
            status: "new" as const,
          }));
          setInsights(mapped);

          const highPriority = mapped.filter((m) => m.impact === "high").length;
          setSummaryStats([
            { label: "Total Insights", value: String(mapped.length), icon: Brain, color: "text-violet-600 bg-violet-500/10" },
            { label: "High Priority", value: String(highPriority), icon: AlertTriangle, color: "text-destructive bg-destructive/10" },
            { label: "KPIs Generated", value: String(data.kpis.length), icon: TrendingUp, color: "text-brand-green bg-brand-green/10" },
            { label: "AI Confidence", value: "92%", icon: Sparkles, color: "text-brand-blue bg-brand-blue/10" },
          ]);
        }
      } catch {
        // Fall back to mock data
      } finally {
        setDataLoading(false);
      }
    };

    fetchKPIs();
  }, [token, company]);

  const filtered = activeTab === "all"
    ? insights
    : insights.filter((i) => i.type === activeTab);

  if (companyLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="all">
            All ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="risk">
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
            Risks ({insights.filter(i => i.type === "risk").length})
          </TabsTrigger>
          <TabsTrigger value="recommendation">
            <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
            Recommendations ({insights.filter(i => i.type === "recommendation").length})
          </TabsTrigger>
          <TabsTrigger value="improvement">
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            Improvements ({insights.filter(i => i.type === "improvement").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filtered.map((insight) => {
            const typeConfig = getTypeConfig(insight.type);
            const TypeIcon = typeConfig.icon;
            const CategoryIcon = getCategoryIcon(insight.category);
            const statusBadge = getStatusBadge(insight.status);

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
                        <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 border ${getCategoryColor(insight.category)}`}
                        >
                          <CategoryIcon className="mr-0.5 h-2.5 w-2.5" />
                          {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 border capitalize ${getImpactBadge(insight.impact)}`}
                        >
                          {insight.impact} impact
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 border ${statusBadge.class}`}
                        >
                          {insight.status === "completed" && <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />}
                          {statusBadge.label}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        {insight.description}
                      </p>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-4 text-[11px]">
                        {insight.estimatedImprovement && (
                          <span className="flex items-center gap-1 text-brand-green font-medium">
                            <TrendingUp className="h-3 w-3" />
                            {insight.estimatedImprovement}
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
                <p className="text-sm font-medium text-muted-foreground">No insights in this category</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
