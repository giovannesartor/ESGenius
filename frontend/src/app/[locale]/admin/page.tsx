"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Brain,
  Layers,
  Activity,
  CheckCircle,
  ArrowRight,
  FileText,
  BarChart3,
  Shield,
  TrendingUp,
  Database,
  Cpu,
  Server,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/services/api";

interface AdminStats {
  total_users: number;
  total_companies: number;
  total_documents: number;
  total_reports: number;
  total_frameworks: number;
  active_users_30d: number;
}

const systemHealth = [
  { name: "API Server", icon: Server, latency: "42ms" },
  { name: "Database", icon: Database, latency: "8ms" },
  { name: "Redis Cache", icon: Cpu, latency: "2ms" },
  { name: "AI Engine", icon: Brain, latency: "320ms" },
];

const quickActions = [
  { label: "Manage Frameworks", href: "/admin/frameworks", icon: Layers, description: "Add, edit, or remove ESG frameworks" },
  { label: "View Users", href: "/admin/users", icon: Users, description: "Manage user accounts and permissions" },
  { label: "AI Logs", href: "/admin/ai-logs", icon: Brain, description: "Monitor AI processing and requests" },
];

export default function AdminOverviewPage() {
  const t = useTranslations();
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await adminApi.getStats(token) as AdminStats;
      setStats(data);
    } catch {
      // keep null
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, [token]);

  const statsCards = [
    {
      label: "Total Users",
      value: loading ? "—" : String(stats?.total_users ?? 0),
      change: `${stats?.active_users_30d ?? 0} active (30d)`,
      icon: Users,
      color: "text-brand-blue",
      bgColor: "bg-brand-blue/10",
    },
    {
      label: "Total Companies",
      value: loading ? "—" : String(stats?.total_companies ?? 0),
      change: "All time",
      icon: Building2,
      color: "text-brand-green",
      bgColor: "bg-brand-green/10",
    },
    {
      label: "Documents Uploaded",
      value: loading ? "—" : String(stats?.total_documents ?? 0),
      change: "All time",
      icon: FileText,
      color: "text-brand-gold",
      bgColor: "bg-brand-gold/10",
    },
    {
      label: "Active Frameworks",
      value: loading ? "—" : String(stats?.total_frameworks ?? 0),
      change: "All operational",
      icon: Layers,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand-green" />
            {t("admin.nav.overview")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System overview and quick actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Badge variant="outline" className="w-fit text-xs">
            <Activity className="mr-1.5 h-3 w-3 text-brand-green" />
            All systems operational
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <TrendingUp className="h-4 w-4 text-brand-green" />}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
              <p className="text-xs text-brand-green mt-2 font-medium">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-green" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            {systemHealth.map((service) => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <service.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-brand-green ring-2 ring-background" />
                  </div>
                  <span className="text-sm font-medium">{service.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{service.latency}</span>
                  <Badge variant="secondary" className="text-[10px] text-brand-green bg-brand-green/10">
                    <CheckCircle className="mr-1 h-2.5 w-2.5" />
                    OK
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Platform Summary */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brand-blue" />
              Platform Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "ESG Reports", value: stats?.total_reports ?? 0, icon: BarChart3, color: "text-brand-blue" },
                { label: "Active Users (30d)", value: stats?.active_users_30d ?? 0, icon: Users, color: "text-brand-green" },
                { label: "Documents Processed", value: stats?.total_documents ?? 0, icon: FileText, color: "text-brand-gold" },
                { label: "Frameworks", value: stats?.total_frameworks ?? 0, icon: Layers, color: "text-primary" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <div>
                    <p className="text-lg font-bold">{loading ? "—" : item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="border-border/50 hover:shadow-md hover:border-brand-green/30 transition-all cursor-pointer group h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-brand-green/10">
                      <action.icon className="h-5 w-5 text-brand-green" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-brand-green group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-sm font-semibold mt-4">{action.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
