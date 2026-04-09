"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompany } from "@/hooks/useCompany";
import { reportApi } from "@/services/api";
import {
  BarChart3,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  Globe,
  Loader2,
  Building2,
} from "lucide-react";

interface Report {
  id: string;
  title?: string;
  framework_code?: string;
  status: string;
  created_at: string;
  published_at?: string;
}

export default function ReportsPage() {
  const t = useTranslations();
  const { company, loading: companyLoading, token } = useCompany();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !company) return;
    reportApi
      .list(token, company.id)
      .then((data) => setReports((data as Report[]) || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [token, company]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboard.nav.reports")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("dashboard.reportsSubtitle")} — <span className="font-medium text-foreground">{company.name}</span>
          </p>
        </div>
        <Button className="font-semibold" disabled>
          <Plus className="mr-2 h-4 w-4" />
          {t("dashboard.generateReport")}
        </Button>
      </div>

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
            <Link href="/dashboard/upload">
              <Button variant="outline" className="font-semibold">
                {t("dashboard.uploadDocuments")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reports.map((report) => (
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
                      report.status === "published"
                        ? "text-emerald-600 bg-emerald-50"
                        : "text-amber-600 bg-amber-50"
                    }`}
                  >
                    {report.status === "published" ? (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    ) : (
                      <FileText className="mr-1 h-3 w-3" />
                    )}
                    {report.status === "published" ? t("dashboard.published") : report.status || t("dashboard.draft")}
                  </Badge>
                </div>
                <CardTitle className="text-base font-semibold mt-2">
                  {report.title || `Report ${report.id.slice(0, 8)}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{company.name}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
