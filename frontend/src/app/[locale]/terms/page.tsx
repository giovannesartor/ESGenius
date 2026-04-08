"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function TermsPage() {
  const t = useTranslations("terms");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            {t("lastUpdated")}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            {/* 1 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">{t("s1Title")}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{t("s1Text")}</p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">{t("s2Title")}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{t("s2Text")}</p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">{t("s3Title")}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{t("s3Text")}</p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">{t("s4Title")}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{t("s4Text")}</p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">{t("s5Title")}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{t("s5Text")}</p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">{t("s6Title")}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{t("s6Text")}</p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-semibold text-foreground">{t("s7Title")}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{t("s7Text")}</p>
            </section>

            {/* Contact */}
            <section className="rounded-lg border border-border bg-muted/30 p-6">
              <h2 className="text-xl font-semibold text-foreground">{t("contactTitle")}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{t("contactText")}</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
