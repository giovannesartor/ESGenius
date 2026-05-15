"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, KeyRound, Webhook, Rocket } from "lucide-react";

const CURL = `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.esg360.digital/api/v1/public/v1/companies/COMPANY_ID/financial-score`;

const PY = `import requests

headers = {"Authorization": "Bearer YOUR_API_KEY"}
r = requests.get(
  "https://api.esg360.digital/api/v1/public/v1/companies/COMPANY_ID/financial-score",
  headers=headers,
)
print(r.json())`;

const NODE = `const res = await fetch(
  "https://api.esg360.digital/api/v1/public/v1/companies/COMPANY_ID/financial-score",
  { headers: { Authorization: \`Bearer \${process.env.ESG360_API_KEY}\` } },
);
console.log(await res.json());`;

const EMBED = `<iframe
  src="https://api.esg360.digital/api/v1/embed/score/COMPANY_ID.html?theme=dark"
  width="320" height="220" style="border:0;border-radius:12px"
  title="ESG Financial Score">
</iframe>`;

export default function DevelopersPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4">Developers</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            ESG360 Public API
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            One REST endpoint, one widget. Wire ESG financial intelligence into your CRM,
            credit underwriting, treasury, or investor portal.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Feature icon={<KeyRound className="size-5" />} title="Bearer auth" desc="API keys are hashed at rest. Scope per endpoint." />
          <Feature icon={<Webhook className="size-5" />} title="Stable schemas" desc="Versioned at /public/v1. Deprecations with 12-month notice." />
          <Feature icon={<Rocket className="size-5" />} title="Free tier" desc="1k requests/month for prototyping. No credit card." />
        </div>

        <Section title="Get a financial score" icon={<Code2 className="size-5" />}>
          <Snippet lang="bash" code={CURL} />
          <Snippet lang="python" code={PY} />
          <Snippet lang="javascript" code={NODE} />
        </Section>

        <Section title="Embeddable widget" icon={<Code2 className="size-5" />}>
          <p className="mb-3 text-sm text-muted-foreground">
            Drop a self-contained badge into any page — IR site, prospectus, fund factsheet.
          </p>
          <Snippet lang="html" code={EMBED} />
        </Section>

        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Available endpoints</CardTitle>
            <CardDescription>Public read-only surface (more being added)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <Endpoint method="GET" path="/public/v1/companies/{id}/financial-score" desc="Latest composite score, bps, rating band, components" />
              <Endpoint method="GET" path="/public/v1/companies/{id}/climate-risk" desc="All scenarios for a 5y horizon" />
              <Endpoint method="GET" path="/public/v1/health" desc="Liveness check" />
              <Endpoint method="GET" path="/embed/score/{id}.html" desc="Embeddable HTML widget (no auth)" />
              <Endpoint method="GET" path="/embed/score/{id}.json" desc="Embeddable JSON snippet (no auth)" />
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
    </Card>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">{icon} {title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Snippet({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-muted">
      <div className="flex items-center justify-between border-b bg-background/50 px-3 py-1 text-xs text-muted-foreground">
        <span>{lang}</span>
      </div>
      <pre className="overflow-x-auto p-3 text-xs"><code>{code}</code></pre>
    </div>
  );
}

function Endpoint({ method, path, desc }: { method: string; path: string; desc: string }) {
  return (
    <li className="flex flex-col gap-2 rounded border p-3 md:flex-row md:items-center">
      <Badge className="w-fit">{method}</Badge>
      <code className="flex-1 truncate text-xs">{path}</code>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </li>
  );
}
