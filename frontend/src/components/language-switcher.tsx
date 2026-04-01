"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale } from "@/i18n/routing";

const localeLabels: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "US" },
  pt: { label: "Português", flag: "BR" },
  es: { label: "Español", flag: "ES" },
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  function onLocaleChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale as Locale });
  }

  return (
    <Select value={locale} onValueChange={onLocaleChange}>
      <SelectTrigger className="w-[140px] h-9 text-sm border-border/50 bg-background/50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(localeLabels).map(([key, { label }]) => (
          <SelectItem key={key} value={key} className="text-sm">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
