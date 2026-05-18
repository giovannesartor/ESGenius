"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Loader2, Activity } from "lucide-react";

interface AuditEntry {
  id: string;
  user_email?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  changes?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

const MOCK_ENTRIES: AuditEntry[] = [
  { id: "1", user_email: "admin@esg360.digital", action: "user.suspend", resource_type: "User", resource_id: "abc123", ip_address: "192.168.1.1", created_at: new Date().toISOString() },
  { id: "2", user_email: "admin@esg360.digital", action: "company.create", resource_type: "Company", resource_id: "def456", ip_address: "192.168.1.1", created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "3", user_email: "admin@esg360.digital", action: "coupon.create", resource_type: "Coupon", resource_id: "ghi789", ip_address: "192.168.1.1", created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: "4", user_email: "user@natura.com", action: "report.generate", resource_type: "Report", resource_id: "jkl012", ip_address: "10.0.0.45", created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: "5", user_email: "admin@esg360.digital", action: "partner.approve", resource_type: "Partner", resource_id: "mno345", ip_address: "192.168.1.1", created_at: new Date(Date.now() - 86400000).toISOString() },
];

const ACTION_COLORS: Record<string, string> = {
  "user.suspend": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "company.create": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "coupon.create": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "report.generate": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "partner.approve": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
};

export default function AdminAuditLogPage() {
  const t = useTranslations("admin");
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    setEntries(MOCK_ENTRIES);
    setLoading(false);
  }, []);

  const filtered = entries.filter(
    (e) =>
      (!search ||
        (e.user_email || "").toLowerCase().includes(search.toLowerCase()) ||
        e.action.toLowerCase().includes(search.toLowerCase())) &&
      (!actionFilter || e.action.startsWith(actionFilter))
  );

  const uniqueResources = [...new Set(entries.map((e) => e.resource_type || "").filter(Boolean))];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("auditLog.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("auditLog.subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("auditLog.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t("auditLog.allResources")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("auditLog.allResources")}</SelectItem>
            {uniqueResources.map((r) => <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>)}
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
                  <TableHead>{t("auditLog.col.timestamp")}</TableHead>
                  <TableHead>{t("auditLog.col.user")}</TableHead>
                  <TableHead>{t("auditLog.col.action")}</TableHead>
                  <TableHead>{t("auditLog.col.resource")}</TableHead>
                  <TableHead>{t("auditLog.col.ip")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      <Activity className="h-6 w-6 mx-auto mb-2 opacity-40" />
                      {t("auditLog.noEntries")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(e.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm">{e.user_email || "—"}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs font-mono ${ACTION_COLORS[e.action] || "bg-slate-100 text-slate-600"}`}>
                          {e.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {e.resource_type && <span>{e.resource_type}</span>}
                        {e.resource_id && <code className="ml-1 text-xs opacity-60">{e.resource_id.slice(0, 8)}…</code>}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">{e.ip_address || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
