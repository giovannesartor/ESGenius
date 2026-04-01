"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

type AIRequestType = "extraction" | "classification" | "scoring" | "report";
type AIRequestStatus = "success" | "error";

interface AILogEntry {
  id: string;
  timestamp: string;
  user: string;
  type: AIRequestType;
  status: AIRequestStatus;
  duration: string;
  tokens: number;
  model: string;
}

const mockLogs: AILogEntry[] = [
  {
    id: "ai-001",
    timestamp: "2026-04-01 14:32:18",
    user: "Maria Silva",
    type: "extraction",
    status: "success",
    duration: "2.4s",
    tokens: 3420,
    model: "deepseek-v3",
  },
  {
    id: "ai-002",
    timestamp: "2026-04-01 14:28:05",
    user: "Carlos Mendes",
    type: "scoring",
    status: "success",
    duration: "1.8s",
    tokens: 2150,
    model: "deepseek-v3",
  },
  {
    id: "ai-003",
    timestamp: "2026-04-01 14:15:42",
    user: "Ana Costa",
    type: "report",
    status: "success",
    duration: "8.2s",
    tokens: 12840,
    model: "deepseek-v3",
  },
  {
    id: "ai-004",
    timestamp: "2026-04-01 13:58:11",
    user: "Lucas Oliveira",
    type: "classification",
    status: "error",
    duration: "0.3s",
    tokens: 0,
    model: "deepseek-v3",
  },
  {
    id: "ai-005",
    timestamp: "2026-04-01 13:45:33",
    user: "Sophie Weber",
    type: "extraction",
    status: "success",
    duration: "3.1s",
    tokens: 4200,
    model: "deepseek-v3",
  },
  {
    id: "ai-006",
    timestamp: "2026-04-01 13:30:20",
    user: "Pedro Santos",
    type: "scoring",
    status: "success",
    duration: "1.5s",
    tokens: 1980,
    model: "deepseek-v3",
  },
  {
    id: "ai-007",
    timestamp: "2026-04-01 13:12:08",
    user: "Maria Silva",
    type: "report",
    status: "error",
    duration: "12.1s",
    tokens: 8500,
    model: "deepseek-v3",
  },
  {
    id: "ai-008",
    timestamp: "2026-04-01 12:55:44",
    user: "Carlos Mendes",
    type: "classification",
    status: "success",
    duration: "0.9s",
    tokens: 1240,
    model: "deepseek-v3",
  },
];

const typeConfig: Record<AIRequestType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  extraction: { label: "Extraction", icon: FileText, color: "text-brand-blue", bg: "bg-brand-blue/10" },
  classification: { label: "Classification", icon: Tags, color: "text-brand-gold", bg: "bg-brand-gold/10" },
  scoring: { label: "Scoring", icon: BarChart3, color: "text-brand-green", bg: "bg-brand-green/10" },
  report: { label: "Report", icon: Activity, color: "text-primary", bg: "bg-primary/10" },
};

export default function AILogsPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | AIRequestType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AIRequestStatus>("all");

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch = log.user.toLowerCase().includes(search.toLowerCase()) || log.id.includes(search);
    const matchesType = typeFilter === "all" || log.type === typeFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalRequests = mockLogs.length;
  const successRate = Math.round((mockLogs.filter((l) => l.status === "success").length / totalRequests) * 100);
  const totalTokens = mockLogs.reduce((sum, l) => sum + l.tokens, 0);
  const avgDuration =
    (mockLogs.reduce((sum, l) => sum + parseFloat(l.duration), 0) / totalRequests).toFixed(1) + "s";

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
        <Button variant="outline" className="font-medium">
          <RefreshCw className="mr-2 h-4 w-4" />
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
                <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
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
                <p className="text-2xl font-bold">{avgDuration}</p>
                <p className="text-xs text-muted-foreground">Avg Response Time</p>
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
                <p className="text-2xl font-bold">{successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
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
                <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Tokens Used</p>
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
              <CardTitle className="text-base">Recent AI Requests</CardTitle>
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
              <span className="text-xs text-muted-foreground mr-1">Type:</span>
              {(["all", "extraction", "classification", "scoring", "report"] as const).map((type) => (
                <Button
                  key={type}
                  variant={typeFilter === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter(type)}
                  className="text-xs h-7"
                >
                  {type === "all" ? "All" : typeConfig[type].label}
                </Button>
              ))}
              <Separator orientation="vertical" className="h-4 mx-1" />
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
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Timestamp</TableHead>
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold text-center">Type</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold text-center">Duration</TableHead>
                  <TableHead className="font-semibold text-right">Tokens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const config = typeConfig[log.type];
                  return (
                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-mono text-muted-foreground">{log.timestamp}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{log.user}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={`${config.color} ${config.bg}`}>
                          <config.icon className="mr-1 h-3 w-3" />
                          {config.label}
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
                        <span className="text-sm font-mono">{log.duration}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-mono text-muted-foreground">
                          {log.tokens.toLocaleString()}
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
        </CardContent>
      </Card>
    </div>
  );
}
