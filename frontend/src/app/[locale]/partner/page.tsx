"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  DollarSign,
  TrendingUp,
  CheckSquare,
  Copy,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { usePartnerAuth } from "./layout";
import { partnerApi } from "@/services/api";

interface DashboardData {
  total_clients: number;
  total_deals: number;
  total_commissions: number;
  pending_commissions: number;
  tasks_pending: number;
  pipeline: Record<string, number>;
  ref_code: string;
}

const PIPELINE_STAGES = [
  { key: "lead", color: "bg-slate-400" },
  { key: "proposta", color: "bg-blue-400" },
  { key: "negociacao", color: "bg-yellow-400" },
  { key: "fechado", color: "bg-green-400" },
  { key: "analise_feita", color: "bg-purple-400" },
  { key: "entregue", color: "bg-emerald-500" },
];

const MOCK_DATA: DashboardData = {
  total_clients: 12,
  total_deals: 5,
  total_commissions: 4350,
  pending_commissions: 1200,
  tasks_pending: 3,
  pipeline: { lead: 4, proposta: 3, negociacao: 2, fechado: 1, analise_feita: 1, entregue: 1 },
  ref_code: "ESGP-XXXX",
};

export default function PartnerDashboardPage() {
  const t = useTranslations("partner");
  const { token, partner } = usePartnerAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    partnerApi.getDashboard(token)
      .then((res) => setData(res as DashboardData))
      .catch(() => setData({ ...MOCK_DATA, ref_code: partner?.ref_code || MOCK_DATA.ref_code }))
      .finally(() => setLoading(false));
  }, [token, partner]);

  const refLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://esg360.digital"}/ref/${data?.ref_code || ""}`;

  const copyRefLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const d = data || MOCK_DATA;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dashboard.welcome", { name: partner?.full_name || "" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: t("dashboard.kpi.clients"),
            value: d.total_clients,
            color: "text-blue-500",
          },
          {
            icon: TrendingUp,
            label: t("dashboard.kpi.deals"),
            value: d.total_deals,
            color: "text-green-500",
          },
          {
            icon: DollarSign,
            label: t("dashboard.kpi.totalCommissions"),
            value: `R$ ${d.total_commissions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            color: "text-primary",
          },
          {
            icon: CheckSquare,
            label: t("dashboard.kpi.tasksPending"),
            value: d.tasks_pending,
            color: "text-orange-500",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <Icon className={`h-5 w-5 mt-1 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pipeline Kanban Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("dashboard.pipeline.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {PIPELINE_STAGES.map(({ key, color }) => {
                const count = d.pipeline[key] || 0;
                const maxCount = Math.max(...Object.values(d.pipeline), 1);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-muted-foreground shrink-0 capitalize">
                      {t(`dashboard.pipeline.${key}`)}
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all`}
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                    <Badge variant="secondary" className="text-xs w-6 text-center justify-center">
                      {count}
                    </Badge>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild className="w-full">
                <a href="/partner/clients">
                  {t("dashboard.pipeline.viewAll")} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral + Commissions */}
        <div className="space-y-4">
          {/* Pending commissions */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground">{t("dashboard.kpi.pendingCommissions")}</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                R$ {d.pending_commissions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("dashboard.kpi.pendingNote")}</p>
            </CardContent>
          </Card>

          {/* Referral link */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("dashboard.referral.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">{t("dashboard.referral.description")}</p>
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-muted rounded px-3 py-2 truncate font-mono">
                  {refLink}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyRefLink}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
