"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Landmark, Calculator, Thermometer, ArrowRight, ScrollText } from "lucide-react";

export default function FinanceSolutionPage() {
  const t = useTranslations();
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4">
              <Landmark className="mr-1 size-3" /> {t("solutionsFinance.badge")}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {t("solutionsFinance.h1")}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("solutionsFinance.sub")}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button asChild>
                <Link href="/register">{t("solutionsFinance.ctaDemo")} <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/developers">{t("solutionsFinance.ctaApi")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Pillar icon={<Briefcase className="size-6 text-blue-500" />} title={t("solutionsFinance.pillar1Title")} desc={t("solutionsFinance.pillar1Desc")} />
            <Pillar icon={<Landmark className="size-6 text-indigo-500" />} title={t("solutionsFinance.pillar2Title")} desc={t("solutionsFinance.pillar2Desc")} />
            <Pillar icon={<Calculator className="size-6 text-violet-500" />} title={t("solutionsFinance.pillar3Title")} desc={t("solutionsFinance.pillar3Desc")} />
            <Pillar icon={<Thermometer className="size-6 text-orange-500" />} title={t("solutionsFinance.pillar4Title")} desc={t("solutionsFinance.pillar4Desc")} />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">{t("solutionsFinance.workflowTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Step icon={<ScrollText className="size-5" />} title={t("solutionsFinance.step1Title")} desc={t("solutionsFinance.step1Desc")} />
            <Step icon={<Calculator className="size-5" />} title={t("solutionsFinance.step2Title")} desc={t("solutionsFinance.step2Desc")} />
            <Step icon={<ArrowRight className="size-5" />} title={t("solutionsFinance.step3Title")} desc={t("solutionsFinance.step3Desc")} />
          </div>
        </section>

        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t("solutionsFinance.crossTitle")}</h2>
            <p className="mt-3 text-muted-foreground">{t("solutionsFinance.crossSub")}</p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/solutions/companies">{t("solutionsFinance.crossCta")} <ArrowRight className="ml-2 size-4" /></Link>
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
