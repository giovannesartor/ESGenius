"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { dashboardApi, companyApi } from "@/services/api";
import Link from "next/link";

interface Company {
  id: string;
  name: string;
  slug: string;
  sector?: string;
  country?: string;
}

interface Scores {
  overall: number;
  environmental: number;
  social: number;
  governance: number;
  completeness: number;
  consistency: number;
  total_data_points: number;
  validated_data_points: number;
  flagged_data_points: number;
}

export default function DashboardPage() {
  const { user, token, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [scores, setScores] = useState<Scores | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (token) {
      loadCompanies();
    }
  }, [token]);

  useEffect(() => {
    if (token && selectedCompany) {
      loadScores(selectedCompany.id);
    }
  }, [token, selectedCompany]);

  const loadCompanies = async () => {
    if (!token) return;
    try {
      const data = await companyApi.list(token) as Company[];
      setCompanies(data);
      if (data.length > 0) {
        setSelectedCompany(data[0]);
      }
    } catch {
      console.error("Failed to load companies");
    }
  };

  const loadScores = async (companyId: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await dashboardApi.getScores(token, companyId) as Scores;
      setScores(data);
    } catch {
      setScores(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  const ScoreCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value.toFixed(1)}</p>
      <div className="mt-2 h-2 rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color.replace("text-", "bg-")}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold text-sm">E</div>
            <span className="text-xl font-bold text-gray-900">ESGenius</span>
            {selectedCompany && (
              <select
                value={selectedCompany.id}
                onChange={(e) => setSelectedCompany(companies.find(c => c.id === e.target.value) || null)}
                className="ml-4 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.full_name}</span>
            <button
              onClick={logout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {companies.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ESGenius!</h2>
            <p className="text-gray-600 mb-6">Get started by creating your first company.</p>
            <Link
              href="/dashboard/companies/new"
              className="inline-block rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition"
            >
              Create Company
            </Link>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <nav className="mb-8 flex gap-6 border-b">
              {["Overview", "Data", "Documents", "Reports", "Audit", "Settings"].map((tab) => (
                <button
                  key={tab}
                  className={`pb-3 text-sm font-medium transition ${
                    tab === "Overview"
                      ? "border-b-2 border-green-600 text-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* Scores Overview */}
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ESG Scores</h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
              </div>
            ) : scores ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <ScoreCard label="Overall ESG Score" value={scores.overall} color="text-green-600" />
                <ScoreCard label="Environmental" value={scores.environmental} color="text-blue-600" />
                <ScoreCard label="Social" value={scores.social} color="text-amber-600" />
                <ScoreCard label="Governance" value={scores.governance} color="text-purple-600" />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No scoring data available. Start by adding ESG data points.
              </div>
            )}

            {/* Stats */}
            {scores && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Total Data Points</p>
                  <p className="text-2xl font-bold text-gray-900">{scores.total_data_points}</p>
                </div>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Validated</p>
                  <p className="text-2xl font-bold text-green-600">{scores.validated_data_points}</p>
                </div>
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Flagged Issues</p>
                  <p className="text-2xl font-bold text-red-600">{scores.flagged_data_points}</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button className="rounded-xl border bg-white p-4 text-left shadow-sm hover:border-green-300 transition">
                <p className="font-medium text-gray-900">Add ESG Data</p>
                <p className="text-sm text-gray-500">Manual data entry</p>
              </button>
              <button className="rounded-xl border bg-white p-4 text-left shadow-sm hover:border-green-300 transition">
                <p className="font-medium text-gray-900">Upload Document</p>
                <p className="text-sm text-gray-500">PDF, CSV, XLSX</p>
              </button>
              <button className="rounded-xl border bg-white p-4 text-left shadow-sm hover:border-green-300 transition">
                <p className="font-medium text-gray-900">Generate Report</p>
                <p className="text-sm text-gray-500">PDF or DOCX</p>
              </button>
              <button className="rounded-xl border bg-white p-4 text-left shadow-sm hover:border-green-300 transition">
                <p className="font-medium text-gray-900">Run Audit</p>
                <p className="text-sm text-gray-500">Check data quality</p>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
