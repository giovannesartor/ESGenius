"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, CheckCircle2, Handshake, TrendingUp, DollarSign, Users, BarChart3, ArrowLeft } from "lucide-react";
import { apiClient } from "@/services/api";

const BENEFITS = [
  {
    icon: DollarSign,
    title: "50% de comissão fixa",
    desc: "A cada relatório ou plano vendido, você recebe exatamente metade — sem exceções.",
  },
  {
    icon: TrendingUp,
    title: "Tickets altos",
    desc: "Profissional ($7.500) e Enterprise ($24.000). Uma venda Enterprise vale $12.000 para você.",
  },
  {
    icon: Users,
    title: "Sem limite de clientes",
    desc: "Escale sem restrições. Quanto mais você vende, mais você ganha.",
  },
  {
    icon: BarChart3,
    title: "Dashboard completo",
    desc: "Acompanhe seu pipeline, comissões e follow-ups em tempo real.",
  },
];

export default function PartnerRegisterPage() {
  const t = useTranslations("partner");
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    company_name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiClient("/partners/register", { method: "POST", body: form });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("register.errorGeneric");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="text-xl font-semibold">{t("register.successTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("register.successMessage")}</p>
            <Link href="/partner/login">
              <Button variant="outline" className="w-full">{t("register.goToLogin")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-[#052e1c] via-[#0a3d25] to-[#0f2d1e] p-10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-emerald-500 blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-teal-400 blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Logo */}
        <div className="relative">
          <Logo size="xl" showText={false} />
        </div>

        {/* Main copy */}
        <div className="relative space-y-8">
          <div className="space-y-3">
            <Badge className="bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 gap-1.5">
              <Handshake className="h-3.5 w-3.5" />
              Torne-se Parceiro
            </Badge>
            <h1 className="text-3xl font-bold text-white leading-snug">
              Seu negócio.<br />
              <span className="text-emerald-400">Nossa plataforma.</span>
            </h1>
            <p className="text-slate-400 leading-relaxed max-w-xs">
              Cadastre-se, indique clientes e receba 50% de comissão em cada relatório ESG entregue — sem burocracia.
            </p>
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 gap-4">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-900/40 border border-emerald-800/30 p-2 shrink-0">
                    <Icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{b.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <CheckCircle2 key={i} className="h-3.5 w-3.5 text-emerald-600" />
            ))}
            <p className="text-xs text-slate-500">Aprovação em até 24h · Suporte dedicado</p>
          </div>
        </div>

        <p className="relative text-xs text-slate-600">
          Pagamento em USD · Taxa única por relatório entregue
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo — centered, no text, 2× bigger than original md (80px → 160px via 2xl) */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <Logo size="2xl" showText={false} />
            <Badge variant="outline" className="border-emerald-700/50 text-emerald-400">
              <Handshake className="h-3 w-3 mr-1" />
              Programa de Parceiros
            </Badge>
          </div>

          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao início
            </Link>
            <h2 className="text-2xl font-bold">{t("register.title")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("register.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: "full_name", label: t("register.fullName"), type: "text", required: true, placeholder: "João Silva" },
              { field: "email", label: t("register.email"), type: "email", required: true, placeholder: "joao@empresa.com" },
              { field: "password", label: t("register.password"), type: "password", required: true, placeholder: "Mínimo 8 caracteres" },
              { field: "company_name", label: t("register.company"), type: "text", required: false, placeholder: "Consultoria XYZ (opcional)" },
              { field: "phone", label: t("register.phone"), type: "tel", required: false, placeholder: "+55 11 99999-0000 (opcional)" },
            ].map(({ field, label, type, required, placeholder }) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{label}</Label>
                <Input
                  id={field}
                  type={type}
                  placeholder={placeholder}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  required={required}
                />
              </div>
            ))}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("register.submit")}
            </Button>
          </form>

          <Separator />

          <p className="text-center text-sm text-muted-foreground">
            {t("register.hasAccount")}{" "}
            <Link href="/partner/login" className="text-primary hover:underline font-medium">
              {t("register.loginLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
