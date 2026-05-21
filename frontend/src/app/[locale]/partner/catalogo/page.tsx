"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  FileSpreadsheet,
  FileBarChart2,
  Download,
  Eye,
  DollarSign,
  TrendingUp,
  Star,
  ChevronDown,
  ChevronUp,
  Leaf,
  Users,
  ShieldCheck,
  Zap,
  BarChart3,
  Target,
  Activity,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Deliverable {
  id: number;
  name: string;
  format: string;
  description: string;
  audience: string;
  sampleFile?: string;
  previewImage?: string;
  icon: React.ElementType;
  enterpriseOnly?: boolean;
  enterpriseUpgrade?: string; // diff vs profissional
}

// ─── Deliverables data ────────────────────────────────────────────────────────

const DELIVERABLES: Deliverable[] = [
  {
    id: 1,
    name: "Relatório Executivo",
    format: "PDF · 8–12 páginas",
    description:
      "Visão C-level do desempenho ESG: score composto E/S/G, semáforo de riscos prioritários e top 3 ações recomendadas. Feito para apresentar em board em menos de 10 minutos.",
    audience: "CEOs, CFOs, Boards",
    sampleFile: "/samples/profissional/01-Relatorio-Executivo.pdf",
    icon: FileText,
  },
  {
    id: 2,
    name: "Relatório de Divulgação Completo",
    format: "PDF · 60–120 páginas",
    description:
      "Disclosure indicador por indicador com dados rastreáveis, narrativas geradas por IA e alinhamento a GRI, SASB e TCFD. Auditável externamente.",
    audience: "Equipes de RI, Auditores, Reguladores",
    sampleFile: "/samples/profissional/02-Relatorio-Divulgacao-Completo.pdf",
    icon: FileText,
  },
  {
    id: 3,
    name: "Pacote de Dados Auditável",
    format: "XLSX · 200–400 data points",
    description:
      "Planilha estruturada com todos os dados coletados, fontes, datas e rastreabilidade para auditoria externa. Base de dados completa do relatório.",
    audience: "Equipes de Controladoria, Auditores",
    sampleFile: "/samples/profissional/03-Pacote-Dados-Auditavel.xlsx",
    icon: FileSpreadsheet,
  },
  {
    id: 4,
    name: "Trilha de Auditoria",
    format: "PDF · 5–10 páginas",
    description:
      "Log detalhado de cada decisão metodológica, fonte de dado e transformação aplicada — essencial para processos de verificação de terceira parte.",
    audience: "Auditores Externos, Compliance",
    sampleFile: "/samples/profissional/04-Trilha-Auditoria.pdf",
    icon: ShieldCheck,
  },
  {
    id: 5,
    name: "Inventário de Carbono GHG",
    format: "PDF + XLSX · Escopos 1, 2 e 3",
    description:
      "Inventário completo de emissões com separação por escopo, fatores de emissão, verificação Locator/Market-based para Scope 2 e trajetória SBTi.",
    audience: "Equipes de Sustentabilidade, Investidores",
    sampleFile: "/samples/profissional/05-Inventario-GHG.pdf",
    previewImage: "/samples/profissional/05-GHG-Trend.png",
    icon: Leaf,
    enterpriseUpgrade: "Enterprise inclui todas as 15 categorias do Scope 3 (GHG Protocol) + verificação Locator vs Market-based para Scope 2.",
  },
  {
    id: 6,
    name: "Plano de Ação OKR",
    format: "PDF · Roadmap estruturado",
    description:
      "Roadmap ESG com objetivos, key results, owners, prazos e KPIs de acompanhamento — priorizado por impacto e viabilidade. Transforma análise em accountability.",
    audience: "Lideranças, Equipes Operacionais",
    sampleFile: "/samples/profissional/06-Plano-Acao-OKR.pdf",
    icon: Target,
  },
  {
    id: 7,
    name: "Matriz de Materialidade",
    format: "PDF + PNG · Gráfico interativo",
    description:
      "Mapeamento e priorização dos temas ESG mais relevantes para o negócio e stakeholders. Base estratégica para toda a gestão ESG.",
    audience: "Boards, Equipes de Sustentabilidade",
    sampleFile: "/samples/profissional/07-Matriz-Materialidade.pdf",
    previewImage: "/samples/profissional/07-Matriz-Materialidade.png",
    icon: BarChart3,
    enterpriseUpgrade: "Enterprise inclui Dupla Materialidade (impacto financeiro + impacto em stakeholders), conforme exigido pela CSRD/ESRS.",
  },
  {
    id: 8,
    name: "Resumo Público para Stakeholders",
    format: "PDF · 2 páginas",
    description:
      "Versão resumida dos resultados ESG formatada para comunicação externa — ideal para site, relatório anual, investidores e LinkedIn.",
    audience: "Marketing, Comunicação, RI",
    sampleFile: "/samples/profissional/08-Resumo-Publico.pdf",
    icon: Users,
  },
  // Enterprise-only
  {
    id: 9,
    name: "Financial Intelligence Report",
    format: "PDF · 10–15 páginas",
    description:
      "Traduz o score ESG em spread de crédito (bps), delta de WACC setorial e impacto no enterprise value — linguagem que bancos, investidores e M&A entendem.",
    audience: "CFOs, Bancos, Equipes de M&A",
    sampleFile: "/samples/enterprise/09-Financial-Intelligence-Report.pdf",
    icon: TrendingUp,
    enterpriseOnly: true,
  },
  {
    id: 10,
    name: "Funding Readiness Assessment",
    format: "PDF + XLSX · Checklist por instrumento",
    description:
      "Avalia a prontidão da empresa para captar via SLL, green bond, IPO, M&A ou PE. Identifica gaps e entrega plano de remediação por instrumento.",
    audience: "CFOs, Investment Banks, Fundos de PE",
    sampleFile: "/samples/enterprise/10-Funding-Readiness-Assessment.pdf",
    icon: DollarSign,
    enterpriseOnly: true,
  },
  {
    id: 11,
    name: "Climate Risk Report",
    format: "PDF · 15–20 páginas",
    description:
      "Análise de risco climático com 3 cenários NGFS × 3 horizontes (2030, 2040, 2050). VaR físico e de transição quantificados em R$ — não é narrativa, é número.",
    audience: "CROs, Boards, Investidores Institucionais",
    sampleFile: "/samples/enterprise/11-Climate-Risk-Report.pdf",
    icon: Activity,
    enterpriseOnly: true,
  },
  {
    id: 12,
    name: "Curva MACC",
    format: "PDF + XLSX · 10+ medidas rankeadas",
    description:
      "Curva de Custo Marginal de Abatimento com cada medida de descarbonização rankeada por CAPEX, payback, NPV e breakeven de preço de carbono.",
    audience: "CFOs, Engenharia, Consultores de Clima",
    sampleFile: "/samples/enterprise/12-MACC-Curve.pdf",
    previewImage: "/samples/enterprise/12-MACC-Chart.png",
    icon: BarChart3,
    enterpriseOnly: true,
  },
];

const PROFESSIONAL_DELIVERABLES = DELIVERABLES.filter((d) => !d.enterpriseOnly);
const ENTERPRISE_DELIVERABLES = DELIVERABLES; // all 12

// ─── Commission Calculator ────────────────────────────────────────────────────

function CommissionCalculator() {
  const [profQty, setProfQty] = useState(1);
  const [entQty, setEntQty] = useState(0);
  const profCommission = 3750;
  const entCommission = 12000;
  const total = profQty * profCommission + entQty * entCommission;

  return (
    <Card className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-800/40">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-400" />
          <h3 className="font-semibold text-white">Calculadora de Comissão</h3>
        </div>
        <p className="text-sm text-slate-400">Simule seus ganhos mensais como parceiro</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-300 text-xs uppercase tracking-wide">
              Vendas Profissional / mês
            </Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={profQty}
              onChange={(e) => setProfQty(Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-slate-800/60 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500">$3.750 por venda</p>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 text-xs uppercase tracking-wide">
              Vendas Enterprise / mês
            </Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={entQty}
              onChange={(e) => setEntQty(Math.max(0, parseInt(e.target.value) || 0))}
              className="bg-slate-800/60 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500">$12.000 por venda</p>
          </div>
        </div>
        <Separator className="bg-slate-700" />
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-medium">Comissão total estimada</span>
          <span className="text-3xl font-bold text-emerald-400">
            ${total.toLocaleString("pt-BR")}
            <span className="text-sm text-slate-400 font-normal ml-1">/mês</span>
          </span>
        </div>
        <p className="text-xs text-slate-500">
          * Valores em USD. Comissão de 50% sobre preço de tabela. Paga via PIX em até 48h após confirmação do pagamento do cliente.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Deliverable Card ─────────────────────────────────────────────────────────

function DeliverableCard({
  deliverable,
  index,
  plan,
}: {
  deliverable: Deliverable;
  index: number;
  plan: "profissional" | "enterprise";
}) {
  const [expanded, setExpanded] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const Icon = deliverable.icon;
  const samplePath =
    plan === "enterprise" && !deliverable.enterpriseOnly
      ? deliverable.sampleFile?.replace("/profissional/", "/enterprise/")
      : deliverable.sampleFile;
  const previewPath =
    plan === "enterprise" && !deliverable.enterpriseOnly
      ? deliverable.previewImage?.replace("/profissional/", "/enterprise/")
      : deliverable.previewImage;

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden hover:border-emerald-700/50 transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
        >
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-950 border border-emerald-800/50 flex items-center justify-center text-xs font-bold text-emerald-400">
            {index + 1}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{deliverable.name}</p>
            <p className="text-xs text-muted-foreground">{deliverable.format}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {previewPath && (
              <Badge variant="outline" className="text-xs border-emerald-800/50 text-emerald-400 hidden sm:flex">
                Prévia
              </Badge>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/20">
            <p className="text-sm text-muted-foreground pt-3">{deliverable.description}</p>
            {deliverable.enterpriseUpgrade && plan === "enterprise" && (
              <div className="rounded-md bg-violet-950/40 border border-violet-800/30 px-3 py-2">
                <p className="text-xs text-violet-300">
                  <strong>Enterprise +</strong> {deliverable.enterpriseUpgrade}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {deliverable.audience}
              </Badge>
            </div>
            <div className="flex gap-2 flex-wrap">
              {previewPath && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver prévia
                </Button>
              )}
              {samplePath && (
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" asChild>
                  <a href={samplePath} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-3.5 w-3.5" />
                    Baixar exemplo
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {previewPath && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{deliverable.name} — Prévia</DialogTitle>
            </DialogHeader>
            <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-border">
              <Image
                src={previewPath}
                alt={`Prévia: ${deliverable.name}`}
                fill
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ─── Plan Panel ───────────────────────────────────────────────────────────────

function PlanPanel({
  plan,
  price,
  commission,
  deliverables,
  description,
  frameworks,
  badge,
  badgeVariant,
  highlight,
}: {
  plan: "profissional" | "enterprise";
  price: string;
  commission: string;
  deliverables: Deliverable[];
  description: string;
  frameworks: string[];
  badge: string;
  badgeVariant: "default" | "secondary";
  highlight?: boolean;
}) {
  return (
    <Card
      className={`flex flex-col h-full ${
        highlight
          ? "border-emerald-600/60 shadow-lg shadow-emerald-900/20"
          : "border-border"
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge
              variant={badgeVariant}
              className={
                highlight
                  ? "bg-emerald-900/60 text-emerald-300 border-emerald-700/50 mb-2"
                  : "mb-2"
              }
            >
              {badge}
            </Badge>
            <h2 className="text-xl font-bold capitalize">{plan}</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{price}</p>
            <p className="text-xs text-muted-foreground">por relatório ESG</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>

        {/* Commission highlight */}
        <div
          className={`rounded-lg px-4 py-3 flex items-center justify-between mt-2 ${
            highlight
              ? "bg-emerald-950/60 border border-emerald-800/40"
              : "bg-muted/50 border border-border"
          }`}
        >
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Você ganha por venda
            </p>
            <p
              className={`text-xl font-bold ${
                highlight ? "text-emerald-400" : "text-foreground"
              }`}
            >
              {commission}
            </p>
          </div>
          <Zap
            className={`h-6 w-6 ${highlight ? "text-emerald-500" : "text-muted-foreground"}`}
          />
        </div>

        {/* Frameworks */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {frameworks.map((fw) => (
            <Badge
              key={fw}
              variant="outline"
              className="text-xs font-normal border-border"
            >
              {fw}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">
            {deliverables.length} entregáveis inclusos
          </h3>
          <FileBarChart2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          {deliverables.map((d, i) => (
            <DeliverableCard
              key={d.id}
              deliverable={d}
              index={i}
              plan={plan}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogoPage() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-700/50 text-emerald-400 text-xs">
            Catálogo de Planos
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">O que você vende — e quanto ganha</h1>
        <p className="text-muted-foreground max-w-2xl">
          Cada plano entrega relatórios ESG reais, auditáveis e prontos para board, auditoria e
          investidores. Veja exatamente o que o cliente recebe, por que ele paga e quanto você
          embolsa em cada venda.
        </p>
      </div>

      {/* Commission banner */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-800/30 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-white">50% de comissão fixa em toda venda</p>
          <p className="text-sm text-slate-400 mt-0.5">
            Sem limite de clientes · Sem taxa de entrada · Pagamento via PIX em até 48h
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Profissional</p>
            <p className="text-lg font-bold text-emerald-400">$3.750</p>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Enterprise</p>
            <p className="text-lg font-bold text-emerald-400">$12.000</p>
          </div>
        </div>
      </div>

      {/* Preview images strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { src: "/samples/profissional/01-ESG-Score-Benchmark.png", label: "ESG Score Benchmark" },
          { src: "/samples/profissional/07-Matriz-Materialidade.png", label: "Matriz de Materialidade" },
          { src: "/samples/profissional/05-GHG-Trend.png", label: "Trajetória GHG" },
          { src: "/samples/enterprise/12-MACC-Chart.png", label: "Curva MACC (Enterprise)" },
        ].map(({ src, label }) => (
          <div
            key={src}
            className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted/30 group"
          >
            <Image
              src={src}
              alt={label}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p className="absolute bottom-2 left-2 text-xs text-white font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Plan panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <PlanPanel
          plan="profissional"
          price="$7.500"
          commission="$3.750"
          deliverables={PROFESSIONAL_DELIVERABLES}
          description="Ideal para empresas em crescimento que precisam estruturar relatórios ESG com consistência e credibilidade."
          frameworks={["GRI", "SASB", "TCFD"]}
          badge="Mais Vendido"
          badgeVariant="default"
          highlight={false}
        />
        <PlanPanel
          plan="enterprise"
          price="$24.000"
          commission="$12.000"
          deliverables={ENTERPRISE_DELIVERABLES}
          description="Para organizações que tratam ESG como área estratégica — disclosure completo + inteligência de capital para bancos e investidores."
          frameworks={["GRI", "SASB", "TCFD", "CDP", "CSRD", "ISSB", "CVM 193"]}
          badge="Maior Ticket"
          badgeVariant="secondary"
          highlight={true}
        />
      </div>

      {/* Commission calculator */}
      <CommissionCalculator />

      {/* Selling tips */}
      <div className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <h3 className="font-semibold">Dicas de venda por perfil de cliente</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-medium text-emerald-400">PMEs em crescimento</p>
            <p className="text-muted-foreground">
              Comece pelo Profissional. O argumento principal é acesso a crédito mais barato e
              diferenciação competitiva para licitações e cadeias de fornecimento que exigem ESG.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-violet-400">Empresas em captação</p>
            <p className="text-muted-foreground">
              Enterprise é o caminho. O Financial Intelligence Report e o Funding Readiness são os
              entregáveis que bancos e fundos de PE pedem antes de fechar SLL ou green bond.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-blue-400">Indústrias com metas de carbono</p>
            <p className="text-muted-foreground">
              O MACC e o Climate Risk (Enterprise) resolvem exatamente esse problema. Mostre os
              gráficos de exemplo — a MACC Curve fecha a conversa sozinha com o time de engenharia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
