"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import {
  TrendingUp,
  TrendingDown,
  Building2,
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
  AlertCircle,
} from "lucide-react";

const mockStats = [
  {
    key: "esgScore",
    value: "72",
    change: "+4.2%",
    trend: "up",
    icon: Target,
    accent: "text-brand-green",
    bg: "bg-brand-green/10",
    border: "border-brand-green/20",
    label: "ESG Score",
  },
  {
    key: "companies",
    value: "5",
    change: "+2",
    trend: "up",
    icon: Building2,
    accent: "text-brand-blue",
    bg: "bg-brand-blue/10",
    border: "border-brand-blue/20",
    label: "Empresas",
  },
  {
    key: "documents",
    value: "34",
    change: "+12",
    trend: "up",
    icon: FileText,
    accent: "text-brand-gold",
    bg: "bg-brand-gold/10",
    border: "border-brand-gold/20",
    label: "Documentos",
  },
  {
    key: "reports",
    value: "8",
    change: "+3",
    trend: "up",
    icon: BarChart3,
    accent: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    label: "Relatórios",
  },
];

const recentActivity = [
  {
    type: "document",
    msg: "Annual report 2024 uploaded",
    time: "2h ago",
    icon: FileText,
    color: "text-brand-gold bg-brand-gold/10",
  },
  {
    type: "score",
    msg: "ESG score updated to 72/100",
    time: "4h ago",
    icon: TrendingUp,
    color: "text-brand-green bg-brand-green/10",
  },
  {
    type: "report",
    msg: "GRI Report Q4 2024 generated",
    time: "1d ago",
    icon: BarChart3,
    color: "text-brand-blue bg-brand-blue/10",
  },
  {
    type: "company",
    msg: "New company profile created",
    time: "2d ago",
    icon: Building2,
    color: "text-primary bg-primary/10",
  },
  {
    type: "alert",
    msg: "Sustainability policy uploaded",
    time: "3d ago",
    icon: AlertCircle,
    color: "text-violet-600 bg-violet-500/10",
  },
];

const pillarScores = [
  {
    key: "environmental",
    score: 68,
    icon: Leaf,
    label: "Environmental",
    barColor: "bg-brand-green",
    textColor: "text-brand-green",
    badgeClass: "bg-brand-green/10 text-brand-green border-brand-green/20",
  },
  {
    key: "social",
    score: 75,
    icon: Users,
    label: "Social",
    barColor: "bg-brand-blue",
    textColor: "text-brand-blue",
    badgeClass: "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
  },
  {
    key: "governance",
    score: 73,
    icon: Activity,
    label: "Governance",
    barColor: "bg-brand-gold",
    textColor: "text-brand-gold",
    badgeClass: "bg-brand-gold/10 text-brand-gold border-brand-gold/20",
  },
];

const quickActions = [
  {
    href: "/dashboard/upload",
    icon: Upload,
    label: "Upload de Documentos",
    desc: "Envie arquivos ESG para processamento com IA",
    accent: "text-brand-green bg-brand-green/10 border-brand-green/20",
  },
  {
    href: "/dashboard/reports",
    icon: BarChart3,
    label: "Gerar Relatório",
    desc: "Crie um novo relatório GRI, SASB ou TCFD",
    accent: "text-brand-blue bg-brand-blue/10 border-brand-blue/20",
  },
  {
    href: "/dashboard/companies",
    icon: Building2,
    label: "Gerenciar Empresas",
    desc: "Visualize e edite seus perfis de empresa",
    accent: "text-brand-gold bg-brand-gold/10 border-brand-gold/20",
  },
];

export default function DashboardPage() {
  const t = useTranslations();
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Welcome Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Visão Geral
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t("dashboard.welcome")}, {user?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <Link href="/dashboard/companies/new">
          <Button size="sm" className="font-semibold shadow-sm shadow-primary/15 h-9 px-4 text-sm">
            <Building2 className="mr-2 h-3.5 w-3.5" />
            {t("dashboard.newCompany")}
          </Button>
        </Link>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat) => (
          <Card
            key={stat.key}
            className="border-border/60 bg-card hover:shadow-sm transition-shadow"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${stat.bg} ${stat.border} ${stat.accent}`}
                >
                  <stat.icon className="h-4 w-4" />
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
              <div className="text-2xl font-bold text-foreground leading-none mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {t(`dashboard.stats.${stat.key}`)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Main Content Row ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ESG Pillar Scores */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="px-6 pb-0 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  {t("dashboard.pillarScores")}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Performance por pilar ESG
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5">
                <Star className="h-3.5 w-3.5 text-brand-gold" />
                <span className="text-sm font-bold text-foreground">72</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pt-5 pb-6 space-y-5">
            {pillarScores.map((pillar) => (
              <div key={pillar.key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md ${pillar.badgeClass} border`}
                    >
                      <pillar.icon className="h-3 w-3" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {t(`dashboard.pillars.${pillar.key}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{pillar.score}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-semibold px-1.5 py-0 h-4 border ${pillar.badgeClass}`}
                    >
                      {pillar.score >= 70 ? "Bom" : "Regular"}
                    </Badge>
                  </div>
                </div>
                {/* Custom colored progress */}
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${pillar.barColor}`}
                    style={{ width: `${pillar.score}%` }}
                  />
                </div>
              </div>
            ))}

            <Separator className="my-2" />

            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t("dashboard.overallScore")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Média ponderada dos 3 pilares
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">72</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                <p className="text-xs text-brand-green font-medium">↑ +4.2% este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/60">
          <CardHeader className="px-6 pb-0 pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">
                {t("dashboard.recentActivity")}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Últimas atualizações</p>
          </CardHeader>
          <CardContent className="px-6 pt-4 pb-5">
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.color}`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-xs font-medium text-foreground leading-snug">{item.msg}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4 text-xs h-8 text-muted-foreground hover:text-foreground"
              size="sm"
            >
              Ver toda a atividade
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ─── Quick Actions ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Ações Rápidas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acesso direto às funções mais usadas
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group border-border/60 bg-card hover:border-border hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${action.accent} transition-colors`}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {action.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors mt-0.5 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
