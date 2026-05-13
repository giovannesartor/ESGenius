"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Leaf,
  Users,
  Building2,
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { dataPointApi } from "@/services/api";

interface DataPoint {
  id: string;
  pillar: string;
  category: string;
  name?: string;
  value: string;
  numeric_value?: number;
  unit?: string;
  year: number;
  period?: string;
  status?: string;
  source?: string;
  notes?: string;
}

const PILLARS = ["E", "S", "G"];
const PILLAR_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  E: { label: "Environmental", icon: Leaf, color: "text-brand-green", bg: "bg-brand-green/10" },
  S: { label: "Social", icon: Users, color: "text-brand-blue", bg: "bg-brand-blue/10" },
  G: { label: "Governance", icon: Building2, color: "text-brand-gold", bg: "bg-brand-gold/10" },
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const emptyForm = {
  pillar: "E",
  category: "",
  name: "",
  value: "",
  numeric_value: "",
  unit: "",
  year: CURRENT_YEAR,
  period: "",
  notes: "",
};

export default function DataPointsPage() {
  const t = useTranslations();
  const { token } = useAuth();
  const { company } = useCompany();

  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pillarFilter, setPillarFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState(String(CURRENT_YEAR));
  const [exportLoading, setExportLoading] = useState(false);

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    if (!token || !company) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "500" };
      if (yearFilter) params.year = yearFilter;
      if (pillarFilter !== "all") params.pillar = pillarFilter;
      const res = await dataPointApi.list(token, company.id, params) as { items?: DataPoint[] } | DataPoint[];
      setDataPoints(Array.isArray(res) ? res : res.items ?? []);
    } catch {
      setDataPoints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token, company, yearFilter, pillarFilter]);

  const filtered = dataPoints.filter((dp) => {
    const q = search.toLowerCase();
    return (
      dp.category?.toLowerCase().includes(q) ||
      dp.name?.toLowerCase().includes(q) ||
      dp.value?.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (dp: DataPoint) => {
    setEditingId(dp.id);
    setForm({
      pillar: dp.pillar ?? "E",
      category: dp.category ?? "",
      name: dp.name ?? "",
      value: dp.value ?? "",
      numeric_value: dp.numeric_value != null ? String(dp.numeric_value) : "",
      unit: dp.unit ?? "",
      year: dp.year ?? CURRENT_YEAR,
      period: dp.period ?? "",
      notes: dp.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!token || !company) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        numeric_value: form.numeric_value !== "" ? parseFloat(form.numeric_value) : undefined,
      };
      if (editingId) {
        await dataPointApi.update(token, company.id, editingId, payload);
      } else {
        await dataPointApi.create(token, company.id, payload);
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !company || !deleteId) return;
    setDeleting(true);
    try {
      await dataPointApi.delete(token, company.id, deleteId);
      setDeleteId(null);
      fetchData();
    } catch {
      // error
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    if (!token || !company) return;
    setExportLoading(true);
    try {
      await dataPointApi.exportCsv(token, company.id, {
        year: yearFilter ? parseInt(yearFilter) : undefined,
        pillar: pillarFilter !== "all" ? pillarFilter : undefined,
      });
    } catch {
      // error
    } finally {
      setExportLoading(false);
    }
  };

  const grouped = PILLARS.reduce<Record<string, DataPoint[]>>((acc, p) => {
    acc[p] = filtered.filter((dp) => dp.pillar === p);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Leaf className="h-6 w-6 text-brand-green" />
            Data Points
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your ESG data entries for reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exportLoading}>
            {exportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export CSV
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Data Point
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("dashboard.searchDataPoints")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={pillarFilter} onValueChange={setPillarFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Pillar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.allPillars")}</SelectItem>
              {PILLARS.map((p) => (
                <SelectItem key={p} value={p}>{PILLAR_CONFIG[p].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Badge variant="secondary" className="text-xs">
          {t("dashboard.dataPointsCount", { count: filtered.length })}
        </Badge>
      </div>

      {/* Table by pillar */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {PILLARS.map((pillar) => {
            const items = grouped[pillar];
            if (pillarFilter !== "all" && pillarFilter !== pillar) return null;
            const cfg = PILLAR_CONFIG[pillar];
            return (
              <Card key={pillar} className="border-border/50">
                <CardHeader>
                  <CardTitle className={`text-base flex items-center gap-2 ${cfg.color}`}>
                    <cfg.icon className="h-4 w-4" />
                    {cfg.label}
                    <Badge variant="secondary" className={`ml-auto text-xs ${cfg.color} ${cfg.bg}`}>
                      {items.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {items.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      {t("dashboard.noDataPointsForPeriod", { pillar: cfg.label })}{" "}
                      <button className="underline text-primary" onClick={openCreate}>{t("dashboard.addOne")}</button>.
                    </div>
                  ) : (
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>{t("dashboard.tableCategory")}</TableHead>
                            <TableHead>{t("dashboard.tableValue")}</TableHead>
                            <TableHead>{t("dashboard.tableUnit")}</TableHead>
                            <TableHead>{t("dashboard.tableYear")}</TableHead>
                            <TableHead>{t("dashboard.tableStatus")}</TableHead>
                            <TableHead className="w-20" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((dp) => (
                            <TableRow key={dp.id} className="hover:bg-muted/30">
                              <TableCell>
                                <p className="font-medium text-sm">{dp.category}</p>
                                {dp.name && <p className="text-xs text-muted-foreground">{dp.name}</p>}
                              </TableCell>
                              <TableCell className="font-mono text-sm">{dp.value}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{dp.unit ?? "—"}</TableCell>
                              <TableCell className="text-sm">{dp.year}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={
                                    dp.status === "verified"
                                      ? "text-brand-green bg-brand-green/10"
                                      : dp.status === "pending"
                                      ? "text-brand-gold bg-brand-gold/10"
                                      : "text-muted-foreground bg-muted"
                                  }
                                >
                                  {dp.status ?? "draft"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(dp)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteId(dp.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? t("dashboard.editDataPoint") : t("dashboard.addDataPoint")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>{t("dashboard.pillarLabel")} *</Label>
              <Select value={form.pillar} onValueChange={(v) => setForm({ ...form, pillar: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PILLARS.map((p) => (
                    <SelectItem key={p} value={p}>{PILLAR_CONFIG[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.tableYear")} *</Label>
              <Select
                value={String(form.year)}
                onValueChange={(v) => setForm({ ...form, year: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>{t("dashboard.tableCategory")} *</Label>
              <Input
                placeholder="e.g. Energy Consumption"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>{t("dashboard.tableValue")} *</Label>
              <Input
                placeholder="e.g. 45,000 kWh"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.numericValue")}</Label>
              <Input
                type="number"
                placeholder="e.g. 45000"
                value={form.numeric_value}
                onChange={(e) => setForm({ ...form, numeric_value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.unitLabel")}</Label>
              <Input
                placeholder="e.g. kWh, tCO2e, %"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>{t("dashboard.notesLabel")}</Label>
              <Input
                placeholder="Optional notes or source"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={saving || !form.category || !form.value}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? t("common.save") : t("dashboard.addDataPoint")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.deleteDataPointConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.deleteDataPointDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
