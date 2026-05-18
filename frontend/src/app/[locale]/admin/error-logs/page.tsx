"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Trash2, Loader2, AlertTriangle, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminExtApi } from "@/services/api";

interface ErrorLog {
  id: string;
  severity: string;
  message: string;
  stack_trace?: string;
  endpoint?: string;
  method?: string;
  user_id?: string;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
}

const MOCK_ERRORS: ErrorLog[] = [
  { id: "1", severity: "error", message: "Database connection timeout after 30s", endpoint: "/api/v1/reports", method: "POST", resolved: false, created_at: new Date().toISOString() },
  { id: "2", severity: "critical", message: "Stripe webhook signature verification failed", endpoint: "/api/v1/stripe/webhook", method: "POST", resolved: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "3", severity: "warning", message: "Redis cache miss rate above 50% threshold", endpoint: "/api/v1/dashboard", method: "GET", resolved: true, resolved_at: new Date().toISOString(), created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: "4", severity: "error", message: "AI model rate limit exceeded (429)", endpoint: "/api/v1/esg-ai/analyze", method: "POST", resolved: false, created_at: new Date(Date.now() - 14400000).toISOString() },
];

const SEVERITY_COLORS: Record<string, string> = {
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  critical: "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200",
};

export default function AdminErrorLogsPage() {
  const t = useTranslations("admin");
  const { token } = useAuth();
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("");
  const [resolvedFilter, setResolvedFilter] = useState("");
  const [selected, setSelected] = useState<ErrorLog | null>(null);

  useEffect(() => {
    if (!token) return;
    adminExtApi.getErrorLogs(token)
      .then((res) => { const r = res as { items?: ErrorLog[] }; setLogs(r.items ?? (res as unknown as ErrorLog[])); })
      .catch(() => setLogs(MOCK_ERRORS))
      .finally(() => setLoading(false));
  }, [token]);

  const handleResolve = async (id: string) => {
    try {
      await adminExtApi.resolveErrorLog(token!, id);
    } catch { /* ignore */ }
    setLogs((prev) => prev.map((l) => l.id === id ? { ...l, resolved: true, resolved_at: new Date().toISOString() } : l));
    if (selected?.id === id) setSelected((p) => p ? { ...p, resolved: true } : null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("errorLogs.confirmDelete"))) return;
    try {
      await adminExtApi.deleteErrorLog(token!, id);
    } catch { /* ignore */ }
    setLogs((prev) => prev.filter((l) => l.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = logs.filter(
    (l) =>
      (!severityFilter || l.severity === severityFilter) &&
      (resolvedFilter === "" || l.resolved === (resolvedFilter === "true"))
  );

  const unresolvedCount = logs.filter((l) => !l.resolved).length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {t("errorLogs.title")}
          {unresolvedCount > 0 && (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs">{unresolvedCount} {t("errorLogs.unresolved")}</Badge>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("errorLogs.subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("errorLogs.allSeverities")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("errorLogs.allSeverities")}</SelectItem>
            {["warning", "error", "critical"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("errorLogs.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("errorLogs.allStatuses")}</SelectItem>
            <SelectItem value="false">{t("errorLogs.open")}</SelectItem>
            <SelectItem value="true">{t("errorLogs.resolved")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("errorLogs.col.severity")}</TableHead>
                  <TableHead>{t("errorLogs.col.message")}</TableHead>
                  <TableHead>{t("errorLogs.col.endpoint")}</TableHead>
                  <TableHead>{t("errorLogs.col.status")}</TableHead>
                  <TableHead>{t("errorLogs.col.date")}</TableHead>
                  <TableHead className="w-28">{t("errorLogs.col.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 opacity-40 text-green-500" />
                      {t("errorLogs.noErrors")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((log) => (
                    <TableRow key={log.id} className={!log.resolved ? "bg-red-50/30 dark:bg-red-900/5" : ""}>
                      <TableCell>
                        <Badge className={`text-xs ${SEVERITY_COLORS[log.severity] || ""}`}>
                          {log.severity === "critical" && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {log.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate" title={log.message}>{log.message}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {log.method && <span className="text-primary mr-1">{log.method}</span>}
                        {log.endpoint || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${log.resolved ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
                          {log.resolved ? t("errorLogs.resolved") : t("errorLogs.open")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelected(log)} title={t("errorLogs.view")}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {!log.resolved && (
                            <Button variant="ghost" size="icon" onClick={() => handleResolve(log.id)} title={t("errorLogs.resolve")}>
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Badge className={`text-xs ${SEVERITY_COLORS[selected.severity] || ""}`}>{selected.severity}</Badge>
                {t("errorLogs.detail")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase">{t("errorLogs.col.message")}</p>
                <p className="mt-1 font-medium">{selected.message}</p>
              </div>
              {selected.endpoint && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{t("errorLogs.col.endpoint")}</p>
                  <code className="mt-1 text-xs font-mono bg-muted px-2 py-1 rounded block">
                    {selected.method} {selected.endpoint}
                  </code>
                </div>
              )}
              {selected.stack_trace && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase">{t("errorLogs.stackTrace")}</p>
                  <pre className="mt-1 text-xs font-mono bg-muted p-3 rounded overflow-x-auto max-h-48">
                    {selected.stack_trace}
                  </pre>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase">{t("errorLogs.col.date")}</p>
                <p className="mt-1">{new Date(selected.created_at).toLocaleString("pt-BR")}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {!selected.resolved && (
                <Button size="sm" onClick={() => handleResolve(selected.id)}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  {t("errorLogs.resolve")}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setSelected(null)}>
                {t("common.close")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
