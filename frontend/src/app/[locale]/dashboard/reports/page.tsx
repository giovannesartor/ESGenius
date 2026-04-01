"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Download,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  Globe,
} from "lucide-react";

interface Report {
  id: string;
  name: string;
  framework: string;
  company: string;
  status: "draft" | "published";
  generatedAt: string;
}

const mockReports: Report[] = [
  { id: "1", name: "GRI Annual Report 2024", framework: "GRI", company: "Acme Corp", status: "published", generatedAt: "2025-01-15" },
  { id: "2", name: "SASB Disclosure Q4 2024", framework: "SASB", company: "Acme Corp", status: "published", generatedAt: "2025-01-10" },
  { id: "3", name: "TCFD Climate Report", framework: "TCFD", company: "Beta Inc", status: "draft", generatedAt: "2025-01-08" },
  { id: "4", name: "CDP Response 2024", framework: "CDP", company: "Acme Corp", status: "draft", generatedAt: "2025-01-05" },
];

export default function ReportsPage() {
  const t = useTranslations();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboard.nav.reports")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and manage ESG compliance reports
          </p>
        </div>
        <Button className="font-semibold">
          <Plus className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {mockReports.map((report) => (
          <Card key={report.id} className="border-border/50 hover:border-primary/20 hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    <Globe className="mr-1 h-3 w-3" />
                    {report.framework}
                  </Badge>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    report.status === "published"
                      ? "text-brand-green bg-brand-green/10"
                      : "text-brand-gold bg-brand-gold/10"
                  }`}
                >
                  {report.status === "published" ? (
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                  ) : (
                    <FileText className="mr-1 h-3 w-3" />
                  )}
                  {report.status === "published" ? "Published" : "Draft"}
                </Badge>
              </div>
              <CardTitle className="text-base font-semibold mt-2">{report.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{report.company}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {report.generatedAt}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
