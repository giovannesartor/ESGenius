"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Eye, EyeOff, CheckCircle2, Handshake, Zap } from "lucide-react";
import { apiClient } from "@/services/api";

const BENEFITS = [
  "50% de comissão fixa em cada venda",
  "Sem limite de clientes nem taxa de entrada",
  "Pagamento via PIX aprovado em até 48h",
  "Dashboard completo: pipeline, comissões e follow-up",
  "Material de vendas e scripts prontos para usar",
];

export default function PartnerLoginPage() {
  const t = useTranslations("partner");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiClient<{ access_token: string; partner_id: string }>("/partners/login", {
        method: "POST",
        body: { email, password },
      });
      const profile = await apiClient<Record<string, unknown>>("/partners/me", { token: res.access_token });
      localStorage.setItem("partner_token", res.access_token);
      localStorage.setItem("partner_user", JSON.stringify(profile));
      window.location.href = `/${locale}/partner`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("login.invalidCredentials");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
              Programa de Parceiros
            </Badge>
            <h1 className="text-3xl font-bold text-white leading-snug">
              Venda ESG.<br />
              <span className="text-emerald-400">Ganhe 50% de comissão.</span>
            </h1>
            <p className="text-slate-400 leading-relaxed max-w-xs">
              Parceiros ESGenius recebem exatamente metade do valor em cada relatório vendido — aprovado e pago via PIX.
            </p>
          </div>

          {/* Benefits */}
          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-slate-300 text-sm">{b}</span>
              </li>
            ))}
          </ul>

          {/* Commission cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Profissional</p>
              <p className="text-xl font-bold text-white">$3.750</p>
              <p className="text-xs text-slate-500">por venda</p>
            </div>
            <div className="rounded-xl bg-emerald-900/30 border border-emerald-700/40 p-4 space-y-1">
              <div className="flex items-center gap-1">
                <p className="text-xs text-emerald-500 uppercase tracking-wide">Enterprise</p>
                <Zap className="h-3 w-3 text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-emerald-300">$12.000</p>
              <p className="text-xs text-slate-500">por venda</p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="relative text-xs text-slate-600">
          Pagamento em USD · Taxa única por relatório entregue
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex justify-center lg:hidden">
            <Logo size="xl" showText={false} />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{t("login.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="parceiro@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.passwordLabel")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t("login.submit")}
            </Button>
          </form>

          <Separator />

          <p className="text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link href="/partner/register" className="text-primary hover:underline font-medium">
              {t("login.registerLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
