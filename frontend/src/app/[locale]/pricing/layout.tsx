import type { Metadata } from "next";

const BASE_URL = "https://esg360.digital";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const meta: Record<string, { title: string; description: string }> = {
    pt: {
      title: "Planos e Preços — ESG Automático com IA",
      description:
        "Escolha o plano ESG360 ideal para sua empresa. Automatize seu ESG com IA por um preço justo. Planos para PMEs e grandes corporações.",
    },
    en: {
      title: "Pricing Plans — Automated ESG with AI",
      description:
        "Choose the right ESG360 plan for your company. Automate your ESG with AI at a fair price. Plans for SMEs and large corporations.",
    },
    es: {
      title: "Planes y Precios — ESG Automático con IA",
      description:
        "Elige el plan ESG360 ideal para tu empresa. Automatiza tu ESG con IA a un precio justo. Planes para pymes y grandes corporaciones.",
    },
  };

  const m = meta[locale] ?? meta["pt"];
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/pricing`,
      languages: {
        "pt-BR": `${BASE_URL}/pt/pricing`,
        "en-US": `${BASE_URL}/en/pricing`,
        "es-ES": `${BASE_URL}/es/pricing`,
      },
    },
    openGraph: {
      title: m.title,
      description: m.description,
      url: `${BASE_URL}/${locale}/pricing`,
    },
  };
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
