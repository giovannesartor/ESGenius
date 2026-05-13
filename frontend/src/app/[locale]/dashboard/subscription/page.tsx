"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Zap,
  Building2,
  CreditCard,
  AlertCircle,
  Loader2,
  Star,
  ArrowRight,
  Calendar,
  XCircle,
  RefreshCw,
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

const planFeatures = {
  free: [
    "1 company profile",
    "Up to 50 data points/year",
    "GRI framework only",
    "Basic ESG score",
    "PDF report (watermarked)",
  ],
  professional: [
    "Unlimited companies",
    "Unlimited data points",
    "All frameworks (GRI, SASB, TCFD, CDP)",
    "AI-powered insights & scoring",
    "Clean PDF reports",
    "What-if simulation",
    "CSV data export",
    "Priority support",
  ],
  enterprise: [
    "Everything in Professional",
    "Custom frameworks",
    "Team management",
    "API access",
    "SLA & dedicated support",
    "Custom integrations",
  ],
};

function SubscriptionContent() {
  const t = useTranslations();
  const { token } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSubscription = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await stripeApi.getSubscription(token) as Subscription;
      setSubscription(data);
    } catch {
      setSubscription({ plan: "free", status: "active" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [token]);

  // Handle Stripe redirect
  useEffect(() => {
    const success = searchParams.get("success");
    const cancelled = searchParams.get("cancelled");
    const sessionId = searchParams.get("session_id");

    if (success === "true" && sessionId && token) {
      stripeApi.verifySession(token, sessionId).then(() => {
        setSuccessMsg("Subscription activated successfully!");
        fetchSubscription();
        router.replace(window.location.pathname);
      }).catch(() => {
        fetchSubscription();
      });
    } else if (cancelled === "true") {
      setErrorMsg("Checkout was cancelled. You can try again anytime.");
      router.replace(window.location.pathname);
    }
  }, [searchParams, token]);

  const handleUpgrade = async (plan: string) => {
    if (!token) return;
    setActionLoading("upgrade");
    setErrorMsg("");
    try {
      const res = await stripeApi.createCheckout(token, plan, interval);
      window.location.href = res.checkout_url;
    } catch {
      setErrorMsg("Failed to start checkout. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePortal = async () => {
    if (!token) return;
    setActionLoading("portal");
    try {
      const res = await stripeApi.getPortalUrl(token);
      window.location.href = res.portal_url;
    } catch {
      setErrorMsg("Failed to open billing portal.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!token) return;
    setActionLoading("cancel");
    try {
      await stripeApi.cancelSubscription(token);
      setSuccessMsg("Subscription will cancel at the end of the billing period.");
      fetchSubscription();
    } catch {
      setErrorMsg("Failed to cancel subscription.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    if (!token) return;
    setActionLoading("reactivate");
    try {
      await stripeApi.reactivateSubscription(token);
      setSuccessMsg("Subscription reactivated!");
      fetchSubscription();
    } catch {
      setErrorMsg("Failed to reactivate subscription.");
    } finally {
      setActionLoading(null);
    }
  };

  const currentPlan = subscription?.plan ?? "free";
  const isPro = currentPlan === "professional";
  const isEnterprise = currentPlan === "enterprise";

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-3 rounded-lg bg-brand-green/10 border border-brand-green/20 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
          <p className="text-sm">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{errorMsg}</p>
        </div>
      )}

      {/* Current Plan Status */}
      {loading ? (
        <Card className="border-border/50">
          <CardContent className="p-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-brand-blue" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${isPro || isEnterprise ? "bg-brand-gold/10" : "bg-muted"}`}>
                  {isPro || isEnterprise ? (
                    <Star className={`h-6 w-6 ${isPro ? "text-brand-gold" : "text-primary"}`} />
                  ) : (
                    <Zap className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold capitalize">{currentPlan}</p>
                    <Badge
                      variant="secondary"
                      className={
                        subscription?.status === "active"
                          ? "text-brand-green bg-brand-green/10"
                          : "text-destructive bg-destructive/10"
                      }
                    >
                      {subscription?.status ?? "active"}
                    </Badge>
                  </div>
                  {subscription?.current_period_end && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {subscription.cancel_at_period_end ? "Cancels" : "Renews"} on{" "}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                  {subscription?.cancel_at_period_end && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Scheduled to cancel — reactivate to keep access
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {(isPro || isEnterprise) && (
                  <>
                    <Button variant="outline" size="sm" onClick={handlePortal} disabled={actionLoading === "portal"}>
                      {actionLoading === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      <span className="ml-2">Manage Billing</span>
                    </Button>
                    {subscription?.cancel_at_period_end ? (
                      <Button size="sm" onClick={handleReactivate} disabled={actionLoading === "reactivate"}>
                        {actionLoading === "reactivate" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reactivate
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={handleCancel} disabled={actionLoading === "cancel"} className="text-destructive hover:text-destructive">
                        {actionLoading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        <span className="ml-2">Cancel Plan</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Plans */}
      {!isPro && !isEnterprise && (
        <>
          {/* Billing interval toggle */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant={interval === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setInterval("month")}
            >
              Monthly
            </Button>
            <Button
              variant={interval === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setInterval("year")}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-brand-green bg-brand-green/10 text-[10px]">
                Save 17%
              </Badge>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Professional */}
            <Card className="border-brand-green/30 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-green to-brand-blue" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-brand-gold" />
                    Professional
                  </CardTitle>
                  <Badge className="bg-brand-green text-white">Most Popular</Badge>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    {interval === "month" ? "$299" : "$2,990"}
                  </span>
                  <span className="text-muted-foreground text-sm">/{interval === "month" ? "mo" : "yr"}</span>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <ul className="space-y-2">
                  {planFeatures.professional.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  onClick={() => handleUpgrade("professional")}
                  disabled={actionLoading === "upgrade"}
                >
                  {actionLoading === "upgrade" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Upgrade to Professional
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Enterprise
                  </CardTitle>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <ul className="space-y-2">
                  {planFeatures.enterprise.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:contato@esg360.ai?subject=Enterprise%20Plan">
                    Contact Sales
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* What's included (when on paid plan) */}
      {(isPro || isEnterprise) && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Your Plan Includes</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {planFeatures[currentPlan as keyof typeof planFeatures]?.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-brand-blue" />
          Subscription & Billing
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your ESG360 subscription and billing information
        </p>
      </div>
      <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
        <SubscriptionContent />
      </Suspense>
    </div>
  );
}
