"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminExtApi } from "@/services/api";

interface Coupon {
  id: string;
  code: string;
  coupon_type: string;
  value: number;
  max_uses?: number;
  current_uses: number;
  description?: string;
  is_active: boolean;
  expires_at?: string;
  partner_id?: string;
  created_at: string;
}

const MOCK_COUPONS: Coupon[] = [
  { id: "1", code: "LAUNCH50", coupon_type: "percent", value: 50, max_uses: 100, current_uses: 23, description: "Promoção de lançamento", is_active: true, created_at: new Date().toISOString() },
  { id: "2", code: "PARTNER100", coupon_type: "fixed", value: 100, max_uses: 50, current_uses: 12, description: "Cupom de parceiro", is_active: true, created_at: new Date().toISOString() },
  { id: "3", code: "EXPIRED20", coupon_type: "percent", value: 20, max_uses: 200, current_uses: 200, description: "Campanha expirada", is_active: false, created_at: new Date().toISOString() },
];

const emptyForm = { code: "", coupon_type: "percent", value: "", max_uses: "", description: "", expires_at: "" };

export default function AdminCouponsPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadCoupons = () => {
    if (!token) return;
    adminExtApi.getCoupons(token)
      .then((res) => { const r = res as { items?: Coupon[] }; setCoupons(r.items ?? (res as unknown as Coupon[])); })
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCoupons(); }, [token]); // eslint-disable-line

  const openAdd = () => { setEditCoupon(null); setForm(emptyForm); setDialog(true); };
  const openEdit = (c: Coupon) => { setEditCoupon(c); setForm({ code: c.code, coupon_type: c.coupon_type, value: c.value.toString(), max_uses: c.max_uses?.toString() || "", description: c.description || "", expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "" }); setDialog(true); };
  const closeDialog = () => { setDialog(false); setEditCoupon(null); setForm(emptyForm); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        coupon_type: form.coupon_type,
        value: parseFloat(form.value),
        max_uses: form.max_uses ? parseInt(form.max_uses) : undefined,
        description: form.description || undefined,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
      };
      if (editCoupon) {
        await adminExtApi.updateCoupon(token!, editCoupon.id, payload);
      } else {
        await adminExtApi.createCoupon(token!, payload);
      }
      closeDialog();
      loadCoupons();
    } catch {
      closeDialog();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (c: Coupon) => {
    try {
      await adminExtApi.updateCoupon(token!, c.id, { is_active: !c.is_active });
      setCoupons((prev) => prev.map((x) => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
    } catch {
      setCoupons((prev) => prev.map((x) => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("coupons.confirmDelete"))) return;
    try {
      await adminExtApi.deleteCoupon(token!, id);
    } catch { /* ignore */ }
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("coupons.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("coupons.subtitle")}</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t("coupons.addCoupon")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("coupons.col.code")}</TableHead>
                  <TableHead>{t("coupons.col.type")}</TableHead>
                  <TableHead>{t("coupons.col.value")}</TableHead>
                  <TableHead>{t("coupons.col.usage")}</TableHead>
                  <TableHead>{t("coupons.col.status")}</TableHead>
                  <TableHead>{t("coupons.col.expires")}</TableHead>
                  <TableHead className="w-20">{t("coupons.col.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      <Tag className="h-6 w-6 mx-auto mb-2 opacity-40" />
                      {t("coupons.noCoupons")}
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell><code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{c.code}</code></TableCell>
                      <TableCell className="capitalize">{c.coupon_type}</TableCell>
                      <TableCell>{c.coupon_type === "percent" ? `${c.value}%` : `$${c.value}`}</TableCell>
                      <TableCell>
                        <span className="text-sm">{c.current_uses}</span>
                        {c.max_uses && <span className="text-muted-foreground text-xs"> / {c.max_uses}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${c.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-slate-100 text-slate-500"}`}>
                          {c.is_active ? t("coupons.active") : t("coupons.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label="Edit coupon">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggle(c)} aria-label={c.is_active ? "Deactivate" : "Activate"}>
                            <span className="text-xs">{c.is_active ? "✗" : "✓"}</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} aria-label="Delete coupon">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
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

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editCoupon ? t("coupons.editCoupon") : t("coupons.addCoupon")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="code">{t("coupons.form.code")}</Label>
              <Input id="code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="LAUNCH50" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("coupons.form.type")}</Label>
                <Select value={form.coupon_type} onValueChange={(v) => setForm((p) => ({ ...p, coupon_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">% Desconto</SelectItem>
                    <SelectItem value="fixed">$ Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="value">{t("coupons.form.value")}</Label>
                <Input id="value" type="number" min={0} value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} placeholder={form.coupon_type === "percent" ? "20" : "100"} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="max_uses">{t("coupons.form.maxUses")}</Label>
                <Input id="max_uses" type="number" min={1} value={form.max_uses} onChange={(e) => setForm((p) => ({ ...p, max_uses: e.target.value }))} placeholder="100" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expires_at">{t("coupons.form.expiresAt")}</Label>
                <Input id="expires_at" type="date" value={form.expires_at} onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">{t("coupons.form.description")}</Label>
              <Input id="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder={t("coupons.form.descriptionPlaceholder")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
