"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Upload as UploadIcon,
  Search,
  Filter,
  Eye,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  status: "processing" | "completed" | "failed";
  company: string;
  uploadedAt: string;
  pages?: number;
}

const mockDocuments: Document[] = [
  { id: "1", name: "Annual Sustainability Report 2024.pdf", type: "PDF", status: "completed", company: "Acme Corp", uploadedAt: "2025-01-15", pages: 84 },
  { id: "2", name: "Carbon Emissions Data Q4.xlsx", type: "Excel", status: "completed", company: "Acme Corp", uploadedAt: "2025-01-12", pages: 12 },
  { id: "3", name: "Social Impact Assessment.pdf", type: "PDF", status: "processing", company: "Beta Inc", uploadedAt: "2025-01-10", pages: 45 },
  { id: "4", name: "Governance Policy 2025.docx", type: "Word", status: "completed", company: "Acme Corp", uploadedAt: "2025-01-08", pages: 22 },
  { id: "5", name: "Supply Chain Audit Report.pdf", type: "PDF", status: "failed", company: "Beta Inc", uploadedAt: "2025-01-05", pages: 0 },
];

const statusConfig = {
  processing: { icon: Loader2, label: "Processing", className: "text-brand-gold bg-brand-gold/10", spin: true },
  completed: { icon: CheckCircle2, label: "Completed", className: "text-brand-green bg-brand-green/10", spin: false },
  failed: { icon: AlertCircle, label: "Failed", className: "text-destructive bg-destructive/10", spin: false },
};

export default function DocumentsPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");

  const filtered = mockDocuments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboard.nav.documents")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage uploaded ESG documents
          </p>
        </div>
        <Button className="font-semibold">
          <UploadIcon className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-10 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="h-10">
          <Filter className="mr-2 h-3.5 w-3.5" />
          Filter
        </Button>
      </div>

      {/* Document List */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {filtered.length} documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {filtered.map((doc) => {
              const status = statusConfig[doc.status];
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
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{doc.company}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {doc.uploadedAt}
                      </span>
                      {doc.pages ? (
                        <span className="text-xs text-muted-foreground">{doc.pages} pages</span>
                      ) : null}
                    </div>
                  </div>
                  <Badge variant="secondary" className={`text-xs ${status.className}`}>
                    <StatusIcon className={`mr-1 h-3 w-3 ${status.spin ? "animate-spin" : ""}`} />
                    {status.label}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
