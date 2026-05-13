"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Loader2, BookOpen, ChevronDown, ChevronRight, Leaf, Users, Scale, CheckCircle2, Circle } from "lucide-react";
import { frameworkApi } from "@/services/api";

interface Indicator {
  id: string;
  name: string;
  code: string;
  description?: string;
  unit?: string;
  is_required: boolean;
}

interface Category {
  id: string;
  name: string;
  code: string;
  pillar: string;
  description?: string;
  indicators: Indicator[];
}

interface Framework {
  id: string;
  name: string;
  code: string;
  description?: string;
  version?: string;
  is_active: boolean;
  categories: Category[];
}

const pillarMeta: Record<string, { icon: typeof Leaf; color: string; bg: string; labelKey: string }> = {
  E: { icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50", labelKey: "dashboard.pillars.environmental" },
  S: { icon: Users, color: "text-blue-600", bg: "bg-blue-50", labelKey: "dashboard.pillars.social" },
  G: { icon: Scale, color: "text-purple-600", bg: "bg-purple-50", labelKey: "dashboard.pillars.governance" },
};

export default function FrameworksPage() {
  const t = useTranslations();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // We need a token — use AuthContext directly since frameworkApi is public
  useEffect(() => {
    // Frameworks endpoint is public, no token needed
    const fetchFrameworks = async () => {
      try {
        const list = (await frameworkApi.list("")) as { id: string; name: string; code: string; description?: string; version?: string; is_active: boolean }[];
        if (!list?.length) {
          setLoading(false);
          return;
        }
        // Fetch full details for each framework
        const full = await Promise.all(
          list.map((f) => frameworkApi.get("", f.id).catch(() => null))
        );
        setFrameworks(full.filter(Boolean) as Framework[]);
        // Expand the first framework by default
        if (list[0]) setExpanded({ [list[0].id]: true });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchFrameworks();
  }, []);

  const toggleFramework = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleCategory = (id: string) => setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("dashboard.nav.frameworks")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dashboard.frameworksExplore")}
        </p>
      </div>

      {/* Summary bar */}
      {frameworks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{frameworks.length}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.activeFrameworks")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{frameworks.reduce((s, f) => s + f.categories.length, 0)}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.totalCategories")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <Circle className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {frameworks.reduce((s, f) => s + f.categories.reduce((cs, c) => cs + c.indicators.length, 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.totalIndicators")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Frameworks list */}
      {frameworks.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">{t("dashboard.noFrameworksTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("dashboard.noFrameworksDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {frameworks.map((fw) => {
            const isExpanded = expanded[fw.id];
            const totalIndicators = fw.categories.reduce((s, c) => s + c.indicators.length, 0);
            const requiredCount = fw.categories.reduce((s, c) => s + c.indicators.filter((i) => i.is_required).length, 0);

            // Group categories by pillar
            const pillars = ["E", "S", "G"];
            const byPillar = pillars.reduce<Record<string, Category[]>>((acc, p) => {
              acc[p] = fw.categories.filter((c) => c.pillar === p);
              return acc;
            }, {});

            return (
              <Card key={fw.id} className="border-border/50 overflow-hidden">
                {/* Framework header */}
                <button
                  onClick={() => toggleFramework(fw.id)}
                  className="w-full text-left px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-semibold text-foreground">{fw.name}</h2>
                          <Badge variant="outline" className="text-xs">{fw.code}</Badge>
                          {fw.version && <Badge variant="secondary" className="text-xs">v{fw.version}</Badge>}
                        </div>
                        {fw.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{fw.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{fw.categories.length} {t("dashboard.categoriesSuffix")}</span>
                        <span>·</span>
                        <span>{totalIndicators} {t("dashboard.indicatorsSuffix")}</span>
                        {requiredCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600">{requiredCount} {t("dashboard.requiredLabel")}</span>
                          </>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Pillar coverage bar */}
                  {!isExpanded && totalIndicators > 0 && (
                    <div className="mt-3 flex gap-1 h-1.5 rounded-full overflow-hidden">
                      {pillars.map((p) => {
                        const count = byPillar[p].reduce((s, c) => s + c.indicators.length, 0);
                        const pct = Math.round((count / totalIndicators) * 100);
                        if (!pct) return null;
                        const colors: Record<string, string> = { E: "bg-emerald-500", S: "bg-blue-500", G: "bg-purple-500" };
                        return <div key={p} className={`${colors[p]} h-full`} style={{ width: `${pct}%` }} />;
                      })}
                    </div>
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-6 pb-6 space-y-4">
                    <Separator />
                    {pillars.map((pillar) => {
                      const cats = byPillar[pillar];
                      if (!cats.length) return null;
                      const meta = pillarMeta[pillar];
                      const PillarIcon = meta.icon;
                      const pillarIndicators = cats.reduce((s, c) => s + c.indicators.length, 0);

                      return (
                        <div key={pillar}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`p-1.5 rounded-lg ${meta.bg}`}>
                              <PillarIcon className={`h-3.5 w-3.5 ${meta.color}`} />
                            </div>
                            <h3 className="text-sm font-semibold">{t(meta.labelKey)}</h3>
                            <Badge variant="secondary" className="text-xs">{cats.length} {t("dashboard.categoriesSuffix")} · {pillarIndicators} {t("dashboard.indicatorsSuffix")}</Badge>
                          </div>

                          <div className="space-y-2">
                            {cats.map((cat) => {
                              const catKey = `${fw.id}-${cat.id}`;
                              const isCatExpanded = expandedCats[catKey];
                              const reqCount = cat.indicators.filter((i) => i.is_required).length;
                              return (
                                <div key={cat.id} className="rounded-lg border border-border/50 overflow-hidden">
                                  <button
                                    onClick={() => toggleCategory(catKey)}
                                    className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-sm font-medium truncate">{cat.name}</span>
                                      <Badge variant="outline" className="text-xs shrink-0">{cat.code}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs text-muted-foreground">{cat.indicators.length} {t("dashboard.indicatorsSuffix")}</span>
                                      {reqCount > 0 && (
                                        <span className="text-xs text-amber-600">{reqCount} req.</span>
                                      )}
                                      {isCatExpanded ? (
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                      )}
                                    </div>
                                  </button>

                                  {isCatExpanded && cat.indicators.length > 0 && (
                                    <div className="border-t border-border/50 divide-y divide-border/30">
                                      {cat.indicators.map((ind) => (
                                        <div key={ind.id} className="flex items-start gap-3 px-4 py-2.5">
                                          {ind.is_required ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                          ) : (
                                            <Circle className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-sm font-medium">{ind.name}</span>
                                              <span className="text-xs text-muted-foreground font-mono">{ind.code}</span>
                                              {ind.unit && (
                                                <Badge variant="secondary" className="text-xs">{ind.unit}</Badge>
                                              )}
                                              {ind.is_required && (
                                                <Badge className="text-xs bg-amber-50 text-amber-700 border-amber-200">{t("dashboard.requiredLabel")}</Badge>
                                              )}
                                            </div>
                                            {ind.description && (
                                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ind.description}</p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
