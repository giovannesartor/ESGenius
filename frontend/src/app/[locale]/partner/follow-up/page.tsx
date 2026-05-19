"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Bell, Plus, Pencil, Loader2 } from "lucide-react";
import { usePartnerAuth } from "../layout";
import { partnerApi } from "@/services/api";

interface FollowUpRule {
  id: string;
  trigger_type: string;
  days_threshold: number;
  message_template?: string;
  is_active: boolean;
}

const TRIGGER_ICONS: Record<string, string> = {
  client_no_data: "📋",
  report_pending: "📄",
  proposal_no_response: "📩",
  post_report: "🎯",
  client_inactive: "😴",
};

const emptyForm = { trigger_type: "client_no_data", days_threshold: 7, message_template: "", is_active: true };

export default function PartnerFollowUpPage() {
  const t = useTranslations("partner");
  const { token } = usePartnerAuth();
  const [rules, setRules] = useState<FollowUpRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editRule, setEditRule] = useState<FollowUpRule | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    partnerApi.getFollowUpRules(token)
      .then((res) => setRules(res as FollowUpRule[]))
      .catch(() => setRules([]))
      .finally(() => setLoading(false));
  }, [token]);

  const openAdd = () => { setEditRule(null); setForm(emptyForm); setDialog(true); };
  const openEdit = (r: FollowUpRule) => { setEditRule(r); setForm({ trigger_type: r.trigger_type, days_threshold: r.days_threshold, message_template: r.message_template || "", is_active: r.is_active }); setDialog(true); };
  const closeDialog = () => { setDialog(false); setEditRule(null); setForm(emptyForm); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await partnerApi.createFollowUpRule(token!, form);
      closeDialog();
      // reload
      partnerApi.getFollowUpRules(token!).then((res) => setRules(res as FollowUpRule[])).catch(() => {});
    } catch {
      closeDialog();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("followUp.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("followUp.subtitle")}</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t("followUp.addRule")}
        </Button>
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl mt-0.5">{TRIGGER_ICONS[rule.trigger_type] || "🔔"}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{t(`followUp.trigger.${rule.trigger_type}`)}</p>
                        <Badge variant="secondary" className="text-xs">
                          {rule.days_threshold}d
                        </Badge>
                        <Badge className={`text-xs ${rule.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-slate-100 text-slate-500"}`}>
                          {rule.is_active ? t("followUp.active") : t("followUp.inactive")}
                        </Badge>
                      </div>
                      {rule.message_template && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rule.message_template}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {rules.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t("followUp.noRules")}</p>
            </div>
          )}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editRule ? t("followUp.editRule") : t("followUp.addRule")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>{t("followUp.form.trigger")}</Label>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={form.trigger_type}
                onChange={(e) => setForm((p) => ({ ...p, trigger_type: e.target.value }))}
              >
                {Object.keys(TRIGGER_ICONS).map((k) => (
                  <option key={k} value={k}>{TRIGGER_ICONS[k]} {t(`followUp.trigger.${k}`)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="days">{t("followUp.form.days")}</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={90}
                value={form.days_threshold}
                onChange={(e) => setForm((p) => ({ ...p, days_threshold: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template">{t("followUp.form.template")}</Label>
              <Textarea
                id="template"
                rows={3}
                value={form.message_template}
                onChange={(e) => setForm((p) => ({ ...p, message_template: e.target.value }))}
                placeholder={t("followUp.form.templatePlaceholder")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">{t("followUp.form.active")}</Label>
              <Switch
                id="active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
              />
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
