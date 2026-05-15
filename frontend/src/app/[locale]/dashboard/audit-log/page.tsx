"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/useCompany";
import { auditApi } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollText, Search } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  description?: string | null;
  user_id?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export default function AuditLogPage() {
  const { token } = useAuth();
  const { company } = useCompany();
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !company?.id) return;
    auditApi.list(token, company.id, { limit: 200 })
      .then((d) => setItems(d as AuditEntry[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token, company?.id]);

  const filtered = filter
    ? items.filter((i) =>
        (i.action + " " + (i.description || "") + " " + (i.entity_type || ""))
          .toLowerCase().includes(filter.toLowerCase())
      )
    : items;

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-emerald-500" /> Audit Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Immutable record of all user and system actions.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={filter} onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by action, entity, description..." className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No log entries.</div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((e) => (
                <div key={e.id} className="px-4 py-3 hover:bg-muted/40 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono text-[10px]">{e.action}</Badge>
                    {e.entity_type && <Badge variant="secondary" className="text-[10px]">{e.entity_type}</Badge>}
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {new Date(e.created_at).toLocaleString()}
                    </span>
                  </div>
                  {e.description && <p className="mt-1 text-muted-foreground">{e.description}</p>}
                  {e.ip_address && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">{e.ip_address}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
