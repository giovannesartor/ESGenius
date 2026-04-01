"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { companyApi } from "@/services/api";
import { Building2, Loader2, ArrowLeft } from "lucide-react";

export default function NewCompanyPage() {
  const t = useTranslations();
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    sector: "",
    country: "",
    size: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      await companyApi.create(token, {
        name: form.name,
        sector: form.sector || undefined,
        country: form.country || undefined,
        size: form.size || undefined,
      });
      router.push("/dashboard/companies");
    } catch (err: unknown) {
      const apiErr = err as { data?: { detail?: string } };
      setError(apiErr?.data?.detail || "Failed to create company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboard.newCompany")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a new company profile for ESG assessment
          </p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Acme Corporation"
                className="h-11"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  placeholder="e.g., Technology"
                  className="h-11"
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="e.g., Brazil"
                  className="h-11"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Company Size</Label>
              <Input
                id="size"
                placeholder="e.g., 1000-5000 employees"
                className="h-11"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the company..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="font-semibold">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Company
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
