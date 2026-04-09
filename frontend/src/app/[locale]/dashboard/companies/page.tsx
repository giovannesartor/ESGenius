"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { companyApi } from "@/services/api";
import { Building2, Plus, Search, MapPin, Users, ArrowRight, Loader2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  sector?: string;
  country?: string;
  size?: string;
  esg_score?: number;
}

export default function CompaniesPage() {
  const t = useTranslations();
  const { token } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;
    companyApi
      .list(token)
      .then((data) => setCompanies(data as Company[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.sector?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dashboard.nav.companies")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("dashboard.companiesSubtitle")}
          </p>
        </div>
        <Link href="/dashboard/companies/new">
          <Button className="font-semibold">
            <Plus className="mr-2 h-4 w-4" />
            {t("dashboard.newCompany")}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("dashboard.searchCompanies")}
          className="pl-10 h-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">{t("dashboard.noCompaniesTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              {t("dashboard.noCompaniesDesc")}
            </p>
            <Link href="/dashboard/companies/new">
              <Button className="font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                {t("dashboard.createCompany")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <Link key={company.id} href={`/dashboard/companies/${company.id}`}>
              <Card className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    {company.esg_score && (
                      <Badge variant="secondary" className="text-xs font-bold">
                        ESG: {company.esg_score}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{company.name}</h3>
                  <div className="space-y-1.5 mt-3">
                    {company.sector && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {company.sector}
                      </div>
                    )}
                    {company.country && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {company.country}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-4 text-xs text-primary font-medium">
                    {t("dashboard.viewDetails")} <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
