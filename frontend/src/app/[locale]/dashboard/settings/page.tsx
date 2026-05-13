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
import { Settings, User, Bell, Shield, Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations();
  const { user, token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

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

  const handleChangePassword = async () => {
    if (!token) return;
    setPwError("");
    if (newPassword.length < 8) {
      setPwError(t("auth.passwordTooShort") || "Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(t("auth.passwordMismatch") || "Passwords do not match.");
      return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword(token, currentPassword, newPassword);
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 4000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPwSaving(false);
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
        <CardContent className="space-y-6">
          {/* Change Password */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{t("dashboard.changePassword")}</p>
            </div>

            {pwSuccess && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-brand-green/10 border border-brand-green/20 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                <p className="text-xs">{t("dashboard.passwordChanged")}</p>
              </div>
            )}
            {pwError && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{pwError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("dashboard.currentPasswordLabel")}</Label>
                <Input
                  type="password"
                  className="h-10"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("dashboard.newPasswordLabel")}</Label>
                  <Input
                    type="password"
                    className="h-10"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("dashboard.confirmNewPasswordLabel")}</Label>
                  <Input
                    type="password"
                    className="h-10"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <Button
              size="sm"
              className="mt-3"
              onClick={handleChangePassword}
              disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
            >
              {pwSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("dashboard.updatePassword")}
            </Button>
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

