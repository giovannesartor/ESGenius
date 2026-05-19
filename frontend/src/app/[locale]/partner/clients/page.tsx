"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, Pencil, Trash2, Loader2, LayoutGrid, List } from "lucide-react";
import { usePartnerAuth } from "../layout";
import { partnerApi } from "@/services/api";

interface Client {
  id: string;
  client_name: string;
  client_email?: string;
  client_company?: string;
  client_phone?: string;
  pipeline_stage: string;
  notes?: string;
  created_at: string;
}

const STAGES = ["lead", "proposta", "negociacao", "fechado", "analise_feita", "entregue"];

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  proposta: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  negociacao: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  fechado: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  analise_feita: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  entregue: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const MOCK_CLIENTS: Client[] = [
  { id: "1", client_name: "Acme Corp", client_email: "esg@acme.com", client_company: "Acme Corp", pipeline_stage: "lead", created_at: new Date().toISOString() },
  { id: "2", client_name: "Natura ESG", client_email: "sustainability@natura.com", client_company: "Natura", pipeline_stage: "proposta", created_at: new Date().toISOString() },
  { id: "3", client_name: "BRF Alimentos", client_email: "esg@brf.com", client_company: "BRF", pipeline_stage: "negociacao", created_at: new Date().toISOString() },
  { id: "4", client_name: "Itaú BBA", client_email: "esg@itau.com", client_company: "Itaú", pipeline_stage: "fechado", created_at: new Date().toISOString() },
];

const emptyForm = { client_name: "", client_email: "", client_company: "", client_phone: "", notes: "", pipeline_stage: "lead" };

export default function PartnerClientsPage() {
  const t = useTranslations("partner");
  const { token } = usePartnerAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadClients = () => {
    if (!token) return;
    partnerApi.getClients(token, stageFilter || undefined, search || undefined)
      .then((res) => { const r = res as { items?: Client[] }; setClients(r.items ?? (res as unknown as Client[])); })
      .catch(() => setClients(MOCK_CLIENTS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClients(); }, [token, stageFilter]); // eslint-disable-line

  const openAdd = () => { setForm(emptyForm); setDialog("add"); };
  const openEdit = (c: Client) => { setSelected(c); setForm({ client_name: c.client_name, client_email: c.client_email || "", client_company: c.client_company || "", client_phone: c.client_phone || "", notes: c.notes || "", pipeline_stage: c.pipeline_stage }); setDialog("edit"); };
  const closeDialog = () => { setDialog(null); setSelected(null); setForm(emptyForm); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dialog === "add") {
        await partnerApi.createClient(token!, form);
      } else if (dialog === "edit" && selected) {
        await partnerApi.updateClient(token!, selected.id, form);
      }
      closeDialog();
      loadClients();
    } catch {
      // stay open, show error later
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("clients.confirmDelete"))) return;
    try {
      await partnerApi.deleteClient(token!, id);
      loadClients();
    } catch {
      setClients((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const filtered = clients.filter(
    (c) =>
      (!search || c.client_name.toLowerCase().includes(search.toLowerCase()) || (c.client_email || "").toLowerCase().includes(search.toLowerCase())) &&
      (!stageFilter || c.pipeline_stage === stageFilter)
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("clients.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("clients.subtitle")}</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t("clients.addClient")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("clients.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={stageFilter || "all"} onValueChange={(v) => setStageFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("clients.allStages")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("clients.allStages")}</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>{t(`dashboard.pipeline.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 ml-auto">
          <Button variant={view === "table" ? "default" : "ghost"} size="icon" onClick={() => setView("table")}><List className="h-4 w-4" /></Button>
          <Button variant={view === "kanban" ? "default" : "ghost"} size="icon" onClick={() => setView("kanban")}><LayoutGrid className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Table view */}
      {view === "table" && (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("clients.col.name")}</TableHead>
                    <TableHead>{t("clients.col.company")}</TableHead>
                    <TableHead>{t("clients.col.email")}</TableHead>
                    <TableHead>{t("clients.col.stage")}</TableHead>
                    <TableHead className="w-20">{t("clients.col.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("clients.noClients")}</TableCell></TableRow>
                  ) : (
                    filtered.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.client_name}</TableCell>
                        <TableCell className="text-muted-foreground">{c.client_company || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{c.client_email || "—"}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${STAGE_COLORS[c.pipeline_stage] || ""}`}>
                            {t(`dashboard.pipeline.${c.pipeline_stage}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
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
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageClients = filtered.filter((c) => c.pipeline_stage === stage);
            return (
              <div key={stage} className="flex-none w-64">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{t(`dashboard.pipeline.${stage}`)}</span>
                  <Badge variant="secondary" className="text-xs">{stageClients.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {stageClients.map((c) => (
                    <Card key={c.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => openEdit(c)}>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">{c.client_name}</p>
                        {c.client_company && <p className="text-xs text-muted-foreground">{c.client_company}</p>}
                        {c.client_email && <p className="text-xs text-muted-foreground mt-1 truncate">{c.client_email}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === "add" ? t("clients.addClient") : t("clients.editClient")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { field: "client_name", label: t("clients.form.name"), type: "text", required: true },
              { field: "client_email", label: t("clients.form.email"), type: "email", required: false },
              { field: "client_company", label: t("clients.form.company"), type: "text", required: false },
              { field: "client_phone", label: t("clients.form.phone"), type: "tel", required: false },
            ].map(({ field, label, type, required }) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field}>{label}</Label>
                <Input id={field} type={type} required={required} value={form[field as keyof typeof form]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>{t("clients.form.stage")}</Label>
              <Select value={form.pipeline_stage} onValueChange={(v) => setForm((p) => ({ ...p, pipeline_stage: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => <SelectItem key={s} value={s}>{t(`dashboard.pipeline.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">{t("clients.form.notes")}</Label>
              <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
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
