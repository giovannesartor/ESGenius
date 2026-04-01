"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  FileText,
  BarChart3,
  ArrowRight,
  Activity,
  Leaf,
  Users,
  Target,
} from "lucide-react";

const mockStats = [
  { key: "esgScore", value: "72", change: "+4.2%", trend: "up", icon: Target, color: "text-brand-green" },
  { key: "companies", value: "5", change: "+2", trend: "up", icon: Building2, color: "text-brand-blue" },
  { key: "documents", value: "34", change: "+12", trend: "up", icon: FileText, color: "text-brand-gold" },
  { key: "reports", value: "8", change: "+3", trend: "up", icon: BarChart3, color: "text-primary" },
];

const recentActivity = [
  { type: "document", msg: "Annual report 2024 uploaded", time: "2h ago" },
  { type: "score", msg: "ESG score updated to 72/100", time: "4h ago" },
  { type: "report", msg: "GRI Report Q4 2024 generated", time: "1d ago" },
  { type: "company", msg: "New company profile created", time: "2d ago" },
  { type: "document", msg: "Sustainability policy uploaded", time: "3d ago" },
];

const pillarScores = [
  { key: "environmental", score: 68, icon: Leaf, color: "bg-brand-green" },
  { key: "social", score: 75, icon: Users, color: "bg-brand-blue" },
  { key: "governance", score: 73, icon: Activity, color: "bg-brand-gold" },
];

export default function DashboardPage() {
  const t = useTranslations();
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("dashboard.welcome")}, {user?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Link href="/dashboard/companies/new">
          <Button className="font-semibold">
            <Building2 className="mr-2 h-4 w-4" />
            {t("dashboard.newCompany")}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat) => (
          <Card key={stat.key} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-4.5 w-4.5" />
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    stat.trend === "up" ? "text-brand-green" : "text-destructive"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t(`dashboard.stats.${stat.key}`)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ESG Pillar Scores */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              {t("dashboard.pillarScores")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pillarScores.map((pillar) => (
              <div key={pillar.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <pillar.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground capitalize">
                      {t(`dashboard.pillars.${pillar.key}`)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{pillar.score}/100</span>
                </div>
                <div className="relative">
                  <Progress value={pillar.score} className="h-2.5" />
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {t("dashboard.overallScore")}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">72</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              {t("dashboard.recentActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{item.msg}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-sm" size="sm">
              View all activity
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/dashboard/upload", icon: FileText, label: t("dashboard.quickUpload"), desc: "Upload ESG documents for AI processing" },
          { href: "/dashboard/reports", icon: BarChart3, label: t("dashboard.quickReport"), desc: "Generate a new GRI or SASB report" },
          { href: "/dashboard/companies", icon: Building2, label: t("dashboard.quickCompany"), desc: "Manage your company profiles" },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
              <CardContent className="p-5 flex flex-col items-start">
                <div className="p-2 rounded-lg bg-primary/10 text-primary mb-3">
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-foreground">{action.label}</span>
                <span className="text-xs text-muted-foreground mt-1">{action.desc}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
