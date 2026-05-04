"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { companyApi } from "@/services/api";
import { Building2, Upload, BarChart3, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

interface OnboardingWizardProps {
  token: string;
  onComplete: () => void;
}

const STEPS = [
  { icon: Building2, title: "Create your company", desc: "Set up your company profile to start tracking ESG data." },
  { icon: Upload,    title: "Upload your first document", desc: "Upload sustainability reports, CSR documents, or any ESG data files." },
  { icon: BarChart3, title: "View your ESG score", desc: "Our AI will analyze your data and generate your first ESG score." },
];

export function OnboardingWizard({ token, onComplete }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState({ name: "", sector: "", country: "" });
  const [error, setError] = useState("");

  const handleCreateCompany = async () => {
    if (!company.name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await companyApi.create(token, company);
      setStep(1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create company");
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToUpload = () => {
    router.push("/dashboard/upload");
    onComplete();
  };

  const handleGoToDashboard = () => {
    onComplete();
  };

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden" hideClose>
        {/* Progress bar */}
        <div className="flex h-1.5 w-full bg-muted">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-full transition-all duration-500"
              style={{
                width: `${100 / STEPS.length}%`,
                backgroundColor: i <= step ? "var(--primary)" : "transparent",
              }}
            />
          ))}
        </div>

        <div className="p-8">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                  i < step ? "border-primary bg-primary text-primary-foreground" :
                  i === step ? "border-primary text-primary" :
                  "border-border text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? "bg-primary" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          {/* Step 0 — Create Company */}
          {step === 0 && (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Welcome to ESG360! 👋</h2>
                <p className="text-sm text-muted-foreground mt-2">Let's set up your company profile to get started.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Company Name *</Label>
                  <Input placeholder="e.g. Acme Corp" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Sector</Label>
                    <Input placeholder="e.g. Technology" value={company.sector} onChange={(e) => setCompany({ ...company, sector: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country</Label>
                    <Input placeholder="e.g. Brazil" value={company.country} onChange={(e) => setCompany({ ...company, country: e.target.value })} />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button className="w-full mt-6 font-semibold" onClick={handleCreateCompany} disabled={loading || !company.name.trim()}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                Create Company & Continue
              </Button>
            </div>
          )}

          {/* Step 1 — Upload */}
          {step === 1 && (
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 mb-4">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Upload your ESG data</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-8">
                Upload sustainability reports, CSR documents, or spreadsheets. Our AI will extract and classify your ESG data automatically.
              </p>
              <div className="flex flex-col gap-3">
                <Button className="font-semibold" onClick={handleSkipToUpload}>
                  <Upload className="mr-2 h-4 w-4" />
                  Go to Upload
                </Button>
                <Button variant="ghost" className="text-sm text-muted-foreground" onClick={() => setStep(2)}>
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — Done */}
          {step === 2 && (
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">You're all set! 🎉</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-8">
                Your company is created. Upload documents to generate your first AI-powered ESG report.
              </p>
              <Button className="font-semibold w-full" onClick={handleGoToDashboard}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
