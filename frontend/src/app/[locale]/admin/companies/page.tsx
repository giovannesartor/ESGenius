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
  Building2,
  Search,
  Pencil,
  Trash2,
  Eye,
  Crown,
  Briefcase,
  Globe,
  TrendingUp,
  Users,
  Filter,
} from "lucide-react";

type PlanType = "Professional" | "Enterprise";

interface Company {
  id: string;
  name: string;
  sector: string;
  country: string;
  plan: PlanType;
  esgScore: number;
  users: number;
  status: "active" | "inactive";
}

const mockCompanies: Company[] = [
  {
    id: "1",
    name: "EcoTech Solutions",
    sector: "Technology",
    country: "Brazil",
    plan: "Enterprise",
    esgScore: 82,
    users: 14,
    status: "active",
  },
  {
    id: "2",
    name: "Green Mining Corp",
    sector: "Mining & Metals",
    country: "Chile",
    plan: "Professional",
    esgScore: 65,
    users: 8,
    status: "active",
  },
  {
    id: "3",
    name: "Sustainable Finance AG",
    sector: "Financial Services",
    country: "Germany",
    plan: "Enterprise",
    esgScore: 91,
    users: 22,
    status: "active",
  },
  {
    id: "4",
    name: "AgroVerde Ltda",
    sector: "Agriculture",
    country: "Portugal",
    plan: "Professional",
    esgScore: 58,
    users: 5,
    status: "active",
  },
  {
    id: "5",
    name: "Pacific Energy Inc",
    sector: "Energy",
    country: "USA",
    plan: "Enterprise",
    esgScore: 73,
    users: 18,
    status: "active",
  },
];

function getScoreColor(score: number): string {
  if (score >= 80) return "text-brand-green";
  if (score >= 60) return "text-brand-gold";
  return "text-destructive";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-brand-green/10";
  if (score >= 60) return "bg-brand-gold/10";
  return "bg-destructive/10";
}

export default function CompaniesAdminPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | PlanType>("all");

  const filteredCompanies = mockCompanies.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.sector.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "all" || c.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const avgScore = Math.round(
    mockCompanies.reduce((sum, c) => sum + c.esgScore, 0) / mockCompanies.length
  );
  const totalUsers = mockCompanies.reduce((sum, c) => sum + c.users, 0);
  const enterpriseCount = mockCompanies.filter((c) => c.plan === "Enterprise").length;
  const professionalCount = mockCompanies.filter((c) => c.plan === "Professional").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-brand-green" />
            {t("admin.nav.companies")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage registered companies and their subscription plans
          </p>
        </div>
        <Button className="font-semibold">
          <Building2 className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-green/10">
                <Building2 className="h-5 w-5 text-brand-green" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockCompanies.length}</p>
                <p className="text-xs text-muted-foreground">Total Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-gold/10">
                <Crown className="h-5 w-5 text-brand-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enterpriseCount}</p>
                <p className="text-xs text-muted-foreground">Enterprise Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-brand-blue/10">
                <Briefcase className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <p className="text-2xl font-bold">{professionalCount}</p>
                <p className="text-xs text-muted-foreground">Professional Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgScore}</p>
                <p className="text-xs text-muted-foreground">Avg ESG Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter + Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">All Companies</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={planFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlanFilter("all")}
                  className="text-xs"
                >
                  All
                </Button>
                <Button
                  variant={planFilter === "Enterprise" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlanFilter("Enterprise")}
                  className="text-xs"
                >
                  Enterprise
                </Button>
                <Button
                  variant={planFilter === "Professional" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlanFilter("Professional")}
                  className="text-xs"
                >
                  Professional
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Company Name</TableHead>
                  <TableHead className="font-semibold">Sector</TableHead>
                  <TableHead className="font-semibold">Country</TableHead>
                  <TableHead className="font-semibold text-center">Plan</TableHead>
                  <TableHead className="font-semibold text-center">ESG Score</TableHead>
                  <TableHead className="font-semibold text-center">Users</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-brand-green/10 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-brand-green" />
                        </div>
                        <span className="font-medium text-sm">{company.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.sector}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        {company.country}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {company.plan === "Enterprise" ? (
                        <Badge className="bg-brand-gold/10 text-brand-gold border-brand-gold/20">
                          <Crown className="mr-1 h-3 w-3" />
                          Enterprise
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Briefcase className="mr-1 h-3 w-3" />
                          Professional
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`${getScoreColor(company.esgScore)} ${getScoreBg(company.esgScore)}`}>
                        {company.esgScore}/100
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {company.users}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCompanies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No companies found matching your search.
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
