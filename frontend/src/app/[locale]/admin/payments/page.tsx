"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, Users, CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const MOCK_REVENUE = [
  { month: "Jan", mrr: 4200, new_subs: 8 },
  { month: "Fev", mrr: 5100, new_subs: 12 },
  { month: "Mar", mrr: 6300, new_subs: 15 },
  { month: "Abr", mrr: 7800, new_subs: 18 },
  { month: "Mai", mrr: 9200, new_subs: 22 },
  { month: "Jun", mrr: 11400, new_subs: 27 },
];

const MOCK_PAYMENTS = [
  { id: "1", user: "Natura ESG", plan: "Professional", amount: 499, status: "paid", date: "2026-06-01" },
  { id: "2", user: "BRF Alimentos", plan: "Enterprise", amount: 1499, status: "paid", date: "2026-06-01" },
  { id: "3", user: "Acme Corp", plan: "Professional", amount: 499, status: "paid", date: "2026-05-30" },
  { id: "4", user: "StartupXYZ", plan: "Professional", amount: 499, status: "failed", date: "2026-05-28" },
  { id: "5", user: "Itaú BBA", plan: "Enterprise", amount: 1499, status: "paid", date: "2026-05-28" },
];

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  refunded: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
};

export default function AdminPaymentsPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [planFilter, setPlanFilter] = useState("");

  const mrr = MOCK_REVENUE[MOCK_REVENUE.length - 1].mrr;
  const arr = mrr * 12;
  const totalRevenue = MOCK_REVENUE.reduce((s, m) => s + m.mrr, 0);

  const filtered = MOCK_PAYMENTS.filter((p) => !planFilter || p.plan === planFilter);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("payments.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("payments.subtitle")}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "MRR", value: `$${mrr.toLocaleString()}`, icon: DollarSign, color: "text-green-500" },
          { label: "ARR", value: `$${arr.toLocaleString()}`, icon: TrendingUp, color: "text-blue-500" },
          { label: t("payments.kpi.totalRevenue"), value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
          { label: t("payments.kpi.activeSubscriptions"), value: MOCK_PAYMENTS.filter((p) => p.status === "paid").length.toString(), icon: Users, color: "text-purple-500" },
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

      {/* MRR Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("payments.chart.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MOCK_REVENUE}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(v) => [`$${(v as number).toLocaleString()}`, "MRR"]} />
              <Line type="monotone" dataKey="mrr" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("payments.history.title")}</h2>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("payments.history.allPlans")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("payments.history.allPlans")}</SelectItem>
              <SelectItem value="Professional">Professional</SelectItem>
              <SelectItem value="Enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("payments.col.user")}</TableHead>
                  <TableHead>{t("payments.col.plan")}</TableHead>
                  <TableHead>{t("payments.col.amount")}</TableHead>
                  <TableHead>{t("payments.col.status")}</TableHead>
                  <TableHead>{t("payments.col.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.user}</TableCell>
                    <TableCell>{p.plan}</TableCell>
                    <TableCell>${p.amount}/mo</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${STATUS_COLORS[p.status] || ""}`}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(p.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
