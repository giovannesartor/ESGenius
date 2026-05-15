"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { regulatoryApi } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe2, AlertTriangle, Calendar, ExternalLink } from "lucide-react";

interface RegItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  region?: string | null;
  framework_codes?: string[];
  severity?: string;
  effective_date?: string | null;
  deadline_date?: string | null;
  url?: string | null;
  published_at?: string;
}

const sevColor = (s?: string) => {
  if (s === "critical") return "bg-red-500/15 text-red-500 border-red-500/30";
  if (s === "warning") return "bg-amber-500/15 text-amber-500 border-amber-500/30";
  return "bg-blue-500/15 text-blue-500 border-blue-500/30";
};

export default function RegulatoryPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<RegItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    regulatoryApi.list(token, { limit: 50 })
      .then((data) => setItems(data as RegItem[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe2 className="h-6 w-6 text-emerald-500" /> Regulatory Updates
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ESG regulations, deadlines and guidance relevant to your operations.
        </p>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
      {!loading && items.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          No regulatory updates yet. Run the seed script to populate this feed.
        </CardContent></Card>
      )}

      <div className="space-y-3">
        {items.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={sevColor(r.severity)}>
                      {r.severity === "critical" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {r.severity || "info"}
                    </Badge>
                    {r.region && <Badge variant="secondary">{r.region}</Badge>}
                    {(r.framework_codes || []).map((c) => (
                      <Badge key={c} variant="outline">{c}</Badge>
                    ))}
                    <span className="text-[11px] text-muted-foreground">{r.source}</span>
                  </div>
                  <h3 className="font-semibold mt-2">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.summary}</p>
                </div>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="text-emerald-500 hover:text-emerald-400 shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              {(r.effective_date || r.deadline_date) && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/40">
                  {r.effective_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Effective: {r.effective_date}
                    </span>
                  )}
                  {r.deadline_date && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Calendar className="h-3 w-3" /> Deadline: {r.deadline_date}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
