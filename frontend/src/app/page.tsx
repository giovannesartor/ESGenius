"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold text-sm">E</div>
            <span className="text-xl font-bold text-gray-900">ESGenius</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            AI-Powered ESG Management
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Your ESG data,{" "}
            <span className="text-green-600">simplified</span>
          </h1>
          <p className="mb-10 text-lg text-gray-600 max-w-2xl mx-auto">
            Collect, analyze, and report ESG data with AI-powered extraction.
            Map to GRI, SASB, and TCFD frameworks automatically.
            Generate audit-ready reports in minutes.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-green-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-green-700 transition"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-6 text-left shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-lg">📊</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">AI Data Extraction</h3>
            <p className="text-sm text-gray-600">
              Upload PDFs, spreadsheets, and documents. Our AI extracts and classifies ESG data automatically.
            </p>
          </div>
          <div className="rounded-xl border bg-white p-6 text-left shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 text-lg">🎯</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Framework Mapping</h3>
            <p className="text-sm text-gray-600">
              Automatically map your data to GRI, SASB, and TCFD frameworks with gap analysis.
            </p>
          </div>
          <div className="rounded-xl border bg-white p-6 text-left shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 text-lg">📋</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Audit-Ready Reports</h3>
            <p className="text-sm text-gray-600">
              Generate comprehensive ESG reports with scoring, insights, and compliance tracking.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white px-6 py-8 mt-20">
        <div className="mx-auto max-w-7xl text-center text-sm text-gray-500">
          © 2026 ESGenius. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
