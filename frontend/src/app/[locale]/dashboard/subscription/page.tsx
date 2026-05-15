"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Lock,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  ListChecks,
  Leaf,
  Target,
  Layers,
  Globe,
  Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { stripeApi } from "@/services/api";
import { useCompany } from "@/hooks/useCompany";

interface Subscription {
  plan: string;
  status: string;
  interval?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  price?: number;
  currency?: string;
}

const ARTIFACT_ICONS = [
  FileText,
  FileText,
  FileSpreadsheet,
  ListChecks,
  Leaf,
  Target,
  Layers,
  Globe,
];

function EsgReportsContent() {
  const t = useTranslations();
  const { token } = useAuth();
  useCompany();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSubscription = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = (await stripeApi.getSubscription(token)) as Subscription;
      setSubscription(data);
    } catch {
      setSubscription({ plan: "free", status: "active" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const success = searchParams.get("success");
    const cancelled = searchParams.get("cancelled");
    const sessionId = searchParams.get("session_id");
    const adminBypass = searchParams.get("admin_bypass");

    if (adminBypass === "1") {
      setSuccessMsg(t("dashboard.esgReports.unlockProcessing"));
      fetchSubscription();
      router.replace(window.location.pathname);
      return;
    }

    if (success === "true" && sessionId && token) {
      stripeApi
        .verifySession(token, sessionId)
        .then(() => {
          setSuccessMsg(t("dashboard.esgReports.unlockProcessing"));
          fetchSubscription();
          router.replace(window.location.pathname);
        })
        .catch(() => {
          fetchSubscription();
        });
    } else if (cancelled === "true") {
      setErrorMsg(t("common.error"));
      router.replace(window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, token]);

  const handleUnlock = async (plan: "professional" | "enterprise") => {
    if (!token) return;
    setActionLoading(plan);
    setErrorMsg("");
    try {
      const res = await stripeApi.createCheckout(token, plan, "month");
      // Admin bypass: backend already activated the subscription, no Stripe redirect needed
      if (res.admin_bypass) {
        setSuccessMsg(t("dashboard.esgReports.unlockProcessing"));
        await fetchSubscription();
        return;
      }
      const target = res.checkout_url || res.url;
      if (target) {
        window.location.href = target;
      } else {
        setErrorMsg(t("common.error"));
      }
    } catch {
      setErrorMsg(t("common.error"));
    } finally {
      setActionLoading(null);
    }
  };

  const currentPlan = subscription?.plan ?? "free";
  const hasUnlocked = currentPlan === "professional" || currentPlan === "enterprise";

  const proPrice = t("pricing.professional.price");
  const entPrice = t("pricing.enterprise.price");

  return (
    <div className="space-y-8">
      {successMsg && (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <p className="text-sm">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
      )}

      {loading ? (
        <Card className="border-border/50">
          <CardContent className="p-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : hasUnlocked ? (
        // ============== UNLOCKED STATE ==============
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-base">{t("dashboard.esgReports.purchasedTitle")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <p className="text-sm text-muted-foreground">{t("dashboard.esgReports.purchasedDesc")}</p>

            <div className="rounded-xl border border-border/60 bg-background p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-bold text-foreground capitalize">
                    {currentPlan === "enterprise"
                      ? t("dashboard.esgReports.tierEnterprise")
                      : t("dashboard.esgReports.tierProfessional")}
                  </div>
                  <Badge className="mt-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]">
                    {t("dashboard.activeBadge")}
                  </Badge>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  {t("dashboard.esgReports.downloadAll")}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Array.from({ length: 8 }, (_, i) => {
                  const Icon = ARTIFACT_ICONS[i];
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-foreground truncate">
                          {t(`dashboard.bundle.artifact${i + 1}Title`)}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {t(`dashboard.bundle.artifact${i + 1}Format`)}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0 h-8 px-2">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button onClick={() => handleUnlock("professional")} disabled={actionLoading !== null} className="w-full sm:w-auto">
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {t("dashboard.esgReports.newReportCta")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        // ============== PREVIEW (LOCKED) STATE ==============
        <>
          {/* Preview banner */}
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                  <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h2 className="text-base font-bold text-foreground">
                      {t("dashboard.esgReports.previewTitle")}
                    </h2>
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-0 text-[10px] font-bold uppercase">
                      {t("dashboard.esgReports.previewBadge")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{t("dashboard.esgReports.previewDesc")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Professional */}
            <Card className="border-emerald-500/40 ring-1 ring-emerald-500/10 shadow-lg shadow-emerald-500/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                    {t("dashboard.esgReports.tierProfessional")}
                  </CardTitle>
                  <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wide">
                    {t("dashboard.mostPopular")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t("dashboard.esgReports.tierProDesc")}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground">{proPrice}</span>
                  <span className="text-sm font-semibold text-muted-foreground">{t("pricing.professional.period")}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{t("pricing.oneTime")}</p>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <Button
                  size="lg"
                  className="w-full h-12 font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-white"
                  onClick={() => handleUnlock("professional")}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "professional" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  {t("dashboard.esgReports.unlockCta", { price: proPrice })}
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">{t("dashboard.esgReports.unlockHelp")}</p>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    {t("dashboard.esgReports.tierEnterprise")}
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t("dashboard.esgReports.tierEntDesc")}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-foreground">{entPrice}</span>
                  <span className="text-sm font-semibold text-muted-foreground">{t("pricing.enterprise.period")}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{t("pricing.oneTime")}</p>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-12 font-bold text-sm"
                  onClick={() => handleUnlock("enterprise")}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "enterprise" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  {t("dashboard.esgReports.buyNow")}
                </Button>
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <a href="mailto:contato@esg360.ai?subject=Enterprise%20ESG%20Bundle">
                    {t("dashboard.esgReports.contactSales")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 8 artifacts bundle */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.bundle.sectionTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{t("dashboard.bundle.sectionSubtitle")}</p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 8 }, (_, i) => {
                  const Icon = ARTIFACT_ICONS[i];
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-emerald-500/30 hover:shadow-sm transition-all"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-foreground">
                            {t(`dashboard.bundle.artifact${i + 1}Title`)}
                          </span>
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[9px] font-bold">
                            {t("dashboard.bundle.includedBadge")}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mb-1.5">
                          {t(`dashboard.bundle.artifact${i + 1}Format`)}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t(`dashboard.bundle.artifact${i + 1}Desc`)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-xs text-muted-foreground">{t("dashboard.esgReports.valueAnchor")}</p>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {t("dashboard.esgReports.secureCheckout")}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function EsgReportsPage() {
  const t = useTranslations();
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-500" />
          {t("dashboard.esgReports.pageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("dashboard.esgReports.pageSubtitle")}</p>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }
      >
        <EsgReportsContent />
      </Suspense>
    </div>
  );
}
