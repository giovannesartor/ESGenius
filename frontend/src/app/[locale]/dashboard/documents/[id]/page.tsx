"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCompany } from "@/hooks/useCompany";
import { documentApi, dataPointApi } from "@/services/api";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Calendar,
  Hash,
  Leaf,
  Users,
  Scale,
  Database,
} from "lucide-react";

interface DocumentDetail {
  id: string;
  original_filename: string;
  file_type?: string;
  status: string;
  created_at: string;
  page_count?: number;
  file_size?: number;
}

interface DataPoint {
  id: string;
  pillar: string;
  category?: string;
  value: string;
  numeric_value?: number;
  unit?: string;
  year?: number;
  document_id?: string;
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; className: string; labelKey: string; spin?: boolean }> = {
  processing: { icon: Loader2, labelKey: "dashboard.statusProcessing", className: "text-amber-600 bg-amber-50 border-amber-200", spin: true },
  processed: { icon: CheckCircle2, labelKey: "dashboard.statusProcessed", className: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  completed: { icon: CheckCircle2, labelKey: "dashboard.statusCompleted", className: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  failed: { icon: AlertCircle, labelKey: "dashboard.statusFailed", className: "text-red-600 bg-red-50 border-red-200" },
  uploaded: { icon: Clock, labelKey: "dashboard.statusUploaded", className: "text-blue-600 bg-blue-50 border-blue-200" },
};

const pillarConfig: Record<string, { icon: typeof Leaf; color: string; bg: string }> = {
  E: { icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50" },
  S: { icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  G: { icon: Scale, color: "text-purple-600", bg: "bg-purple-50" },
};

const pillarLabel: Record<string, string> = { E: "dashboard.pillars.environmental", S: "dashboard.pillars.social", G: "dashboard.pillars.governance" };

export default function DocumentDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const { company, token } = useCompany();
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !company || !documentId) return;

    const fetchData = async () => {
      try {
        const [docResult, dpResult] = await Promise.allSettled([
          documentApi.get(token, company.id, documentId),
          dataPointApi.list(token, company.id, { document_id: documentId }),
        ]);

        if (docResult.status === "fulfilled") {
          setDocument(docResult.value as DocumentDetail);
        } else {
          setError(t("dashboard.documentNotFound"));
        }

        if (dpResult.status === "fulfilled") {
          setDataPoints((dpResult.value as DataPoint[]) || []);
        }
      } catch {
        setError(t("dashboard.documentFailedToLoad"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, company, documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold mb-4">{error || t("dashboard.documentNotFound")}</h2>
          <Button variant="outline" onClick={() => router.push("/dashboard/documents")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("dashboard.nav.documents")}
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[document.status] || statusConfig.uploaded;
  const StatusIcon = status.icon;

  // Group data points by pillar
  const grouped = dataPoints.reduce<Record<string, DataPoint[]>>((acc, dp) => {
    const p = dp.pillar?.toUpperCase() || "E";
    if (!acc[p]) acc[p] = [];
    acc[p].push(dp);
    return acc;
  }, {});

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back nav */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/documents")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("dashboard.nav.documents")}
      </Button>

      {/* Header card */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{document.original_filename}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {document.file_type && (
                    <Badge variant="outline" className="text-xs uppercase">
                      {document.file_type}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(document.created_at).toLocaleDateString()}
                  </span>
                  {document.page_count && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {document.page_count} {t("dashboard.pagesLabel")}
                    </span>
                  )}
                  {document.file_size && (
                    <span className="text-xs text-muted-foreground">{formatFileSize(document.file_size)}</span>
                  )}
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs px-3 py-1.5 h-auto ${status.className} border`}
            >
              <StatusIcon className={`mr-1.5 h-3 w-3 ${status.spin ? "animate-spin" : ""}`} />
              {t(status.labelKey)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Extracted data points */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            {t("dashboard.extractedDataPoints")}
            {dataPoints.length > 0 && (
              <Badge variant="secondary" className="ml-1">{dataPoints.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dataPoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="h-10 w-10 text-muted-foreground/30 mb-3" />
              {document.status === "processing" ? (
                <>
                  <p className="text-sm font-medium mb-1">{t("dashboard.extractionInProgress")}</p>
                  <p className="text-xs text-muted-foreground">{t("dashboard.extractionInProgressDesc")}</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium mb-1">{t("dashboard.noDataPointsExtracted")}</p>
                  <p className="text-xs text-muted-foreground">
                    {document.status === "failed"
                      ? t("dashboard.processingFailedMsg")
                      : t("dashboard.noEsgExtracted")}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {(["E", "S", "G"] as const).map((pillar) => {
                const pts = grouped[pillar];
                if (!pts?.length) return null;
                const cfg = pillarConfig[pillar];
                const PillarIcon = cfg.icon;
                return (
                  <div key={pillar}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                        <PillarIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      </div>
                      <h3 className="text-sm font-semibold">{t(pillarLabel[pillar])}</h3>
                      <Badge variant="secondary" className="text-xs">{pts.length}</Badge>
                    </div>
                    <div className="rounded-lg border border-border/50 divide-y divide-border/50">
                      {pts.map((dp) => (
                        <div key={dp.id} className="flex items-center gap-4 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{dp.category || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{dp.value}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 text-right">
                            {dp.numeric_value !== undefined && dp.numeric_value !== null && (
                              <span className="text-sm font-semibold tabular-nums">
                                {dp.numeric_value.toLocaleString()}
                                {dp.unit ? <span className="text-xs text-muted-foreground ml-1">{dp.unit}</span> : null}
                              </span>
                            )}
                            {dp.year && (
                              <Badge variant="outline" className="text-xs">{dp.year}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {pillar !== "G" && grouped["G"] ? <Separator className="mt-6" /> : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation footer */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/dashboard/data-points">
          <Button variant="outline" size="sm">
            <Database className="mr-2 h-4 w-4" />
            {t("dashboard.manageAllDataPoints")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
