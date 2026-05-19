"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { CheckSquare, Plus, Pencil, Trash2, Loader2, Calendar } from "lucide-react";
import { usePartnerAuth } from "../layout";
import { partnerApi } from "@/services/api";

interface Task {
  id: string;
  client_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const MOCK_TASKS: Task[] = [
  { id: "1", title: "Enviar proposta para Acme Corp", status: "pending", due_date: new Date(Date.now() + 86400000).toISOString(), created_at: new Date().toISOString() },
  { id: "2", title: "Reunião de apresentação com BRF", status: "pending", due_date: new Date(Date.now() + 3 * 86400000).toISOString(), created_at: new Date().toISOString() },
  { id: "3", title: "Follow-up pós-relatório Natura", status: "done", created_at: new Date().toISOString() },
];

const emptyForm = { title: "", description: "", due_date: "", status: "pending", client_id: "" };

export default function PartnerTasksPage() {
  const t = useTranslations("partner");
  const { token } = usePartnerAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const loadTasks = () => {
    if (!token) return;
    partnerApi.getTasks(token)
      .then((res) => { const r = res as { items?: Task[] }; setTasks(Array.isArray(res) ? (res as unknown as Task[]) : r.items ?? []); })
      .catch(() => setTasks(MOCK_TASKS))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTasks(); }, [token]); // eslint-disable-line

  const openAdd = () => { setForm(emptyForm); setDialog("add"); };
  const openEdit = (t: Task) => {
    setSelected(t);
    setForm({ title: t.title, description: t.description || "", due_date: t.due_date ? t.due_date.slice(0, 10) : "", status: t.status, client_id: t.client_id || "" });
    setDialog("edit");
  };
  const closeDialog = () => { setDialog(null); setSelected(null); setForm(emptyForm); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined };
      if (dialog === "add") {
        await partnerApi.createTask(token!, payload);
      } else if (dialog === "edit" && selected) {
        await partnerApi.updateTask(token!, selected.id, payload);
      }
      closeDialog();
      loadTasks();
    } catch {
      closeDialog();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("tasks.confirmDelete"))) return;
    try {
      await partnerApi.deleteTask(token!, id);
      loadTasks();
    } catch {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const filtered = tasks.filter((t) => !statusFilter || t.status === statusFilter);
  const overdue = filtered.filter((t) => t.status === "pending" && t.due_date && new Date(t.due_date) < new Date());
  const upcoming = filtered.filter((t) => t.status === "pending" && (!t.due_date || new Date(t.due_date) >= new Date()));
  const done = filtered.filter((t) => t.status === "done" || t.status === "cancelled");

  const renderTasks = (taskList: Task[]) =>
    taskList.map((task) => (
      <Card key={task.id} className={task.status === "cancelled" ? "opacity-50" : ""}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                <Badge className={`text-xs ${STATUS_COLORS[task.status] || ""}`}>{t(`tasks.status.${task.status}`)}</Badge>
              </div>
              {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
              {task.due_date && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status === "pending" ? "text-red-500" : "text-muted-foreground"}`}>
                  <Calendar className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => openEdit(task)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ));

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("tasks.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("tasks.subtitle")}</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t("tasks.addTask")}
        </Button>
      </div>

      {/* Filter */}
      <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t("tasks.allStatuses")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("tasks.allStatuses")}</SelectItem>
          {["pending", "done", "cancelled"].map((s) => <SelectItem key={s} value={s}>{t(`tasks.status.${s}`)}</SelectItem>)}
        </SelectContent>
      </Select>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {overdue.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-500">{t("tasks.overdue")}</p>
              {renderTasks(overdue)}
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("tasks.upcoming")}</p>
              {renderTasks(upcoming)}
            </div>
          )}
          {done.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("tasks.completed")}</p>
              {renderTasks(done)}
            </div>
          )}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t("tasks.noTasks")}</p>
            </div>
          )}
        </>
      )}

      {/* Dialog */}
      <Dialog open={!!dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog === "add" ? t("tasks.addTask") : t("tasks.editTask")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">{t("tasks.form.title")}</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">{t("tasks.form.description")}</Label>
              <Textarea id="desc" rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due">{t("tasks.form.dueDate")}</Label>
              <Input id="due" type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} />
            </div>
            {dialog === "edit" && (
              <div className="space-y-1.5">
                <Label>{t("tasks.form.status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending", "done", "cancelled"].map((s) => <SelectItem key={s} value={s}>{t(`tasks.status.${s}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
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
