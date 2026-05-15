"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";

export default function ManifestoPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <Badge variant="outline" className="mb-4">Manifesto</Badge>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          ESG is the financial language of sustainability.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          For too long, sustainability has been a separate language — spoken in glossy
          reports, debated in side rooms, and bolted onto the financial statements as an
          afterthought. We reject that.
        </p>

        <Section title="1. ESG is finance.">
          Climate risk is credit risk. Carbon is a liability. A water-stressed asset is
          an impaired asset. Governance failures are P&amp;L events. The discipline of
          sustainability is the discipline of long-horizon valuation. Anything else is
          marketing.
        </Section>

        <Section title="2. Bps over badges.">
          A score is meaningless until it moves a basis point of spread, a euro of
          provision, or a multiple of EBITDA. Our default unit is the bps.
          If we cannot translate a metric into capital, we will not ship it.
        </Section>

        <Section title="3. Transparent by construction.">
          Black boxes lose audits and lose trust. Every score we produce ships with its
          formula, its inputs, its sources, and its uncertainty. No model is too clever
          to be opened.
        </Section>

        <Section title="4. Multi-framework or it didn't happen.">
          Brazilian CVM Resolution 193, EU CSRD &amp; ESRS, IFRS S1/S2, TCFD, SBTi, GRI,
          SASB — the frameworks are not in conflict; they are different views of the
          same reality. Our knowledge graph keeps them in sync so you don&apos;t have
          to.
        </Section>

        <Section title="5. AI with a paper trail.">
          Generative models are powerful and fallible. We use them where they help —
          extraction, drafting, translation — and we log every call, redact PII by
          default, and let you choose your provider and your jurisdiction.
        </Section>

        <Section title="6. Built for both sides of the table.">
          Companies need to disclose. Banks and investors need to decide. Both deserve
          the same primitives. ESG360 is one platform with two front doors and one
          source of truth.
        </Section>

        <Section title="7. Long-horizon by design.">
          We do not optimize for the next quarter. We build for the institutions and
          regulators that will still be here in 2050. That is a different software
          discipline — and it&apos;s the only one worth practicing.
        </Section>

        <p className="mt-12 border-t pt-8 text-sm text-muted-foreground">
          — The ESG360 team
        </p>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-3 leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}
