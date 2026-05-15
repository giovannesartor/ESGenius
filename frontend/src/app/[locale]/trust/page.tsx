"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, FileCheck, KeyRound, ServerCog, Eye, ScrollText, Globe2 } from "lucide-react";

export default function TrustPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4">Trust &amp; security</Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Built for institutional finance.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            ESG360 is the financial intelligence infrastructure for sustainability.
            Designed from day one for the controls, audit trails and data residency
            required by banks, asset managers and listed companies.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Pillar icon={<Shield className="size-6 text-emerald-500" />} title="SOC 2 Type II (in progress)" desc="Independent audit of controls covering security, availability and confidentiality." />
          <Pillar icon={<FileCheck className="size-6 text-blue-500" />} title="ISO 27001 roadmap" desc="ISMS aligned to ISO/IEC 27001:2022 with documented risk assessments." />
          <Pillar icon={<Globe2 className="size-6 text-violet-500" />} title="GDPR &amp; LGPD ready" desc="Data subject rights, processor agreements, EU+BR data residency options." />
          <Pillar icon={<Lock className="size-6 text-amber-500" />} title="Encryption everywhere" desc="TLS 1.3 in transit, AES-256 at rest, customer-managed keys on Enterprise." />
          <Pillar icon={<KeyRound className="size-6 text-pink-500" />} title="RBAC &amp; SSO" desc="Role-based access, SAML/OIDC SSO, scoped API keys per integration." />
          <Pillar icon={<ScrollText className="size-6 text-orange-500" />} title="Immutable audit log" desc="Every action — including AI calls — is signed, timestamped and queryable." />
          <Pillar icon={<ServerCog className="size-6 text-cyan-500" />} title="Multi-region deploy" desc="EU, US, Brazil regions; pinned data residency by contract." />
          <Pillar icon={<Eye className="size-6 text-red-500" />} title="Vulnerability disclosure" desc="Coordinated disclosure program at security@esg360.digital." />
        </div>

        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Security posture</CardTitle>
            <CardDescription>Our current control framework</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Item label="Authentication" value="Email+password (Argon2id), Google SSO, optional SAML/OIDC, password policies." />
            <Item label="Authorization" value="Per-company role model (owner / admin / member / viewer) + superadmin." />
            <Item label="Secrets" value="Stored in managed secret store; no secrets in repo or environment dumps." />
            <Item label="Backups" value="Daily encrypted PostgreSQL snapshots with 30-day retention." />
            <Item label="Monitoring" value="Structured logs, error tracking, uptime monitoring, on-call rotation." />
            <Item label="Subprocessors" value="Listed publicly with version-controlled changelog." />
            <Item label="AI providers" value="Multi-provider router (Anthropic, OpenAI, DeepSeek). PII redaction on by default." />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function Pillar({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{desc}</CardContent>
    </Card>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b py-2 last:border-0 md:flex-row md:items-center md:gap-4">
      <span className="w-44 shrink-0 font-medium">{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}
