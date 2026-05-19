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
      title: "Soluções ESG com IA — ESG360",
      description:
        "Descubra como o ESG360 automatiza ESG com inteligência artificial: scoring automático, relatórios GRI/SASB, risco climático e muito mais.",
    },
    en: {
      title: "ESG Solutions with AI — ESG360",
      description:
        "Discover how ESG360 automates ESG with artificial intelligence: automatic scoring, GRI/SASB reports, climate risk analysis and more.",
    },
    es: {
      title: "Soluciones ESG con IA — ESG360",
      description:
        "Descubre cómo ESG360 automatiza el ESG con inteligencia artificial: puntuación automática, informes GRI/SASB, riesgo climático y más.",
    },
  };

  const m = meta[locale] ?? meta["pt"];
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/solutions`,
      languages: {
        "pt-BR": `${BASE_URL}/pt/solutions`,
        "en-US": `${BASE_URL}/en/solutions`,
        "es-ES": `${BASE_URL}/es/solutions`,
      },
    },
    openGraph: {
      title: m.title,
      description: m.description,
      url: `${BASE_URL}/${locale}/solutions`,
    },
  };
}

export default function SolutionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
