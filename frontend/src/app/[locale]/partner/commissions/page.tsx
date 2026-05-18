"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { DollarSign, Wallet, Loader2, Download } from "lucide-react";
import { usePartnerAuth } from "../layout";
import { partnerApi } from "@/services/api";

interface Commission {
  id: string;
  client_id?: string;
  product_type: string;
  gross_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  notes?: string;
  paid_at?: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const MOCK_COMMISSIONS: Commission[] = [
  { id: "1", product_type: "esg_report", gross_amount: 5000, commission_rate: 0.20, commission_amount: 1000, status: "paid", paid_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "2", product_type: "esg_report", gross_amount: 5000, commission_rate: 0.20, commission_amount: 1000, status: "approved", created_at: new Date().toISOString() },
  { id: "3", product_type: "esg_analysis", gross_amount: 3000, commission_rate: 0.20, commission_amount: 600, status: "pending", created_at: new Date().toISOString() },
];

const PIX_KEY_TYPES = ["cpf", "cnpj", "email", "phone", "random"];

export default function PartnerCommissionsPage() {
  const t = useTranslations("partner");
  const { token, partner } = usePartnerAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [pixDialog, setPixDialog] = useState(false);
  const [pixForm, setPixForm] = useState({ pix_key_type: partner?.pix_key_type || "email", pix_key: partner?.pix_key || "" });

  useEffect(() => {
    setPixForm({ pix_key_type: partner?.pix_key_type || "email", pix_key: partner?.pix_key || "" });
  }, [partner?.pix_key_type, partner?.pix_key]);
  const [savingPix, setSavingPix] = useState(false);

  useEffect(() => {
    if (!token) return;
    partnerApi.getCommissions(token, statusFilter || undefined)
      .then((res) => { const r = res as { items?: Commission[] }; setCommissions(r.items ?? (res as unknown as Commission[])); })
      .catch(() => setCommissions(MOCK_COMMISSIONS))
      .finally(() => setLoading(false));
  }, [token, statusFilter]);

  const totalPaid = commissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + c.commission_amount, 0);
  const totalPending = commissions.filter((c) => c.status !== "paid").reduce((sum, c) => sum + c.commission_amount, 0);

  const handleSavePix = async () => {
    setSavingPix(true);
    try {
      await partnerApi.updatePix(token!, pixForm);
      setPixDialog(false);
    } catch {
      // show error
    } finally {
      setSavingPix(false);
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Produto", "Valor Bruto", "Taxa", "Comissão", "Status", "Data"];
    const rows = commissions.map((c) => [
      c.id,
      c.product_type,
      c.gross_amount.toFixed(2),
      `${(c.commission_rate * 100).toFixed(0)}%`,
      c.commission_amount.toFixed(2),
      c.status,
      new Date(c.created_at).toLocaleDateString("pt-BR"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "comissoes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("commissions.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("commissions.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPixDialog(true)}>
          <Wallet className="h-4 w-4 mr-2" />
          {t("commissions.managePix")}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("commissions.kpi.totalPaid"), value: totalPaid, icon: DollarSign, color: "text-green-500" },
          { label: t("commissions.kpi.totalPending"), value: totalPending, icon: DollarSign, color: "text-yellow-500" },
          { label: t("commissions.kpi.totalCommissions"), value: commissions.length, icon: DollarSign, color: "text-primary", isCount: true },
        ].map(({ label, value, icon: Icon, color, isCount }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold mt-1">
                    {isCount ? value : `R$ ${(value as number).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                  </p>
                </div>
                <Icon className={`h-5 w-5 mt-1 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Export */}
      <div className="flex gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("commissions.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("commissions.allStatuses")}</SelectItem>
            {["pending", "approved", "paid"].map((s) => (
              <SelectItem key={s} value={s}>{t(`commissions.status.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCSV} className="ml-auto">
          <Download className="h-4 w-4 mr-2" />
          {t("commissions.export")}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("commissions.col.product")}</TableHead>
                  <TableHead>{t("commissions.col.gross")}</TableHead>
                  <TableHead>{t("commissions.col.rate")}</TableHead>
                  <TableHead>{t("commissions.col.commission")}</TableHead>
                  <TableHead>{t("commissions.col.status")}</TableHead>
                  <TableHead>{t("commissions.col.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t("commissions.noData")}</TableCell></TableRow>
                ) : (
                  commissions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium capitalize">{c.product_type.replace("_", " ")}</TableCell>
                      <TableCell>R$ {c.gross_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{(c.commission_rate * 100).toFixed(0)}%</TableCell>
                      <TableCell className="font-semibold text-green-600 dark:text-green-400">
                        R$ {c.commission_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${STATUS_COLORS[c.status] || ""}`}>
                          {t(`commissions.status.${c.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* PIX Dialog */}
      <Dialog open={pixDialog} onOpenChange={setPixDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("commissions.pixDialog.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("commissions.pixDialog.keyType")}</Label>
              <Select value={pixForm.pix_key_type} onValueChange={(v) => setPixForm((p) => ({ ...p, pix_key_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIX_KEY_TYPES.map((t) => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pix_key">{t("commissions.pixDialog.key")}</Label>
              <Input id="pix_key" value={pixForm.pix_key} onChange={(e) => setPixForm((p) => ({ ...p, pix_key: e.target.value }))} placeholder="sua@chave.pix" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPixDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSavePix} disabled={savingPix}>
              {savingPix ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
