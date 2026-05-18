"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Coins, Banknote, ArrowRight, BookOpen, Leaf } from "lucide-react";

export default function CompaniesSolutionPage() {
  const t = useTranslations();
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4">
              <Building2 className="mr-1 size-3" /> {t("solutionsCompanies.badge")}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {t("solutionsCompanies.h1")}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("solutionsCompanies.sub")}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button asChild>
                <Link href="/register">{t("solutionsCompanies.ctaStart")} <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/manifesto">{t("solutionsCompanies.ctaManifesto")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Pillar icon={<Coins className="size-6 text-amber-500" />} title={t("solutionsCompanies.pillar1Title")} desc={t("solutionsCompanies.pillar1Desc")} />
            <Pillar icon={<Banknote className="size-6 text-emerald-500" />} title={t("solutionsCompanies.pillar2Title")} desc={t("solutionsCompanies.pillar2Desc")} />
            <Pillar icon={<Leaf className="size-6 text-green-600" />} title={t("solutionsCompanies.pillar3Title")} desc={t("solutionsCompanies.pillar3Desc")} />
            <Pillar icon={<BookOpen className="size-6 text-violet-500" />} title={t("solutionsCompanies.pillar4Title")} desc={t("solutionsCompanies.pillar4Desc")} />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">{t("solutionsCompanies.workflowTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Step n={1} title={t("solutionsCompanies.step1Title")} desc={t("solutionsCompanies.step1Desc")} />
            <Step n={2} title={t("solutionsCompanies.step2Title")} desc={t("solutionsCompanies.step2Desc")} />
            <Step n={3} title={t("solutionsCompanies.step3Title")} desc={t("solutionsCompanies.step3Desc")} />
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t("solutionsCompanies.crossTitle")}</h2>
            <p className="mt-3 text-muted-foreground">{t("solutionsCompanies.crossSub")}</p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/solutions/finance">{t("solutionsCompanies.crossCta")} <ArrowRight className="ml-2 size-4" /></Link>
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
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{n}</span>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
    </Card>
  );
}
