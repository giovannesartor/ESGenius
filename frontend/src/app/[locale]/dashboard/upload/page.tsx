"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCompany } from "@/hooks/useCompany";
import { documentApi } from "@/services/api";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
  Loader2,
  Building2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  errorMsg?: string;
}

export default function UploadPage() {
  const t = useTranslations();
  const { company, loading: companyLoading, token } = useCompany();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = Array.from(fileList).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      file: f,
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      status: "pending" as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadAll = async () => {
    if (!token || !company) return;
    setUploading(true);

    const pendingFiles = files.filter((f) => f.status === "pending");

    for (const uploadFile of pendingFiles) {
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "uploading" as const, progress: 30 } : f))
      );

      try {
        await documentApi.upload(token, company.id, uploadFile.file);
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "done" as const, progress: 100 } : f))
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: "error" as const, progress: 0, errorMsg } : f
          )
        );
      }
    }

    setUploading(false);
  };

  if (companyLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No company found</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Create a company first to upload documents.
          </p>
          <Link href="/dashboard/companies/new">
            <Button className="font-semibold">Create Company</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingCount = files.filter((f) => f.status === "pending").length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.nav.upload")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload ESG documents for AI-powered analysis — <span className="font-medium text-foreground">{company.name}</span>
        </p>
      </div>

      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border/50 hover:border-primary/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-2xl bg-primary/10 mb-4">
            <CloudUpload className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Drop your files here
          </h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            Supports PDF, Excel, Word, and CSV files up to 50MB each
          </p>
          <label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.docx,.csv"
              className="hidden"
              onChange={handleFileInput}
            />
            <Button variant="outline" className="font-semibold cursor-pointer" asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                Browse Files
              </span>
            </Button>
          </label>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </CardTitle>
              {pendingCount > 0 && (
                <Button
                  size="sm"
                  className="font-semibold"
                  onClick={uploadAll}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-3.5 w-3.5" />
                  )}
                  Upload {pendingCount > 1 ? `All (${pendingCount})` : ""}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{file.size}</span>
                      {file.status === "uploading" && (
                        <Progress value={file.progress} className="h-1.5 w-24" />
                      )}
                    </div>
                  </div>
                  {file.status === "done" ? (
                    <Badge variant="secondary" className="text-xs text-emerald-600 bg-emerald-50">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Done
                    </Badge>
                  ) : file.status === "error" ? (
                    <Badge variant="secondary" className="text-xs text-destructive bg-destructive/10">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Error
                    </Badge>
                  ) : file.status === "uploading" ? (
                    <Badge variant="secondary" className="text-xs">
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Uploading
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Pending</Badge>
                  )}
                  {file.status !== "uploading" && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supported Formats */}
      <div className="flex flex-wrap gap-2">
        {[".pdf", ".xlsx", ".xls", ".docx", ".csv"].map((ext) => (
          <Badge key={ext} variant="outline" className="text-xs font-mono">
            {ext}
          </Badge>
        ))}
      </div>
    </div>
  );
}
