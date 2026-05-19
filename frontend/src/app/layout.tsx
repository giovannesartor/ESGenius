import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://esg360.digital";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "ESG360 — ESG Automático com Inteligência Artificial",
    template: "%s | ESG360",
  },
  description:
    "ESG 360 é a plataforma de ESG automático com IA. Gestão, relatórios e compliance ESG com inteligência artificial. Pontuação ESG em minutos.",
  keywords: [
    "ESG automático",
    "ESG com IA",
    "ESG 360",
    "plataforma ESG",
    "gestão ESG",
    "relatório ESG",
    "compliance ESG",
    "ESG inteligência artificial",
    "ESG site",
    "pontuação ESG",
    "sustentabilidade empresarial",
    "ESG Brasil",
    "software ESG",
  ],
  authors: [{ name: "ESG360", url: BASE_URL }],
  creator: "ESG360",
  publisher: "ESG360",
  alternates: {
    canonical: BASE_URL,
    languages: {
      "pt-BR": `${BASE_URL}/pt`,
      "en-US": `${BASE_URL}/en`,
      "es-ES": `${BASE_URL}/es`,
    },
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "ESG360",
    title: "ESG360 — ESG Automático com Inteligência Artificial",
    description:
      "Plataforma ESG com IA: automatize sua gestão ESG, gere relatórios em minutos e obtenha pontuação ESG precisa.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ESG360 — Plataforma ESG com IA",
      },
    ],
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "ESG360 — ESG Automático com IA",
    description:
      "Automatize sua gestão ESG com inteligência artificial. Relatórios, compliance e pontuação ESG em minutos.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@esg360digital",
    site: "@esg360digital",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    google: "OzzCA7sy7qFKmyvCfk4llwhyu5Q7EG0TsObaUem9yZo",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
