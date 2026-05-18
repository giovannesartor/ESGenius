"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileBarChart2, CheckCircle, Download, Share2 } from "lucide-react";
import { usePartnerAuth } from "../layout";

interface PreviewResult {
  company: string;
  sector: string;
  esg_score: number;
  rating: string;
  wacc_delta: number;
  risk_level: string;
  top_gaps: string[];
  recommendation: string;
}

const SECTORS = [
  "Agropecuária",
  "Alimentos e Bebidas",
  "Construção Civil",
  "Energia",
  "Financeiro",
  "Mineração",
  "Petróleo e Gás",
  "Saúde",
  "Tecnologia",
  "Varejo",
  "Outros",
];

const COMPANY_SIZES = ["Micro (< R$360k)", "Pequena (R$360k - R$4.8M)", "Média (R$4.8M - R$300M)", "Grande (> R$300M)"];

const MOCK_PREVIEW: PreviewResult = {
  company: "Empresa Modelo",
  sector: "Tecnologia",
  esg_score: 62,
  rating: "BB",
  wacc_delta: -0.8,
  risk_level: "Moderado",
  top_gaps: [
    "Ausência de política de gestão de emissões documentada",
    "Falta de diversidade em cargos de liderança (< 30% mulheres)",
    "Sem canal de denúncias estruturado",
  ],
  recommendation:
    "Com melhorias nos 3 pilares identificados, o score pode atingir 75+ em 12 meses, reduzindo o WACC em até 1.5 p.p. e melhorando o acesso a linhas de crédito verde.",
};

export default function PartnerFreeReportPage() {
  const t = useTranslations("partner");
  const { partner } = usePartnerAuth();
  const [form, setForm] = useState({ company: "", sector: "", size: "", employees: "" });
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500)); // simulate API call
    setResult({ ...MOCK_PREVIEW, company: form.company || MOCK_PREVIEW.company, sector: form.sector || MOCK_PREVIEW.sector });
    setLoading(false);
  };

  const resetForm = () => { setResult(null); setForm({ company: "", sector: "", size: "", employees: "" }); };

  const shareLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://esg360.digital"}/ref/${partner?.ref_code || ""}`;

  const getRatingColor = (r: string) => {
    if (["AAA", "AA", "A"].includes(r)) return "text-green-600 dark:text-green-400";
    if (["BBB", "BB"].includes(r)) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-500";
  };

  const getScoreColor = (s: number) => {
    if (s >= 75) return "text-green-600";
    if (s >= 50) return "text-yellow-600";
    return "text-red-500";
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("freeReport.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("freeReport.subtitle")}</p>
      </div>

      {!result ? (
        /* Form */
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileBarChart2 className="h-4 w-4 text-primary" />
              {t("freeReport.formTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="company">{t("freeReport.companyName")}</Label>
                  <Input
                    id="company"
                    placeholder="Nome da empresa prospecto"
                    value={form.company}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("freeReport.sector")}</Label>
                  <Select value={form.sector} onValueChange={(v) => setForm((p) => ({ ...p, sector: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("freeReport.selectSector")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("freeReport.size")}</Label>
                  <Select value={form.size} onValueChange={(v) => setForm((p) => ({ ...p, size: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("freeReport.selectSize")} />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="employees">{t("freeReport.employees")}</Label>
                  <Input
                    id="employees"
                    type="number"
                    min={1}
                    placeholder="Ex: 120"
                    value={form.employees}
                    onChange={(e) => setForm((p) => ({ ...p, employees: e.target.value }))}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !form.company}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("freeReport.generating")}</>
                ) : (
                  <><FileBarChart2 className="h-4 w-4 mr-2" /> {t("freeReport.generate")}</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Result */
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{t("freeReport.generated")}</span>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{result.company}</CardTitle>
                  <p className="text-sm text-muted-foreground">{result.sector} · {t("freeReport.previewLabel")}</p>
                </div>
                <Badge variant="outline" className="text-xs">{t("freeReport.preview")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Score + Rating */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">{t("freeReport.esgScore")}</p>
                  <p className={`text-3xl font-bold ${getScoreColor(result.esg_score)}`}>{result.esg_score}</p>
                  <p className="text-xs text-muted-foreground">/100</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">{t("freeReport.rating")}</p>
                  <p className={`text-3xl font-bold ${getRatingColor(result.rating)}`}>{result.rating}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">{t("freeReport.waccDelta")}</p>
                  <p className="text-3xl font-bold text-blue-500">{result.wacc_delta > 0 ? "+" : ""}{result.wacc_delta.toFixed(1)}p.p.</p>
                </div>
              </div>

              {/* Gaps */}
              <div>
                <p className="text-sm font-semibold mb-2">{t("freeReport.topGaps")}</p>
                <ul className="space-y-1.5">
                  {result.top_gaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-orange-400 shrink-0 mt-0.5">▲</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendation */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-primary mb-1">{t("freeReport.recommendation")}</p>
                <p className="text-sm text-foreground/80">{result.recommendation}</p>
              </div>

              {/* CTA with referral link */}
              <div className="bg-muted rounded-lg p-4 text-center space-y-3">
                <p className="text-sm font-medium">{t("freeReport.ctaTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("freeReport.ctaDescription")}</p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={() => navigator.clipboard.writeText(shareLink)}>
                    <Share2 className="h-3.5 w-3.5 mr-1.5" />
                    {t("freeReport.shareLink")}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    {t("freeReport.downloadPDF")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={resetForm} className="w-full">
            {t("freeReport.newReport")}
          </Button>
        </div>
      )}
    </div>
  );
}
