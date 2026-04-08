"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCompany } from "@/hooks/useCompany";
import { documentApi } from "@/services/api";
import {
  FileText,
  Upload as UploadIcon,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
} from "lucide-react";

interface Document {
  id: string;
  original_filename: string;
  file_type?: string;
  status: string;
  created_at: string;
  page_count?: number;
}

const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; className: string; spin?: boolean }> = {
  processing: { icon: Loader2, label: "Processing", className: "text-amber-600 bg-amber-50", spin: true },
  processed: { icon: CheckCircle2, label: "Completed", className: "text-emerald-600 bg-emerald-50" },
  completed: { icon: CheckCircle2, label: "Completed", className: "text-emerald-600 bg-emerald-50" },
  failed: { icon: AlertCircle, label: "Failed", className: "text-destructive bg-destructive/10" },
  uploaded: { icon: Clock, label: "Uploaded", className: "text-blue-600 bg-blue-50" },
};

export default function DocumentsPage() {
  const t = useTranslations();
  const { company, loading: companyLoading, token } = useCompany();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token || !company) return;
    documentApi
      .list(token, company.id)
      .then((data) => setDocuments((data as Document[]) || []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [token, company]);

  const filtered = documents.filter(
    (d) => d.original_filename.toLowerCase().includes(search.toLowerCase())
  );

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
          <h3 className="text-lg font-semibold mb-2">No company found</h3>
          <p className="text-sm text-muted-foreground mb-6">Create a company first.</p>
          <Link href="/dashboard/companies/new">
            <Button className="font-semibold">Create Company</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboard.nav.documents")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage uploaded ESG documents — <span className="font-medium text-foreground">{company.name}</span>
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button className="font-semibold">
            <UploadIcon className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          className="pl-10 h-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Document List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No documents yet</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Upload your first ESG document to get started
            </p>
            <Link href="/dashboard/upload">
              <Button className="font-semibold">
                <UploadIcon className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {filtered.map((doc) => {
                const status = statusConfig[doc.status] || statusConfig.uploaded;
                const StatusIcon = status.icon;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {doc.original_filename}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        {doc.page_count ? (
                          <span className="text-xs text-muted-foreground">{doc.page_count} pages</span>
                        ) : null}
                      </div>
                    </div>
                    <Badge variant="secondary" className={`text-xs ${status.className}`}>
                      <StatusIcon className={`mr-1 h-3 w-3 ${status.spin ? "animate-spin" : ""}`} />
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
