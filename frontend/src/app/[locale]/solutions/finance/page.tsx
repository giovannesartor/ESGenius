"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Landmark, Calculator, Thermometer, ArrowRight, ScrollText } from "lucide-react";

export default function FinanceSolutionPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4">
              <Landmark className="mr-1 size-3" /> For banks &amp; investors
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              ESG, priced in basis points.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Decision-grade ESG analytics for credit teams, portfolio managers and
              capital markets desks. From sentiment to spread, with the audit trail you need.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button asChild>
                <Link href="/register">Request demo <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/developers">See the API</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Pillar icon={<Briefcase className="size-6 text-blue-500" />} title="Portfolio Intelligence" desc="Weighted ESG score, climate VaR, sector breakdown, top &amp; bottom contributors." />
            <Pillar icon={<Landmark className="size-6 text-indigo-500" />} title="Credit Intelligence" desc="ESG-adjusted PD &amp; LGD per counterparty. Book impact on expected loss." />
            <Pillar icon={<Calculator className="size-6 text-violet-500" />} title="Valuation Impact" desc="ESG-adjusted WACC, beta, terminal growth, enterprise value via two-stage DCF." />
            <Pillar icon={<Thermometer className="size-6 text-orange-500" />} title="Climate Risk" desc="NGFS &amp; IEA scenarios with full methodology and explainability." />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">Built for institutional workflows</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Step icon={<ScrollText className="size-5" />} title="Audit trail" desc="Every score, every AI call, every override — signed and queryable." />
            <Step icon={<Calculator className="size-5" />} title="Methodology disclosure" desc="Open formulas. No black boxes. Defendable in front of regulators." />
            <Step icon={<ArrowRight className="size-5" />} title="API + widgets" desc="REST endpoints with bearer auth. Embed scores in your CRM or research notes." />
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Are you a company?</h2>
            <p className="mt-3 text-muted-foreground">
              Same platform, different door — disclosure, funding readiness, materiality.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/solutions/companies">Go to companies edition <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Pillar({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">{icon}<CardTitle className="text-base">{title}</CardTitle></div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
    </Card>
  );
}

function Step({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">{icon}<CardTitle className="text-lg">{title}</CardTitle></div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
    </Card>
  );
}
