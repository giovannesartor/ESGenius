"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { usePartnerAuth } from "../layout";

interface Scenario {
  key: string;
  icon: string;
  title: string;
  description: string;
  script: (refCode: string) => string;
}

const SCENARIOS: Scenario[] = [
  {
    key: "captacao_investimento",
    icon: "💰",
    title: "Captação de Investimento",
    description: "Para empresas que precisam atrair investidores ESG.",
    script: (ref) =>
      `Olá! Trabalho com consultoria ESG e queria compartilhar uma ferramenta que ajuda empresas a melhorar seu score ESG e reduzir o WACC para captação de recursos.

A plataforma ESG360 gera relatórios completos com análise de risco climático, prontidão para funding e avaliação de impacto financeiro das práticas ESG.

Investidores ESG exigem dados estruturados — e a ESG360 entrega exatamente isso.

Quer uma demo gratuita? Acesse: https://esg360.digital/ref/${ref}`,
  },
  {
    key: "compliance_regulatorio",
    icon: "📋",
    title: "Compliance Regulatório",
    description: "Para empresas preocupadas com regulações CSRD, SEC, CVM.",
    script: (ref) =>
      `Boa tarde! Com as novas exigências da CSRD e regulações da CVM para disclosure ESG, muitas empresas estão correndo para se adequar.

A ESG360 automatiza a coleta e estruturação dos dados necessários para relatórios GRI, TCFD e outros frameworks — reduzindo meses de trabalho para dias.

Posso mostrar como funciona em 15 minutos? Link para começar: https://esg360.digital/ref/${ref}`,
  },
  {
    key: "reducao_risco",
    icon: "🛡️",
    title: "Redução de Risco Climático",
    description: "Para empresas expostas a riscos físicos e de transição.",
    script: (ref) =>
      `Olá! Você já mapeou o impacto do risco climático nas suas operações?

A ESG360 oferece análise de cenários IPCC (1.5°C, 2°C, 4°C) com estimativa de VaR físico e de transição — dados essenciais para diretores de risco e CFOs.

Empresas que identificam e comunicam esses riscos têm spread de crédito menor e acesso a linhas verdes. Vale a pena conhecer: https://esg360.digital/ref/${ref}`,
  },
  {
    key: "relatorio_esg",
    icon: "📊",
    title: "Geração de Relatório ESG",
    description: "Para empresas que precisam do primeiro relatório ESG.",
    script: (ref) =>
      `Oi! Muitas empresas ainda não têm um relatório ESG estruturado — e isso está afetando acesso a crédito, licitações e parcerias.

A ESG360 gera o primeiro relatório em horas, com dados organizados, score calculado e recomendações de melhoria. Custo muito menor que consultoria tradicional.

Vou te mandar o link para explorar: https://esg360.digital/ref/${ref}`,
  },
  {
    key: "benchmarking_setor",
    icon: "📈",
    title: "Benchmarking Setorial",
    description: "Para empresas que querem saber onde estão em relação ao setor.",
    script: (ref) =>
      `Boa tarde! Você sabe como sua empresa se compara às concorrentes em ESG?

A ESG360 tem dados setoriais para benchmark — assim você vê exatamente onde está e o que melhorar para ficar acima da média. Isso é especialmente importante na hora de conversar com investidores ou grandes clientes.

Confira: https://esg360.digital/ref/${ref}`,
  },
];

const MATERIALS = [
  { title: "One-pager ESG360 (PDF)", description: "Apresentação executiva da plataforma", href: "#" },
  { title: "Comparativo de Frameworks", description: "GRI vs TCFD vs CSRD", href: "#" },
  { title: "Calculadora ROI ESG", description: "Estimativa de impacto financeiro", href: "#" },
];

export default function PartnerMarketingPage() {
  const t = useTranslations("partner");
  const { partner } = usePartnerAuth();
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0].key);
  const [copied, setCopied] = useState<string | null>(null);

  const refCode = partner?.ref_code || "ESGP-XXXX";
  const scenario = SCENARIOS.find((s) => s.key === activeScenario) || SCENARIOS[0];

  const copyScript = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("marketing.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("marketing.subtitle")}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Scenario selector */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">{t("marketing.scenarios")}</p>
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveScenario(s.key)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                activeScenario === s.key
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:bg-muted text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{s.icon}</span>
                <span className="text-sm font-medium">{s.title}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Script */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {scenario.icon} {scenario.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{scenario.description}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">WhatsApp / E-mail</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="text-sm whitespace-pre-wrap font-sans text-foreground/90 bg-muted rounded-lg p-4 leading-relaxed">
                  {scenario.script(refCode)}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => copyScript(scenario.script(refCode), scenario.key)}
                >
                  {copied === scenario.key ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1.5 text-xs">{copied === scenario.key ? t("marketing.copied") : t("marketing.copy")}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Materials */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("marketing.materials")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MATERIALS.map((m) => (
                  <div key={m.title} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-colors">
                    <div>
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={m.href} target="_blank" rel="noopener noreferrer">{t("marketing.download")}</a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
