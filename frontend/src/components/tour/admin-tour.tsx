"use client";

import { useTranslations } from "next-intl";
import { ProductTour } from "./product-tour";
import { TourHelpButton } from "./help-button";
import type { TourStep } from "./product-tour";

const TOUR_ID = "esgenius-admin-v1";

function useAdminTourSteps(): TourStep[] {
  const t = useTranslations("tour.admin");
  return [
    {
      selector: null,
      title: t("welcome.title"),
      body: t("welcome.body"),
    },
    {
      selector: '[data-tour="admin-sidebar"]',
      title: t("sidebar.title"),
      body: t("sidebar.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="admin-nav-overview"]',
      title: t("overview.title"),
      body: t("overview.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="admin-nav-frameworks"]',
      title: t("frameworks.title"),
      body: t("frameworks.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="admin-nav-companies"]',
      title: t("companies.title"),
      body: t("companies.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="admin-nav-users"]',
      title: t("users.title"),
      body: t("users.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="admin-nav-aiLogs"]',
      title: t("aiLogs.title"),
      body: t("aiLogs.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: '[data-tour="admin-nav-settings"]',
      title: t("settings.title"),
      body: t("settings.body"),
      placement: "right",
      skipIfMissing: true,
    },
    {
      selector: null,
      title: t("done.title"),
      body: t("done.body"),
    },
  ];
}

export function AdminTour() {
  const t = useTranslations("tour");
  const steps = useAdminTourSteps();
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
