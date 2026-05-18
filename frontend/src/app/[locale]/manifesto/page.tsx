"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";

export default function ManifestoPage() {
  const t = useTranslations("manifesto");

  const sections = [
    { titleKey: "s1Title", bodyKey: "s1Body" },
    { titleKey: "s2Title", bodyKey: "s2Body" },
    { titleKey: "s3Title", bodyKey: "s3Body" },
    { titleKey: "s4Title", bodyKey: "s4Body" },
    { titleKey: "s5Title", bodyKey: "s5Body" },
    { titleKey: "s6Title", bodyKey: "s6Body" },
    { titleKey: "s7Title", bodyKey: "s7Body" },
  ] as const;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <Badge variant="outline" className="mb-4">{t("badge")}</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          {t("intro")}
        </p>

        {sections.map(({ titleKey, bodyKey }) => (
          <section key={titleKey} className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight">{t(titleKey)}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{t(bodyKey)}</p>
          </section>
        ))}

        <p className="mt-12 border-t pt-8 text-sm text-muted-foreground">
          {t("signature")}
        </p>
      </main>
      <Footer />
    </div>
  );
}

