"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react";
import { authApi } from "@/services/api";

function VerifyEmailContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "missing">(
    token ? "loading" : "missing"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;

    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : t("auth.verifyFailed"));
        setStatus("error");
      });
  }, [token, t]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t("auth.verifyingEmail")}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t("auth.emailVerified")}</h2>
          <p className="text-sm text-muted-foreground text-center">{t("auth.emailVerifiedDesc")}</p>
        </div>
        <Link href="/login">
          <Button className="w-full h-11 font-semibold">{t("auth.loginNow")}</Button>
        </Link>
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">{t("auth.checkYourEmail")}</p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full h-11">{t("auth.backToLogin")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-sm text-destructive">{errorMsg || t("auth.verifyFailed")}</p>
      </div>
      <p className="text-xs text-muted-foreground text-center">{t("auth.verifyExpiredDesc")}</p>
      <Link href="/login">
        <Button variant="outline" className="w-full h-11">{t("auth.backToLogin")}</Button>
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-brand-green/5 via-background to-brand-blue/10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-foreground text-center">
            {t("auth.verifyEmailTitle")}
          </h1>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <VerifyEmailContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
