"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HelpCircle, Sparkles } from "lucide-react";
import { ProductTour, resetTour, type TourStep } from "./product-tour";

interface TourHelpButtonProps {
  tourId: string;
  steps: TourStep[];
  /** Optional bottom offset (px) when stacking with other floating buttons. */
  bottomOffset?: number;
}

export function TourHelpButton({
  tourId,
  steps,
  bottomOffset = 24,
}: TourHelpButtonProps) {
  const t = useTranslations("tour");
  const [run, setRun] = useState(false);

  const start = () => {
    resetTour(tourId);
    setRun(false);
    // next tick so ProductTour resets its state, then trigger
    setTimeout(() => setRun(true), 0);
  };

  return (
    <>
      <button
        onClick={start}
        title={t("helpButtonTitle")}
        aria-label={t("helpButtonTitle")}
        className="fixed right-6 z-[100] group flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 hover:scale-105 transition-all"
        style={{ bottom: bottomOffset }}
      >
        <HelpCircle className="h-5 w-5" />
        <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-[#0b1220] px-3 py-1.5 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          {t("helpButtonTitle")}
        </span>
      </button>

      <ProductTour
        tourId={tourId}
        steps={steps}
        auto={false}
        run={run}
        onClose={() => setRun(false)}
        labels={{
          next: t("next"),
          back: t("back"),
          skip: t("skip"),
          finish: t("finish"),
          stepLabel: (c, total) => t("stepLabel", { current: c, total }),
        }}
      />
    </>
  );
}
