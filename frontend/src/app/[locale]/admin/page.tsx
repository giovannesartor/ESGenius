"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Building2,
  Brain,
  Layers,
  Activity,
  CheckCircle,
  ArrowRight,
  Clock,
  FileText,
  BarChart3,
  Shield,
  TrendingUp,
  Database,
  Cpu,
  Server,
} from "lucide-react";

interface StatCard {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const statsCards: StatCard[] = [
  {
    label: "Total Users",
    value: "148",
    change: "+12 this week",
    icon: Users,
    color: "text-brand-blue",
    bgColor: "bg-brand-blue/10",
  },
  {
    label: "Total Companies",
    value: "37",
    change: "+3 this month",
    icon: Building2,
    color: "text-brand-green",
    bgColor: "bg-brand-green/10",
  },
  {
    label: "AI Requests (24h)",
    value: "1,284",
    change: "+18% vs yesterday",
    icon: Brain,
    color: "text-brand-gold",
    bgColor: "bg-brand-gold/10",
  },
  {
    label: "Active Frameworks",
    value: "5",
    change: "All operational",
    icon: Layers,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

interface SystemStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  icon: React.ElementType;
  latency: string;
}

const systemHealth: SystemStatus[] = [
  { name: "API Server", status: "operational", icon: Server, latency: "42ms" },
  { name: "Database", status: "operational", icon: Database, latency: "8ms" },
  { name: "Redis Cache", status: "operational", icon: Cpu, latency: "2ms" },
  { name: "AI Engine", status: "operational", icon: Brain, latency: "320ms" },
];

interface ActivityItem {
  action: string;
  user: string;
  time: string;
  icon: React.ElementType;
}

const recentActivity: ActivityItem[] = [
  { action: "New user registered", user: "maria.silva@empresa.com", time: "5 min ago", icon: Users },
  { action: "ESG Report generated", user: "Carlos Mendes", time: "18 min ago", icon: BarChart3 },
  { action: "Document processed by AI", user: "Ana Costa", time: "32 min ago", icon: FileText },
  { action: "Framework GRI updated", user: "System", time: "1h ago", icon: Layers },
  { action: "Company profile created", user: "Pedro Santos", time: "2h ago", icon: Building2 },
  { action: "AI model retrained", user: "System", time: "4h ago", icon: Brain },
];

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

const quickActions: QuickAction[] = [
  { label: "Manage Frameworks", href: "/admin/frameworks", icon: Layers, description: "Add, edit, or remove ESG frameworks" },
  { label: "View Users", href: "/admin/users", icon: Users, description: "Manage user accounts and permissions" },
  { label: "AI Logs", href: "/admin/ai-logs", icon: Brain, description: "Monitor AI processing and requests" },
];

export default function AdminOverviewPage() {
  const t = useTranslations();

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
        <Badge variant="outline" className="w-fit text-xs">
          <Activity className="mr-1.5 h-3 w-3 text-brand-green" />
          All systems operational
        </Badge>
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
                <TrendingUp className="h-4 w-4 text-brand-green" />
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

        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-blue" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-3">
              {recentActivity.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-md bg-muted mt-0.5">
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.user}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                  </div>
                  {idx < recentActivity.length - 1 && <Separator className="mt-3" />}
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
