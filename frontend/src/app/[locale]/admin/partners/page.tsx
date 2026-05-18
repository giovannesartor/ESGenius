"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, CheckCircle, XCircle, Loader2, Handshake, Users, DollarSign, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { partnerAdminApi } from "@/services/api";

interface Partner {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  ref_code: string;
  commission_rate: number;
  status: string;
  is_active: boolean;
  created_at: string;
}

const MOCK_PARTNERS: Partner[] = [
  { id: "1", email: "consultora@esgbrasil.com", full_name: "Ana Silva", company_name: "ESG Brasil Consultoria", ref_code: "ESG-ANA1", commission_rate: 0.20, status: "active", is_active: true, created_at: new Date().toISOString() },
  { id: "2", email: "joao@green.io", full_name: "João Sustentável", company_name: "Green.io", ref_code: "ESG-JOAO", commission_rate: 0.20, status: "pending", is_active: false, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "3", email: "maria@auditoriaesg.com", full_name: "Maria Auditora", company_name: "Auditoria ESG Ltda", ref_code: "ESG-MARI", commission_rate: 0.25, status: "active", is_active: true, created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "4", email: "pedro@consultant.io", full_name: "Pedro ESG", company_name: "Consultant.io", ref_code: "ESG-PEDR", commission_rate: 0.20, status: "suspended", is_active: false, created_at: new Date(Date.now() - 14 * 86400000).toISOString() },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  suspended: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export default function AdminPartnersPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadPartners = () => {
    if (!token) return;
    partnerAdminApi.listPartners(token, statusFilter || undefined)
      .then((res) => { const r = res as { items?: Partner[] }; setPartners(r.items ?? (res as unknown as Partner[])); })
      .catch(() => setPartners(MOCK_PARTNERS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPartners(); }, [token, statusFilter]); // eslint-disable-line

  const handleApprove = async (id: string) => {
    try {
      await partnerAdminApi.approvePartner(token!, id);
    } catch { /* ignore */ }
    setPartners((prev) => prev.map((p) => p.id === id ? { ...p, status: "active", is_active: true } : p));
  };

  const handleSuspend = async (id: string) => {
    if (!confirm(t("partners.confirmSuspend"))) return;
    try {
      await partnerAdminApi.suspendPartner(token!, id);
    } catch { /* ignore */ }
    setPartners((prev) => prev.map((p) => p.id === id ? { ...p, status: "suspended", is_active: false } : p));
  };

  const filtered = partners.filter(
    (p) =>
      (!search ||
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        (p.company_name || "").toLowerCase().includes(search.toLowerCase())) &&
      (!statusFilter || p.status === statusFilter)
  );

  const pendingCount = partners.filter((p) => p.status === "pending").length;
  const activeCount = partners.filter((p) => p.status === "active").length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("partners.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("partners.subtitle")}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t("partners.kpi.total"), value: partners.length, icon: Handshake, color: "text-primary" },
          { label: t("partners.kpi.active"), value: activeCount, icon: Users, color: "text-green-500" },
          { label: t("partners.kpi.pending"), value: pendingCount, icon: Clock, color: "text-yellow-500" },
          { label: t("partners.kpi.avgCommission"), value: "20%", icon: DollarSign, color: "text-blue-500" },
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

      {/* Pending approvals banner */}
      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800">
          <CardContent className="py-3 flex items-center gap-3">
            <Clock className="h-4 w-4 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {pendingCount} {t("partners.pendingApproval")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("partners.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("partners.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("partners.allStatuses")}</SelectItem>
            {["active", "pending", "suspended"].map((s) => <SelectItem key={s} value={s}>{t(`partners.status.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("partners.col.name")}</TableHead>
                  <TableHead>{t("partners.col.company")}</TableHead>
                  <TableHead>{t("partners.col.refCode")}</TableHead>
                  <TableHead>{t("partners.col.commission")}</TableHead>
                  <TableHead>{t("partners.col.status")}</TableHead>
                  <TableHead>{t("partners.col.joined")}</TableHead>
                  <TableHead className="w-28">{t("partners.col.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      <Handshake className="h-6 w-6 mx-auto mb-2 opacity-40" />
                      {t("partners.noPartners")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{p.full_name}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.company_name || "—"}</TableCell>
                      <TableCell><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{p.ref_code}</code></TableCell>
                      <TableCell>{(p.commission_rate * 100).toFixed(0)}%</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[p.status] || ""}`}>
                          {t(`partners.status.${p.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {p.status === "pending" && (
                            <Button size="sm" variant="ghost" onClick={() => handleApprove(p.id)} title={t("partners.approve")}>
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            </Button>
                          )}
                          {p.status === "active" && (
                            <Button size="sm" variant="ghost" onClick={() => handleSuspend(p.id)} title={t("partners.suspend")}>
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          )}
                          {p.status === "suspended" && (
                            <Button size="sm" variant="ghost" onClick={() => handleApprove(p.id)} title={t("partners.reactivate")}>
                              <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
