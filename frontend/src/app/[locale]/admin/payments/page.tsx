"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminExtApi } from "@/services/api";

interface PaymentsOverview {
  total_subscriptions: number;
  active_subscriptions: number;
  note: string;
}

export default function AdminPaymentsPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [overview, setOverview] = useState<PaymentsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    adminExtApi.getPaymentsOverview(token)
      .then((res) => setOverview(res as PaymentsOverview))
      .catch(() => setOverview(null))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("payments.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("payments.subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: t("payments.kpi.totalSubscriptions"), value: overview?.total_subscriptions?.toString() ?? "0", icon: CreditCard, color: "text-primary" },
              { label: t("payments.kpi.activeSubscriptions"), value: overview?.active_subscriptions?.toString() ?? "0", icon: Users, color: "text-green-500" },
              { label: t("payments.kpi.churnedSubscriptions"), value: ((overview?.total_subscriptions ?? 0) - (overview?.active_subscriptions ?? 0)).toString(), icon: TrendingUp, color: "text-red-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-xl font-bold mt-1">{value}</p>
                    </div>
                    <Icon className={`h-5 w-5 mt-1 ${color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stripe note */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t("payments.stripeNote.title")}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{overview?.note ?? t("payments.stripeNote.body")}</p>
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t("payments.stripeNote.openDashboard")} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
