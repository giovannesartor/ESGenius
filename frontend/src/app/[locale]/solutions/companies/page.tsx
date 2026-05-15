"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Coins, Banknote, ArrowRight, BookOpen, Leaf } from "lucide-react";

export default function CompaniesSolutionPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4">
              <Building2 className="mr-1 size-3" /> For companies
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Turn sustainability into cheaper capital.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Comply with CVM 193, CSRD, IFRS S1/S2 and TCFD on one platform — and
              translate every disclosure into a measurable funding advantage.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button asChild>
                <Link href="/register">Start free <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/manifesto">Read the manifesto</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Pillar icon={<Coins className="size-6 text-amber-500" />} title="Financial Score" desc="0-100 score with bps spread translation, rating band, percentile vs sector." />
            <Pillar icon={<Banknote className="size-6 text-emerald-500" />} title="Funding Readiness" desc="Self-assessment for SLL, green bond, IPO, M&A, PE — with remediation plan." />
            <Pillar icon={<Leaf className="size-6 text-green-600" />} title="Climate Risk" desc="NGFS &amp; IEA scenarios — physical and transition VaR with carbon price paths." />
            <Pillar icon={<BookOpen className="size-6 text-violet-500" />} title="Multi-framework" desc="One disclosure → CSRD/ESRS, IFRS, TCFD, CVM 193, SBTi, EU Taxonomy." />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">From upload to bond pricing</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Step n={1} title="Upload data &amp; documents" desc="PDFs, spreadsheets, ERP exports. AI extracts data points and maps to frameworks." />
            <Step n={2} title="See your score" desc="Composite ESG score, spread translation, peer percentile, top drivers." />
            <Step n={3} title="Engage capital markets" desc="Export ready-to-share decks, embed your score on your IR site, brief banks." />
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Are you on the buy-side?</h2>
            <p className="mt-3 text-muted-foreground">
              Same platform, different door — portfolio analytics, credit intelligence, valuation impact.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/solutions/finance">Go to finance edition <ArrowRight className="ml-2 size-4" /></Link>
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

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Step {n}</CardDescription>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
    </Card>
  );
}
