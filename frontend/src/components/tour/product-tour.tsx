"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

export interface TourStep {
  /** CSS selector to highlight. If null, step is shown centered ("welcome" style). */
  selector: string | null;
  title: string;
  body: string;
  /** Tooltip placement relative to target. Auto-flips if there is no room. */
  placement?: "top" | "bottom" | "left" | "right";
  /** If true, skip when selector not found (otherwise treat as centered modal). */
  skipIfMissing?: boolean;
}

interface ProductTourProps {
  tourId: string;
  steps: TourStep[];
  /** Auto-start on first visit (per tourId). Default: true. */
  auto?: boolean;
  /** External controlled run (e.g., started from a Help button). */
  run?: boolean;
  onClose?: () => void;
  /** UI labels (i18n-friendly). */
  labels?: {
    next?: string;
    back?: string;
    skip?: string;
    finish?: string;
    stepLabel?: (current: number, total: number) => string;
  };
}

const STORAGE_PREFIX = "esgenius:tour:";
const SPOT_PADDING = 8;
const TOOLTIP_GAP = 16;
const TOOLTIP_WIDTH = 360;

function isDone(tourId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + tourId) === "done";
  } catch {
    return true;
  }
}

function markDone(tourId: string) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + tourId, "done");
  } catch {
    /* ignore */
  }
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measure(selector: string | null): Rect | null {
  if (!selector || typeof document === "undefined") return null;
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function ProductTour({
  tourId,
  steps,
  auto = true,
  run,
  onClose,
  labels,
}: ProductTourProps) {
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const [mounted, setMounted] = useState(false);
  const startedRef = useRef(false);

  const L = useMemo(
    () => ({
      next: labels?.next ?? "Next",
      back: labels?.back ?? "Back",
      skip: labels?.skip ?? "Skip tour",
      finish: labels?.finish ?? "Finish",
      stepLabel:
        labels?.stepLabel ?? ((c: number, t: number) => `${c} / ${t}`),
    }),
    [labels],
  );

  // Mount portal target
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Auto-start once
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (startedRef.current) return;
    if (!mounted) return;
    if (run !== undefined) {
      // Externally controlled
      startedRef.current = true;
      setRunning(!!run);
      setIndex(0);
      return;
    }
    if (auto && !isDone(tourId)) {
      startedRef.current = true;
      // small delay so layout is ready
      const t = window.setTimeout(() => {
        setRunning(true);
        setIndex(0);
      }, 600);
      return () => window.clearTimeout(t);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [auto, mounted, run, tourId]);

  // React to external `run` toggling true after initial mount
  useEffect(() => {
    if (run) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRunning(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIndex(0);
    }
  }, [run]);

  const total = steps.length;
  const step = running ? steps[index] : null;

  // Find next valid step (skip missing+skipIfMissing). Returns -1 if none.
  const advanceTo = useCallback(
    (start: number, dir: 1 | -1): number => {
      let i = start;
      while (i >= 0 && i < total) {
        const s = steps[i];
        if (!s.selector) return i;
        if (measure(s.selector)) return i;
        if (!s.skipIfMissing) return i; // show centered
        i += dir;
      }
      return -1;
    },
    [steps, total],
  );

  // Re-measure on step change / resize / scroll
  useLayoutEffect(() => {
    if (!running || !step) return;
    let raf = 0;
    const update = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
      setRect(measure(step.selector));
    };
    update();
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    // Also poll briefly for late-mounting elements (route transitions)
    const interval = window.setInterval(update, 250);
    const stopPoll = window.setTimeout(() => window.clearInterval(interval), 2000);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearInterval(interval);
      window.clearTimeout(stopPoll);
      cancelAnimationFrame(raf);
    };
  }, [running, step, index]);

  const finish = useCallback(() => {
    setRunning(false);
    markDone(tourId);
    onClose?.();
  }, [onClose, tourId]);

  const next = useCallback(() => {
    const ni = advanceTo(index + 1, 1);
    if (ni === -1) finish();
    else setIndex(ni);
  }, [advanceTo, finish, index]);

  const prev = useCallback(() => {
    const pi = advanceTo(index - 1, -1);
    if (pi === -1) return;
    setIndex(pi);
  }, [advanceTo, index]);

  // Keyboard
  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, next, prev, running]);

  if (!mounted || !running || !step) return null;

  // Compute spotlight + tooltip position
  const hasTarget = !!rect;
  const padded: Rect = hasTarget
    ? {
        top: Math.max(0, rect!.top - SPOT_PADDING),
        left: Math.max(0, rect!.left - SPOT_PADDING),
        width: rect!.width + SPOT_PADDING * 2,
        height: rect!.height + SPOT_PADDING * 2,
      }
    : { top: 0, left: 0, width: 0, height: 0 };

  const placement = step.placement ?? "bottom";
  const tooltipPos = computeTooltipPosition(placement, padded, vw, vh, hasTarget);

  const isLast = advanceTo(index + 1, 1) === -1;
  const isFirst = advanceTo(index - 1, -1) === -1;

  return createPortal(
    <div className="fixed inset-0 z-[9999]" aria-live="polite">
      {/* Dim overlay with spotlight cutout via 4 rectangles */}
      <div className="absolute inset-0 pointer-events-auto" onClick={() => {}}>
        {hasTarget ? (
          <>
            {/* Top */}
            <motion.div
              className="absolute bg-black/65 backdrop-blur-[2px]"
              initial={false}
              animate={{
                top: 0,
                left: 0,
                width: vw,
                height: padded.top,
              }}
              transition={{ duration: 0.18 }}
            />
            {/* Bottom */}
            <motion.div
              className="absolute bg-black/65 backdrop-blur-[2px]"
              initial={false}
              animate={{
                top: padded.top + padded.height,
                left: 0,
                width: vw,
                height: Math.max(0, vh - (padded.top + padded.height)),
              }}
              transition={{ duration: 0.18 }}
            />
            {/* Left */}
            <motion.div
              className="absolute bg-black/65 backdrop-blur-[2px]"
              initial={false}
              animate={{
                top: padded.top,
                left: 0,
                width: padded.left,
                height: padded.height,
              }}
              transition={{ duration: 0.18 }}
            />
            {/* Right */}
            <motion.div
              className="absolute bg-black/65 backdrop-blur-[2px]"
              initial={false}
              animate={{
                top: padded.top,
                left: padded.left + padded.width,
                width: Math.max(0, vw - (padded.left + padded.width)),
                height: padded.height,
              }}
              transition={{ duration: 0.18 }}
            />
            {/* Spotlight ring */}
            <motion.div
              className="absolute pointer-events-none rounded-xl ring-2 ring-emerald-400/80"
              style={{
                boxShadow:
                  "0 0 0 9999px rgba(0,0,0,0), 0 0 28px rgba(16,185,129,0.45)",
              }}
              initial={false}
              animate={{
                top: padded.top,
                left: padded.left,
                width: padded.width,
                height: padded.height,
              }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
        )}
      </div>

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="absolute pointer-events-auto"
          style={{
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: TOOLTIP_WIDTH,
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          <div className="rounded-2xl border border-emerald-400/20 bg-[#0b1220] text-slate-100 shadow-2xl overflow-hidden">
            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
                    {L.stepLabel(index + 1, total)}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-white tracking-tight">
                    {step.title}
                  </h3>
                </div>
                <button
                  onClick={finish}
                  aria-label={L.skip}
                  className="shrink-0 -mt-1 -mr-1 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm leading-relaxed text-slate-300">
                {step.body}
              </p>

              {/* Progress bar */}
              <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
                  style={{ width: `${((index + 1) / total) * 100}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={finish}
                  className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {L.skip}
                </button>

                <div className="flex items-center gap-2">
                  {!isFirst && (
                    <button
                      onClick={prev}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {L.back}
                    </button>
                  )}
                  <button
                    onClick={next}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
                  >
                    {isLast ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        {L.finish}
                      </>
                    ) : (
                      <>
                        {L.next}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body,
  );
}

function computeTooltipPosition(
  placement: "top" | "bottom" | "left" | "right",
  rect: Rect,
  vw: number,
  vh: number,
  hasTarget: boolean,
) {
  // Centered fallback for no target
  if (!hasTarget) {
    return {
      top: Math.max(24, vh / 2 - 120),
      left: Math.max(16, vw / 2 - TOOLTIP_WIDTH / 2),
    };
  }

  const tipH = 220; // estimate; precise enough for clamping
  let top = 0;
  let left = 0;

  const tryPlace = (p: typeof placement) => {
    switch (p) {
      case "bottom":
        top = rect.top + rect.height + TOOLTIP_GAP;
        left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case "top":
        top = rect.top - tipH - TOOLTIP_GAP;
        left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tipH / 2;
        left = rect.left + rect.width + TOOLTIP_GAP;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tipH / 2;
        left = rect.left - TOOLTIP_WIDTH - TOOLTIP_GAP;
        break;
    }
  };

  tryPlace(placement);

  // Auto-flip if out of bounds
  const fitsH = left >= 8 && left + TOOLTIP_WIDTH <= vw - 8;
  const fitsV = top >= 8 && top + tipH <= vh - 8;
  if (!fitsH || !fitsV) {
    const order: typeof placement[] = ["bottom", "top", "right", "left"];
    for (const p of order) {
      if (p === placement) continue;
      tryPlace(p);
      const okH = left >= 8 && left + TOOLTIP_WIDTH <= vw - 8;
      const okV = top >= 8 && top + tipH <= vh - 8;
      if (okH && okV) break;
    }
  }

  // Clamp
  left = Math.max(16, Math.min(left, vw - TOOLTIP_WIDTH - 16));
  top = Math.max(16, Math.min(top, vh - tipH - 16));

  return { top, left };
}

/** Helper to imperatively replay a tour (clears the "done" flag). */
export function resetTour(tourId: string) {
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + tourId);
  } catch {
    /* ignore */
  }
}
