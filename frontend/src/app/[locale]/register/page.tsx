"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, Mail, User, CheckCircle2 } from "lucide-react";
import { authApi } from "@/services/api";

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = [
    { key: "length", check: password.length >= 8, label: t("auth.passwordLength") },
    { key: "upper", check: /[A-Z]/.test(password), label: t("auth.passwordUpper") },
    { key: "number", check: /[0-9]/.test(password), label: t("auth.passwordNumber") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register({ email, password, full_name: fullName });
      router.push("/login");
    } catch (err: unknown) {
      const apiErr = err as { data?: { detail?: string } };
      setError(apiErr?.data?.detail || t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const data = await authApi.googleLogin();
      window.location.href = (data as { authorization_url: string }).authorization_url;
    } catch {
      setError(t("auth.googleUnavailable"));
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Back to home */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/60 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("nav.backToHome")}
      </Link>

      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-green/5 via-background to-brand-blue/10 items-center justify-center p-12">
        <div className="max-w-md flex flex-col items-center lg:items-start">
          <Logo size="2xl" showText={false} />
          <h2 className="mt-8 text-2xl font-bold text-foreground">
            {t("auth.registerHeading")}
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {t("auth.registerBranding")}
          </p>
          <ul className="mt-8 space-y-4">
            {(["feature1", "feature2", "feature3", "feature4", "feature5"] as const).map((key, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{t(`auth.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <div className="lg:hidden flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="text-2xl font-bold text-foreground text-center lg:text-left">
              {t("auth.registerTitle")}
            </h1>
            <p className="text-sm text-muted-foreground text-center lg:text-left">
              {t("auth.registerSubtitle")}
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Google Register */}
            <Button
              variant="outline"
              className="w-full h-11 font-medium mb-4"
              onClick={handleGoogleLogin}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t("auth.googleButton")}
            </Button>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                {t("auth.or")}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.name")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t("auth.namePlaceholder")}
                    className="pl-10 h-11"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10 h-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password strength */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {passwordChecks.map(({ key, check, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-3.5 w-3.5 ${check ? "text-primary" : "text-muted-foreground/40"}`}
                        />
                        <span className={`text-xs ${check ? "text-foreground" : "text-muted-foreground"}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold"
                disabled={loading || !passwordChecks.every((c) => c.check)}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {t("auth.registerButton")}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              {t("auth.termsText")}{" "}
              <Link href="/terms" className="text-primary hover:underline">{t("auth.termsLink")}</Link>
              {" "}{t("auth.termsAnd")}{" "}
              <Link href="/privacy" className="text-primary hover:underline">{t("auth.privacyLink")}</Link>
            </p>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                {t("auth.login")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
