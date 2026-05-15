"use client";

import { useTranslations } from "next-intl";
import { ProductTour } from "./product-tour";
import { TourHelpButton } from "./help-button";
import type { TourStep } from "./product-tour";

const TOUR_ID = "esgenius-user-v1";

function useUserTourSteps(): TourStep[] {
  const t = useTranslations("tour.user");
  return [
    {
      selector: null,
      title: t("welcome.title"),
      body: t("welcome.body"),
    },
    {
      selector: '[data-tour="sidebar-nav"]',
      title: t("sidebar.title"),
      body: t("sidebar.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="nav-overview"]',
      title: t("overview.title"),
      body: t("overview.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="nav-upload"]',
      title: t("upload.title"),
      body: t("upload.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="nav-reports"]',
      title: t("reports.title"),
      body: t("reports.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="nav-esgScore"]',
      title: t("score.title"),
      body: t("score.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="nav-insights"]',
      title: t("insights.title"),
      body: t("insights.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="nav-simulate"]',
      title: t("simulate.title"),
      body: t("simulate.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="nav-subscription"]',
      title: t("esgReports.title"),
      body: t("esgReports.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="topbar-actions"]',
      title: t("topbar.title"),
      body: t("topbar.body"),
      placement: "bottom",
      skipIfMissing: true,
    },
    {
      selector: null,
      title: t("done.title"),
      body: t("done.body"),
    },
  ];
}

export function UserTour() {
  const t = useTranslations("tour");
  const steps = useUserTourSteps();
  return (
    <>
      <ProductTour
        tourId={TOUR_ID}
        steps={steps}
        auto
        labels={{
          next: t("next"),
          back: t("back"),
          skip: t("skip"),
          finish: t("finish"),
          stepLabel: (c, total) => t("stepLabel", { current: c, total }),
        }}
      />
      <TourHelpButton tourId={TOUR_ID} steps={steps} />
    </>
  );
}
