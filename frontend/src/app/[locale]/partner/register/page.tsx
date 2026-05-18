"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { apiClient } from "@/services/api";

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">{t("register.title")}</CardTitle>
            <CardDescription>{t("register.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { field: "full_name", label: t("register.fullName"), type: "text", required: true },
                { field: "email", label: t("register.email"), type: "email", required: true },
                { field: "password", label: t("register.password"), type: "password", required: true },
                { field: "company_name", label: t("register.company"), type: "text", required: false },
                { field: "phone", label: t("register.phone"), type: "tel", required: false },
              ].map(({ field, label, type, required }) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{label}</Label>
                  <Input
                    id={field}
                    type={type}
                    value={form[field as keyof typeof form]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    required={required}
                  />
                </div>
              ))}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("register.submit")}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t("register.hasAccount")}{" "}
              <Link href="/partner/login" className="text-primary hover:underline">
                {t("register.loginLink")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
