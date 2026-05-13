"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Brain,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Timer,
  Activity,
  FileText,
  BarChart3,
  Tags,
  Filter,
  RefreshCw,
  TrendingUp,
  Gauge,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/services/api";

type AIRequestStatus = "success" | "error";

interface AILogEntry {
  id: string;
  timestamp?: string;
  created_at?: string;
  user: string;
  function_name?: string;
  status: AIRequestStatus;
  latency_ms?: number;
  tokens_total?: number;
  model?: string;
  error_message?: string;
}

interface AILogsResponse {
  items: AILogEntry[];
  total: number;
  stats: {
    success_rate: number;
    total_tokens: number;
    avg_latency_ms: number;
  };
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  extraction: { label: "Extraction", icon: FileText, color: "text-brand-blue", bg: "bg-brand-blue/10" },
  classification: { label: "Classification", icon: Tags, color: "text-brand-gold", bg: "bg-brand-gold/10" },
  scoring: { label: "Scoring", icon: BarChart3, color: "text-brand-green", bg: "bg-brand-green/10" },
  report: { label: "Report", icon: Activity, color: "text-primary", bg: "bg-primary/10" },
  default: { label: "AI", icon: Brain, color: "text-violet-600", bg: "bg-violet-500/10" },
};

export default function AILogsPage() {
  const t = useTranslations();
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AIRequestStatus>("all");
  const [data, setData] = useState<AILogsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await adminApi.listAILogs(token, {
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 100,
      }) as AILogsResponse;
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [token, statusFilter]);

  const filteredLogs = (data?.items || []).filter((log) => {
    const nameMatch = (log.user ?? "").toLowerCase().includes(search.toLowerCase());
    const idMatch = (log.id ?? "").includes(search);
    return nameMatch || idMatch;
  });

  const statsData = data?.stats;
  const totalRequests = data?.total ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-brand-gold" />
            {t("admin.nav.aiLogs")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor AI processing requests and performance metrics
          </p>
        </div>
        <Button variant="outline" className="font-medium" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-blue/10">
                <Zap className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "—" : totalRequests.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.totalRequests")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-gold/10">
                <Timer className="h-5 w-5 text-brand-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loading ? "—" : statsData ? `${Math.round(statsData.avg_latency_ms)}ms` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.avgResponseTime")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-green/10">
                <Gauge className="h-5 w-5 text-brand-green" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loading ? "—" : statsData ? `${Math.round(statsData.success_rate)}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.successRate")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loading ? "—" : statsData ? statsData.total_tokens.toLocaleString() : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.tokensUsed")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base">{t("dashboard.recentAiRequests")}</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mr-1">Status:</span>
              {(["all", "success", "error"] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="text-xs h-7"
                >
                  {status === "all" ? "All" : status === "success" ? "Success" : "Error"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">{t("dashboard.tableTimestamp")}</TableHead>
                    <TableHead className="font-semibold">{t("dashboard.tableUser")}</TableHead>
                    <TableHead className="font-semibold text-center">{t("dashboard.tableFunction")}</TableHead>
                    <TableHead className="font-semibold text-center">{t("dashboard.tableStatus")}</TableHead>
                    <TableHead className="font-semibold text-center">{t("dashboard.tableLatency")}</TableHead>
                    <TableHead className="font-semibold text-right">{t("dashboard.tableTokens")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const typeKey = (log.function_name ?? "").toLowerCase();
                    const config = typeConfig[typeKey] ?? typeConfig.default;
                    const ts = log.timestamp ?? log.created_at ?? "";
                    const displayTs = ts ? new Date(ts).toLocaleString() : "—";
                    return (
                      <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-mono text-muted-foreground">{displayTs}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{log.user ?? "—"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={`${config.color} ${config.bg}`}>
                            <config.icon className="mr-1 h-3 w-3" />
                            {log.function_name ?? config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {log.status === "success" ? (
                            <Badge variant="secondary" className="text-brand-green bg-brand-green/10">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-destructive bg-destructive/10">
                              <XCircle className="mr-1 h-3 w-3" />
                              Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-mono">
                            {log.latency_ms != null ? `${log.latency_ms}ms` : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-mono text-muted-foreground">
                            {(log.tokens_total ?? 0).toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No AI logs found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
