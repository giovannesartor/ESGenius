"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { companyApi, dashboardApi, documentApi } from "@/services/api";
import {
  Building2,
  ArrowLeft,
  MapPin,
  Users,
  FileText,
  BarChart3,
  Upload,
  Loader2,
  Calendar,
  TrendingUp,
  Leaf,
  Scale,
  Shield,
  UserPlus,
  Trash2,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  sector?: string;
  country?: string;
  size?: string;
  created_at?: string;
}

interface DashboardScores {
  overall_score: number;
  environmental_score: number;
  social_score: number;
  governance_score: number;
  total_data_points: number;
}

interface Document {
  id: string;
  original_filename: string;
  status: string;
  created_at: string;
}

interface Member {
  user_id: string;
  full_name?: string;
  email: string;
  role: string;
}

export default function CompanyDetailPage() {
  const t = useTranslations();
  const router = useRouter();
  const { token, user } = useAuth();
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [scores, setScores] = useState<DashboardScores | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("viewer");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !companyId) return;

    const fetchData = async () => {
      try {
        const [companyData, scoresData, docsData, membersData] = await Promise.allSettled([
          companyApi.get(token, companyId),
          dashboardApi.getScores(token, companyId),
          documentApi.list(token, companyId),
          companyApi.listMembers(token, companyId),
        ]);

        if (companyData.status === "fulfilled") {
          setCompany(companyData.value as Company);
        } else {
          setError(t("dashboard.companyNotFound"));
          return;
        }

        if (scoresData.status === "fulfilled") {
          setScores(scoresData.value as DashboardScores);
        }

        if (docsData.status === "fulfilled") {
          setDocuments((docsData.value as Document[]) || []);
        }

        if (membersData.status === "fulfilled") {
          setMembers((membersData.value as Member[]) || []);
        }
      } catch {
        setError(t("dashboard.failedLoadCompany"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <h2 className="text-lg font-semibold mb-2">{error || t("dashboard.companyNotFound")}</h2>
          <Button variant="outline" onClick={() => router.push("/dashboard/companies")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("dashboard.backToCompanies")}
          </Button>
        </div>
      </div>
    );
  }

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const scoreBg = (score: number) => {
    if (score >= 75) return "bg-emerald-50";
    if (score >= 50) return "bg-amber-50";
    return "bg-red-50";
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim() || !token) return;
    setAddingMember(true);
    setMemberError(null);
    try {
      await companyApi.addMember(token, companyId, { email: memberEmail.trim(), role: memberRole });
      const updated = await companyApi.listMembers(token, companyId);
      setMembers((updated as Member[]) || []);
      setMemberEmail("");
      setMemberRole("viewer");
    } catch {
      setMemberError(t("dashboard.failedAddMember"));
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!token) return;
    try {
      await companyApi.removeMember(token, companyId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch {
      // silently fail — member list will refresh on next load
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/companies")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("dashboard.nav.companies")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {company.sector && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {company.sector}
                </div>
              )}
              {company.country && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {company.country}
                </div>
              )}
              {company.size && (
                <Badge variant="secondary" className="text-xs">{company.size}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/upload?company=${companyId}`}>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              {t("dashboard.uploadDocument")}
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* ESG Scores */}
      {scores && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${scoreBg(scores.overall_score)}`}>
                  <TrendingUp className={`h-4 w-4 ${scoreColor(scores.overall_score)}`} />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{t("dashboard.overallEsg")}</span>
              </div>
              <p className={`text-3xl font-bold ${scoreColor(scores.overall_score)}`}>
                {scores.overall_score.toFixed(1)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <Leaf className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{t("dashboard.environmentalLabel")}</span>
              </div>
              <p className={`text-3xl font-bold ${scoreColor(scores.environmental_score)}`}>
                {scores.environmental_score.toFixed(1)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Scale className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{t("dashboard.socialLabel")}</span>
              </div>
              <p className={`text-3xl font-bold ${scoreColor(scores.social_score)}`}>
                {scores.social_score.toFixed(1)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{t("dashboard.governanceLabel")}</span>
              </div>
              <p className={`text-3xl font-bold ${scoreColor(scores.governance_score)}`}>
                {scores.governance_score.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats + Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Points */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {t("dashboard.dataSummary")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">{t("dashboard.totalDataPoints")}</span>
                <span className="text-sm font-semibold">{scores?.total_data_points ?? 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">{t("dashboard.documentsUploaded")}</span>
                <span className="text-sm font-semibold">{documents.length}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">{t("dashboard.createdLabel")}</span>
                <span className="text-sm font-semibold">
                  {company.created_at
                    ? new Date(company.created_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {t("dashboard.recentDocuments")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">{t("dashboard.noDocumentsTitle")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.original_filename}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={doc.status === "processed" ? "default" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {t("dashboard.teamMembers")}
            {members.length > 0 && (
              <Badge variant="secondary" className="ml-1">{members.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add member form */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="colleague@company.com"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              className="flex-1 h-9 text-sm"
            />
            <Select value={memberRole} onValueChange={setMemberRole}>
              <SelectTrigger className="w-32 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t("dashboard.memberRoleAdmin")}</SelectItem>
                <SelectItem value="viewer">{t("dashboard.memberRoleViewer")}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAddMember} disabled={addingMember || !memberEmail.trim()}>
              {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              <span className="ml-2">{t("dashboard.addMemberBtn")}</span>
            </Button>
          </div>
          {memberError && <p className="text-xs text-destructive">{memberError}</p>}

          {/* Member list */}
          {members.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{t("dashboard.noTeamMembers")}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 divide-y divide-border/50">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {(m.full_name || m.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      {m.full_name && <p className="text-sm font-medium truncate">{m.full_name}</p>}
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                    {m.user_id !== user?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("dashboard.removeMemberTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("dashboard.removeMemberDesc")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleRemoveMember(m.user_id)}
                            >
                              {t("dashboard.removeMemberAction")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
