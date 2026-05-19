import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/contexts/AuthContext";

const BASE_URL = "https://esg360.digital";

const LOCALE_META: Record<string, { title: string; description: string; ogLocale: string }> = {
  pt: {
    title: "ESG360 — ESG Automático com Inteligência Artificial",
    description:
      "Plataforma ESG com IA: automatize sua gestão ESG, gere relatórios GRI/SASB em minutos e obtenha pontuação ESG precisa.",
    ogLocale: "pt_BR",
  },
  en: {
    title: "ESG360 — Automated ESG with Artificial Intelligence",
    description:
      "AI-powered ESG platform: automate ESG management, generate GRI/SASB reports in minutes, and get accurate ESG scores.",
    ogLocale: "en_US",
  },
  es: {
    title: "ESG360 — ESG Automático con Inteligencia Artificial",
    description:
      "Plataforma ESG con IA: automatiza la gestión ESG, genera informes GRI/SASB en minutos y obtén puntuaciones ESG precisas.",
    ogLocale: "es_ES",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = LOCALE_META[locale] ?? LOCALE_META["pt"];

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        "pt-BR": `${BASE_URL}/pt`,
        "en-US": `${BASE_URL}/en`,
        "es-ES": `${BASE_URL}/es`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${BASE_URL}/${locale}`,
      locale: meta.ogLocale,
      alternateLocale: Object.values(LOCALE_META)
        .map((m) => m.ogLocale)
        .filter((l) => l !== meta.ogLocale),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`@/locales/${locale}.json`)).default;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ESG360",
    url: `${BASE_URL}/${locale}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: LOCALE_META[locale]?.description ?? LOCALE_META["pt"].description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
      description: locale === "pt" ? "Teste gratuito disponível" : "Free trial available",
    },
    provider: {
      "@type": "Organization",
      name: "ESG360",
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png`,
      sameAs: [
        "https://www.linkedin.com/company/esg360digital",
        "https://twitter.com/esg360digital",
      ],
    },
    keywords:
      locale === "pt"
        ? "ESG automático, ESG com IA, plataforma ESG, ESG 360, gestão ESG, relatório ESG"
        : locale === "es"
        ? "ESG automático, ESG con IA, plataforma ESG, gestión ESG"
        : "automated ESG, ESG with AI, ESG platform, ESG 360, ESG management",
  };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Script
        id="json-ld-esg360"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        strategy="beforeInteractive"
      />
      <AuthProvider>{children}</AuthProvider>
    </NextIntlClientProvider>
  );
}
