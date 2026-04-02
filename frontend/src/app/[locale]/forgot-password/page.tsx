"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { authApi } from "@/services/api";

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email);
      setSent(true);
    } catch {
      // Always show success to avoid leaking user existence
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-brand-green/5 via-background to-brand-blue/10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-center">
            {t("auth.forgotTitle")}
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            {t("auth.forgotSubtitle")}
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-foreground">
                {t("auth.forgotSuccess")}
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full h-11">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("auth.backToLogin")}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    className="pl-10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("auth.forgotButton")}
              </Button>

              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full h-11 text-muted-foreground">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("auth.backToLogin")}
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
