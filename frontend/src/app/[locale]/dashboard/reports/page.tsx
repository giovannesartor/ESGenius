"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCompany } from "@/hooks/useCompany";
import { reportApi } from "@/services/api";
import {
  BarChart3, FileText, Plus, Clock, CheckCircle2, Globe,
  Loader2, Building2, Download, AlertCircle, RefreshCw,
} from "lucide-react";

interface Report {
  id: string;
  title?: string;
  framework_code?: string;
  format?: string;
  status: string;
  created_at: string;
  published_at?: string;
}

const PAGE_SIZE = 10;

export default function ReportsPage() {
  const t = useTranslations();
  const { company, loading: companyLoading, token } = useCompany();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchReports = async () => {
    if (!token || !company) return [];
    setLoading(true);
    try {
      const data = await reportApi.list(token, company.id);
      const items = (data as Report[]) || [];
      setReports(items);
      return items;
    } catch {
      setReports([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      if (!token || !company) return;
      try {
        const data = await reportApi.list(token, company.id);
        const items = (data as Report[]) || [];
        setReports(items);
        const hasGenerating = items.some((r) => r.status === "generating" || r.status === "pending");
        if (!hasGenerating && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch { /* ignore */ }
    }, 5000);
  };

  useEffect(() => {
    fetchReports().then((items) => {
      const hasGenerating = items.some((r) => r.status === "generating" || r.status === "pending");
      if (hasGenerating) startPolling();
    });
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [token, company]);

  // Generate dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    report_type: "GRI",
    format: "pdf",
    year: new Date().getFullYear(),
  });

  const handleGenerate = async () => {
    if (!token || !company || !formData.title.trim()) return;
    setGenerating(true);
    setGenError("");
    try {
      await reportApi.create(token, company.id, {
        title: formData.title,
        report_type: formData.report_type,
        format: formData.format,
        year: formData.year,
      });
      setDialogOpen(false);
      setFormData({ title: "", report_type: "GRI", format: "pdf", year: new Date().getFullYear() });
      fetchReports().then(() => startPolling());
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : t("dashboard.reportsForm.failedGenerate"));
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report: Report) => {
    if (!token || !company) return;
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.esg360.digital/api/v1";
      const res = await fetch(
        `${API_BASE}/companies/${company.id}/reports/${report.id}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title || "esg-report"}.${report.format || "pdf"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert(t("dashboard.downloadFailed"));
    }
  };

  const paginated = reports.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(reports.length / PAGE_SIZE);

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("dashboard.noCompanyTitle")}</h3>
          <p className="text-sm text-muted-foreground mb-6">{t("dashboard.noCompanyGenericDesc")}</p>
          <Link href="/dashboard/companies/new">
            <Button className="font-semibold">{t("dashboard.createCompany")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboard.nav.reports")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("dashboard.reportsSubtitle")} — <span className="font-medium text-foreground">{company.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button className="font-semibold" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("dashboard.generateReport")}
          </Button>
        </div>
      </div>

      {/* Generate Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t("dashboard.reportsForm.dialogTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="report-title">{t("dashboard.reportsForm.titleLabel")}</Label>
              <Input
                id="report-title"
                placeholder={t("dashboard.reportsForm.titlePlaceholder")}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("dashboard.reportsForm.frameworkLabel")}</Label>
                <Select value={formData.report_type} onValueChange={(v) => setFormData({ ...formData, report_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GRI">GRI Standards</SelectItem>
                    <SelectItem value="SASB">SASB</SelectItem>
                    <SelectItem value="TCFD">TCFD</SelectItem>
                    <SelectItem value="CDP">CDP</SelectItem>
                    <SelectItem value="CSRD">CSRD</SelectItem>
                    <SelectItem value="MULTI">{t("dashboard.reportsForm.frameworkMulti")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("dashboard.reportsForm.formatLabel")}</Label>
                <Select value={formData.format} onValueChange={(v) => setFormData({ ...formData, format: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">DOCX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t("dashboard.reportsForm.yearLabel")}</Label>
              <Select value={String(formData.year)} onValueChange={(v) => setFormData({ ...formData, year: Number(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2026, 2025, 2024, 2023, 2022].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {genError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {genError}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t("dashboard.reportsForm.aiHint")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("dashboard.reportsForm.cancel")}</Button>
            <Button onClick={handleGenerate} disabled={generating || !formData.title.trim()}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BarChart3 className="mr-2 h-4 w-4" />}
              {generating ? t("dashboard.reportsForm.generating") : t("dashboard.reportsForm.generate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">{t("dashboard.noReportsTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              {t("dashboard.noReportsDesc")}
            </p>
            <Button onClick={() => setDialogOpen(true)} className="font-semibold">
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.reportsForm.generateFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginated.map((report) => (
              <Card key={report.id} className="border-border/50 hover:border-primary/20 hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BarChart3 className="h-4 w-4 text-primary" />
                      </div>
                      {report.framework_code && (
                        <Badge variant="outline" className="text-xs font-mono">
                          <Globe className="mr-1 h-3 w-3" />
                          {report.framework_code}
                        </Badge>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        report.status === "completed" || report.status === "published"
                          ? "text-emerald-600 bg-emerald-50"
                          : report.status === "failed"
                          ? "text-red-600 bg-red-50"
                          : "text-amber-600 bg-amber-50"
                      }`}
                    >
                      {report.status === "completed" || report.status === "published" ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : report.status === "failed" ? (
                        <AlertCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      )}
                      {report.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-semibold mt-2">
                    {report.title || `Report ${report.id.slice(0, 8)}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    {(report.status === "completed" || report.status === "published") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-xs font-medium"
                        onClick={() => handleDownload(report)}
                      >
                        <Download className="mr-1.5 h-3 w-3" />
                        {t("dashboard.download")} {report.format?.toUpperCase() || "PDF"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
                {t("dashboard.previousPage")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("dashboard.pageOf", { current: page + 1, total: totalPages })}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
                {t("dashboard.nextPage")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
