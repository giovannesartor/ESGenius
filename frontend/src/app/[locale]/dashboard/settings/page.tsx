"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Bell, Shield, Loader2, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations();
  const { user, token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await authApi.updateMe(token, { full_name: fullName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Handle error silently for now
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.nav.settings")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dashboard.settingsSubtitle")}
        </p>
      </div>

      {/* Profile */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            {t("dashboard.profile")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("dashboard.fullName")}</Label>
              <Input
                className="h-10"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.emailLabel")}</Label>
              <Input className="h-10" value={user?.email || ""} disabled />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} className="font-semibold">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : (
                <Settings className="mr-2 h-4 w-4" />
              )}
              {saved ? t("dashboard.savedLabel") : t("dashboard.saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            {t("dashboard.notifications")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: t("dashboard.notifReportComplete"), desc: t("dashboard.notifReportCompleteDesc") },
            { label: t("dashboard.notifScoreUpdates"), desc: t("dashboard.notifScoreUpdatesDesc") },
            { label: t("dashboard.notifDocProcessing"), desc: t("dashboard.notifDocProcessingDesc") },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform" />
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            {t("dashboard.security")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t("dashboard.passwordLabel")}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.passwordLastChanged")}</p>
            </div>
            <Button variant="outline" size="sm">{t("dashboard.changePassword")}</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{t("dashboard.twoFactor")}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.twoFactorDesc")}</p>
            </div>
            <Badge variant="outline" className="text-xs">{t("dashboard.comingSoon")}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
