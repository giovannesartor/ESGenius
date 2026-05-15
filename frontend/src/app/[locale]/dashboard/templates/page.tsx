"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { templatesApi } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Star, Crown } from "lucide-react";

interface Template {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sector?: string | null;
  region?: string | null;
  framework_codes: string[];
  language: string;
  is_premium: boolean;
  is_official: boolean;
  download_count: number;
  rating: number;
}

export default function TemplatesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    templatesApi.list(token, {})
      .then((d) => setItems(d as Template[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-6 space-y-4 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-emerald-500" /> Report Templates
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Official templates aligned with GRI, CSRD/ESRS, ISSB, CDP, B3 and CVM 193.
        </p>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
      {!loading && items.length === 0 && (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          No templates yet. Run <code>python seed_platform.py</code> to load the official set.
        </CardContent></Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((t) => (
          <Card key={t.id} className="hover:border-emerald-500/40 transition-colors">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{t.name}</h3>
                {t.is_premium && <Crown className="h-4 w-4 text-amber-500 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {t.framework_codes?.map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                ))}
                {t.region && <Badge variant="secondary" className="text-[10px]">{t.region}</Badge>}
                {t.sector && <Badge variant="secondary" className="text-[10px]">{t.sector}</Badge>}
                <Badge variant="outline" className="text-[10px] uppercase">{t.language}</Badge>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" /> {t.download_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" /> {t.rating.toFixed(1)}
                  </span>
                </div>
                <Button size="sm" variant="outline">Use template</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
