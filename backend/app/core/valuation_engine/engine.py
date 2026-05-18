"""
ESG360 Valuation Engine v7.1
Ported from Valuora. Adapted for ESG Financial Intelligence:
  - removed Brazil-specific IBGE integrations
  - removed startup-only qualitative scoring
  - added esg_score parameter as an additional WACC layer

Multi-method valuation: DCF (FCFE/Ke) + Multiples.
5-Factor Beta (sector + size + stage + profitability + liquidity).
US 10-Year Treasury as risk-free rate (FRED). Mid-Year Convention.
Sector-specific NWC, CapEx, D&A (35 sectors, Damodaran).
Terminal Value Fade (competitive convergence, McKinsey/Mauboussin).
DLOM as sole post-DCF discount.

ESG layer:
  spread_bps  = -0.8 * (esg_score - 50)
  wacc_delta  = spread_bps / 10000
  beta_esg    = -0.05 if score >= 70, +0.05 if score < 40, else 0
"""

from __future__ import annotations

import math
import json
import os
import logging
from typing import Dict, Any, Optional, List

import httpx
import numpy as np

ENGINE_VERSION = "v7.1-esg"
logger = logging.getLogger(__name__)

from app.core.valuation_engine.multiples_method import calculate_multiples_method_valuation

# ─── Load Damodaran Data ─────────────────────────────────
_DATA_DIR = os.path.dirname(os.path.abspath(__file__))


def _load_damodaran() -> Dict[str, Any]:
    path = os.path.join(_DATA_DIR, "damodaran_data.json")
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        logger.warning("[Engine] damodaran_data.json not found — using hardcoded defaults")
        return {}


_DAMODARAN = _load_damodaran()

# ─── Risk-Free Rate Cache (US 10-Year Treasury) ─────────
_rf_cache: Dict[str, float] = {"rate": 0.0425}


async def fetch_risk_free_rate() -> float:
    """Fetch current US 10-Year Treasury yield via FRED API."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10&cosd=2024-01-01"
            )
            resp.raise_for_status()
            lines = resp.text.strip().split("\n")
            for line in reversed(lines):
                parts = line.split(",")
                if len(parts) == 2 and parts[1].strip() not in ("", "."):
                    rate = float(parts[1]) / 100
                    _rf_cache["rate"] = rate
                    return rate
    except Exception:
        pass
    return _rf_cache["rate"]


def get_risk_free_rate() -> float:
    return _rf_cache["rate"]


# ─── Sector Data from Damodaran ──────────────────────────

def get_sector_beta_unlevered(sector: str) -> float:
    betas = _DAMODARAN.get("betas_unlevered", {})
    return betas.get(sector.lower(), 0.85)


def get_sector_multiples(sector: str) -> Dict[str, float]:
    multiples = _DAMODARAN.get("multiples", {})
    return multiples.get(sector.lower(), {"ev_revenue": 1.0, "ev_ebitda": 6.0})


def get_survival_rates(sector: str) -> Dict[str, float]:
    rates = _DAMODARAN.get("survival_rates", {})
    return rates.get(sector.lower(), {"1yr": 0.80, "3yr": 0.58, "5yr": 0.45, "10yr": 0.32})


def get_sector_nwc_ratio(sector: str) -> float:
    ratios = _DAMODARAN.get("nwc_ratios", {})
    return ratios.get(sector.lower(), 0.05)


def get_sector_capex_ratio(sector: str) -> float:
    ratios = _DAMODARAN.get("capex_ratios", {})
    return ratios.get(sector.lower(), 0.05)


def get_sector_depreciation_ratio(sector: str) -> float:
    ratios = _DAMODARAN.get("depreciation_ratios", {})
    return ratios.get(sector.lower(), 0.03)


def get_sector_avg_margin(sector: str) -> float:
    margins = _DAMODARAN.get("sector_net_margins", {})
    return margins.get(sector.lower(), 0.06)


LONG_TERM_GDP_GROWTH = 0.025


# ─── Helper functions ────────────────────────────────────

def relever_beta(beta_unlevered: float, debt: float, equity_proxy: float, tax_rate: float = 0.21) -> float:
    if equity_proxy <= 0:
        return beta_unlevered
    de_ratio = debt / equity_proxy
    return round(beta_unlevered * (1 + (1 - tax_rate) * de_ratio), 4)


def net_margin_to_ebit_margin(net_margin: float, tax_rate: float = 0.21) -> float:
    if net_margin < 0:
        return net_margin
    return net_margin / (1 - tax_rate) if (1 - tax_rate) > 0 else net_margin


# ─── Effective Tax Rate ───────────────────────────────────

def calculate_effective_tax_rate(revenue: float, years_in_business: int = 3, net_margin: float = 0.10) -> Dict[str, Any]:
    federal_rate = 0.21
    if revenue <= 1_000_000:       state_rate = 0.03
    elif revenue <= 10_000_000:    state_rate = 0.045
    elif revenue <= 50_000_000:    state_rate = 0.05
    else:                          state_rate = 0.055
    etr = federal_rate + state_rate
    if years_in_business < 3 and net_margin < 0.05:   etr *= 0.75
    elif years_in_business < 5 and net_margin < 0.10: etr *= 0.85
    return {"effective_tax_rate": round(etr, 4), "regime": "c_corporation", "nominal_rate": 0.21}


# ─── Cost of Equity — 5-Factor Beta ──────────────────────

def calculate_cost_of_equity(
    sector: str,
    num_employees: int = 0,
    years_in_business: int = 3,
    net_margin: float = 0.10,
    debt: float = 0,
    equity_proxy: float = 1,
    esg_score: Optional[float] = None,
    risk_free_rate: Optional[float] = None,
    market_premium: float = 0.065,
    tax_rate: float = 0.21,
) -> Dict[str, Any]:
    """5-Factor Cost of Equity + optional ESG beta adjustment.

    Valuora Beta = Industry beta + Size + Stage + Profitability + Liquidity
    ESG layer: score >= 70 → beta -0.05 (lower risk); score < 40 → beta +0.05
    """
    rf = risk_free_rate if risk_free_rate is not None else get_risk_free_rate()
    beta_u = get_sector_beta_unlevered(sector)

    # Factor 1: Size
    if num_employees >= 100:   size_adj = -0.10
    elif num_employees >= 50:  size_adj = 0.0
    elif num_employees >= 20:  size_adj = 0.15
    elif num_employees >= 5:   size_adj = 0.35
    elif num_employees >= 1:   size_adj = 0.55
    else:                      size_adj = 0.70

    # Factor 2: Stage
    if years_in_business >= 15:   stage_adj = -0.10
    elif years_in_business >= 10: stage_adj = -0.05
    elif years_in_business >= 7:  stage_adj = 0.0
    elif years_in_business >= 5:  stage_adj = 0.10
    elif years_in_business >= 3:  stage_adj = 0.25
    elif years_in_business >= 1:  stage_adj = 0.45
    else:                         stage_adj = 0.65

    # Factor 3: Profitability
    if net_margin > 0.20:    profit_adj = -0.10
    elif net_margin > 0.10:  profit_adj = -0.05
    elif net_margin > 0.05:  profit_adj = 0.0
    elif net_margin > 0:     profit_adj = 0.15
    elif net_margin > -0.10: profit_adj = 0.30
    else:                    profit_adj = 0.50

    # Factor 4: Liquidity (Dimson 1979)
    from app.core.valuation_engine.sectors import get_sector_liquidity
    liquidity = get_sector_liquidity(sector)
    if liquidity == "low":      liquidity_adj = 0.20
    elif liquidity == "medium": liquidity_adj = 0.08
    else:                       liquidity_adj = 0.0

    beta_5f = max(0.30, beta_u + size_adj + stage_adj + profit_adj + liquidity_adj)

    # Factor 5: ESG adjustment
    esg_beta_adj = 0.0
    if esg_score is not None:
        if esg_score >= 70:   esg_beta_adj = -0.05
        elif esg_score < 40:  esg_beta_adj = 0.05

    beta_esg = max(0.20, beta_5f + esg_beta_adj)
    beta_levered = relever_beta(beta_esg, debt, equity_proxy, tax_rate=tax_rate)

    ke = rf + beta_levered * market_premium
    return {
        "cost_of_equity": round(ke, 4),
        "risk_free_rate": round(rf, 4),
        "market_premium": round(market_premium, 4),
        "beta_unlevered": round(beta_u, 4),
        "beta_5factor": round(beta_5f, 4),
        "esg_beta_adjustment": round(esg_beta_adj, 4),
        "beta_esg": round(beta_esg, 4),
        "beta_levered": round(beta_levered, 4),
        "size_adj": size_adj,
        "stage_adj": stage_adj,
        "profit_adj": profit_adj,
        "liquidity_adj": liquidity_adj,
        "liquidity_level": liquidity,
    }


# ─── WACC ─────────────────────────────────────────────────

def calculate_wacc(
    beta_levered: float,
    risk_free_rate: Optional[float] = None,
    market_premium: float = 0.065,
    debt_ratio: float = 0.0,
    cost_of_debt: float = 0.08,
    tax_rate: float = 0.21,
    esg_spread_bps: float = 0.0,
) -> float:
    """WACC with optional ESG spread adjustment on cost of debt."""
    rf = risk_free_rate if risk_free_rate is not None else get_risk_free_rate()
    ke = rf + beta_levered * market_premium
    equity_ratio = 1 - debt_ratio
    esg_cod_delta = esg_spread_bps / 10000
    adj_cod = cost_of_debt + esg_cod_delta
    wacc = ke * equity_ratio + adj_cod * (1 - tax_rate) * debt_ratio
    return round(wacc, 4)


# ─── FCFE Projection ─────────────────────────────────────

def project_fcfe(
    revenue: float,
    net_margin: float,
    growth_rate: float,
    years: int = 5,
    sector: Optional[str] = None,
) -> List[Dict[str, float]]:
    """FCFE with exponential growth decay converging to long-term GDP growth."""
    capex_ratio = get_sector_capex_ratio(sector) if sector else 0.05
    nwc_ratio = get_sector_nwc_ratio(sector) if sector else 0.03
    depreciation_ratio = get_sector_depreciation_ratio(sector) if sector else 0.03

    projections = []
    prev_revenue = revenue
    decay_lambda = 0.3

    for year in range(1, years + 1):
        exp_decay = math.exp(-decay_lambda * year)
        adj_growth = growth_rate * exp_decay + LONG_TERM_GDP_GROWTH * (1 - exp_decay)
        current_revenue = max(0, prev_revenue * (1 + adj_growth))
        net_income = current_revenue * net_margin
        depreciation = current_revenue * depreciation_ratio
        capex = current_revenue * capex_ratio
        delta_nwc = nwc_ratio * (current_revenue - prev_revenue)
        fcfe = net_income + depreciation - capex - delta_nwc

        projections.append({
            "year": year,
            "revenue": round(current_revenue, 2),
            "growth_rate": round(adj_growth, 4),
            "net_income": round(net_income, 2),
            "depreciation": round(depreciation, 2),
            "capex": round(capex, 2),
            "delta_nwc": round(delta_nwc, 2),
            "fcf": round(fcfe, 2),
        })
        prev_revenue = current_revenue
    return projections


# ─── Terminal Value ───────────────────────────────────────

def calculate_terminal_value_gordon(last_fcf: float, ke: float, perpetuity_growth: float = 0.025) -> Dict[str, Any]:
    warnings: List[str] = []
    if last_fcf <= 0:
        warnings.append("Last-year FCFE is negative/zero. TV = 0.")
        return {"terminal_value": 0, "method": "gordon_growth", "perpetuity_growth": perpetuity_growth, "warnings": warnings}
    ke = max(ke, 0.001)
    if ke <= perpetuity_growth:
        perpetuity_growth = ke * 0.5
        warnings.append(f"Perpetuity growth adjusted to {perpetuity_growth*100:.1f}%.")
    tv = last_fcf * (1 + perpetuity_growth) / (ke - perpetuity_growth)
    return {"terminal_value": round(tv, 2), "method": "gordon_growth", "perpetuity_growth": perpetuity_growth, "warnings": warnings}


def calculate_terminal_value_exit_multiple(last_year_revenue: float, sector: str, custom_multiple: Optional[float] = None) -> Dict[str, Any]:
    multiples = get_sector_multiples(sector)
    exit_multiple = custom_multiple if custom_multiple is not None else multiples.get("ev_revenue", 2.0)
    tv = last_year_revenue * exit_multiple
    return {"terminal_value": round(tv, 2), "method": "exit_multiple", "exit_multiple": exit_multiple}


# ─── Equity Value (FCFE discounted at Ke) ────────────────

def calculate_equity_value_fcfe(
    fcfe_projections: List[Dict[str, float]],
    ke: float,
    terminal_value: float,
    mid_year: bool = True,
) -> Dict[str, Any]:
    """PV of FCFE + PV of Terminal Value, discounted at Cost of Equity (Ke)."""
    ke = max(ke, 0.001)
    pv_fcfe = []
    for proj in fcfe_projections:
        year = proj["year"]
        discount_period = year - 0.5 if mid_year else year
        pv = proj["fcf"] / ((1 + ke) ** discount_period)
        pv_fcfe.append(round(pv, 2))
    pv_total = sum(pv_fcfe)
    last_year = len(fcfe_projections)
    pv_tv = terminal_value / ((1 + ke) ** last_year)
    equity_value = pv_total + pv_tv
    tv_pct = (pv_tv / equity_value * 100) if equity_value > 0 else 0
    return {
        "pv_fcfe": pv_fcfe,
        "pv_fcfe_total": round(pv_total, 2),
        "pv_terminal_value": round(pv_tv, 2),
        "equity_value": round(equity_value, 2),
        "tv_percentage": round(tv_pct, 1),
        "mid_year_convention": mid_year,
    }


# ─── DLOM ────────────────────────────────────────────────

def calculate_dlom(revenue: float, sector: str, years_in_business: int = 5) -> Dict[str, Any]:
    """Illiquidity / Marketability Discount."""
    base_discount = 0.22
    if revenue < 500_000:        size_adj = 0.05
    elif revenue < 2_000_000:    size_adj = 0.02
    elif revenue < 10_000_000:   size_adj = 0.0
    else:                        size_adj = -0.03

    if years_in_business < 2:    maturity_adj = 0.06
    elif years_in_business < 3:  maturity_adj = 0.04
    elif years_in_business < 5:  maturity_adj = 0.02
    elif years_in_business < 10: maturity_adj = 0.0
    else:                        maturity_adj = -0.04

    from app.core.valuation_engine.sectors import get_sector_liquidity
    liquidity = get_sector_liquidity(sector)
    dlom_adj_map = _DAMODARAN.get("dlom_sector_adjustment", {"high": -0.05, "medium": 0.0, "low": 0.05})
    sector_adj = dlom_adj_map.get(liquidity, 0.0)
    total = max(0.05, min(0.35, base_discount + size_adj + maturity_adj + sector_adj))
    return {
        "dlom_pct": round(total, 4),
        "base_discount": base_discount,
        "size_adjustment": size_adj,
        "maturity_adjustment": maturity_adj,
        "sector_adjustment": sector_adj,
        "sector_liquidity": liquidity,
    }


# ─── Monte Carlo ─────────────────────────────────────────

def run_monte_carlo(
    revenue: float,
    net_margin: float,
    growth_rate: float,
    ke: float,
    sector: str,
    years: int = 5,
    n_simulations: int = 2000,
) -> Dict[str, Any]:
    """Monte Carlo simulation — 2000 runs, P5/P50/P95."""
    rng = np.random.default_rng(42)
    results = []
    for _ in range(n_simulations):
        sim_margin = net_margin * rng.lognormal(0, 0.15)
        sim_growth = growth_rate + rng.normal(0, 0.05)
        sim_ke = ke + rng.normal(0, 0.01)
        sim_ke = max(0.05, sim_ke)
        projections = project_fcfe(revenue, sim_margin, sim_growth, years=years, sector=sector)
        tv_g = calculate_terminal_value_gordon(projections[-1]["fcf"], sim_ke)
        ev_result = calculate_equity_value_fcfe(projections, sim_ke, tv_g["terminal_value"])
        results.append(ev_result["equity_value"])
    results_arr = np.array(results)
    return {
        "p5": round(float(np.percentile(results_arr, 5)), 2),
        "p25": round(float(np.percentile(results_arr, 25)), 2),
        "p50": round(float(np.percentile(results_arr, 50)), 2),
        "p75": round(float(np.percentile(results_arr, 75)), 2),
        "p95": round(float(np.percentile(results_arr, 95)), 2),
        "mean": round(float(np.mean(results_arr)), 2),
        "std": round(float(np.std(results_arr)), 2),
        "n_simulations": n_simulations,
    }


# ─── ESG Spread ──────────────────────────────────────────

def esg_spread_bps(esg_score: float) -> float:
    """Translate ESG score into credit spread delta (basis points).
    Negative = better (lower cost of debt).
    Calibrated: Berg et al. 2022, ECB WP 2023/2811.
    score 78 → -22.4 bps; score 40 → +8 bps.
    """
    return round(-0.8 * (esg_score - 50), 2)


# ─── Main Valuation Entry Point ──────────────────────────

def run_esg_valuation(
    revenue: float,
    net_margin: float,
    sector: str,
    growth_rate: float = 0.08,
    debt: float = 0.0,
    cash: float = 0.0,
    num_employees: int = 0,
    years_in_business: int = 5,
    projection_years: int = 5,
    esg_score: Optional[float] = None,
    run_monte_carlo_sim: bool = True,
) -> Dict[str, Any]:
    """
    Full ESG-aware valuation.

    Returns both base valuation (no ESG) and ESG-adjusted valuation,
    so the caller can compute the ESG impact delta cleanly.
    """
    rf = get_risk_free_rate()

    # ── Base valuation (no ESG) ───────────────────────────
    coe_base = calculate_cost_of_equity(
        sector=sector,
        num_employees=num_employees,
        years_in_business=years_in_business,
        net_margin=net_margin,
        debt=debt,
        equity_proxy=revenue,
        esg_score=None,
        risk_free_rate=rf,
    )
    ke_base = coe_base["cost_of_equity"]
    fcfe_base = project_fcfe(revenue, net_margin, growth_rate, years=projection_years, sector=sector)
    tv_base = calculate_terminal_value_gordon(fcfe_base[-1]["fcf"], ke_base)
    tv_exit_base = calculate_terminal_value_exit_multiple(fcfe_base[-1]["revenue"], sector)
    # Stage-based blend: mature (>=7yr) 50/50, growth 25/75, early 0/100
    if years_in_business >= 7:      w_g, w_e = 0.50, 0.50
    elif years_in_business >= 3:    w_g, w_e = 0.25, 0.75
    else:                           w_g, w_e = 0.0, 1.0
    tv_blended_base = tv_base["terminal_value"] * w_g + tv_exit_base["terminal_value"] * w_e
    ev_base = calculate_equity_value_fcfe(fcfe_base, ke_base, tv_blended_base)

    multiples_base = calculate_multiples_method_valuation(
        revenue=revenue, net_margin=net_margin, growth_rate=growth_rate, sector=sector, debt=debt, cash=cash
    )

    # ── ESG-adjusted valuation ────────────────────────────
    esg_spread = esg_spread_bps(esg_score) if esg_score is not None else 0.0
    coe_esg = calculate_cost_of_equity(
        sector=sector,
        num_employees=num_employees,
        years_in_business=years_in_business,
        net_margin=net_margin,
        debt=debt,
        equity_proxy=revenue,
        esg_score=esg_score,
        risk_free_rate=rf,
    )
    ke_esg = coe_esg["cost_of_equity"]
    fcfe_esg = project_fcfe(revenue, net_margin, growth_rate, years=projection_years, sector=sector)
    tv_esg = calculate_terminal_value_gordon(fcfe_esg[-1]["fcf"], ke_esg)
    tv_exit_esg = calculate_terminal_value_exit_multiple(fcfe_esg[-1]["revenue"], sector)
    tv_blended_esg = tv_esg["terminal_value"] * w_g + tv_exit_esg["terminal_value"] * w_e
    ev_esg = calculate_equity_value_fcfe(fcfe_esg, ke_esg, tv_blended_esg)

    # ── Delta ─────────────────────────────────────────────
    base_eq = ev_base["equity_value"] + cash - debt
    esg_eq = ev_esg["equity_value"] + cash - debt
    delta_pct = round(((esg_eq / base_eq) - 1) * 100, 2) if base_eq > 0 else 0.0

    # ── Monte Carlo ───────────────────────────────────────
    mc = None
    if run_monte_carlo_sim:
        mc = run_monte_carlo(revenue, net_margin, growth_rate, ke_esg, sector, years=projection_years)

    return {
        "engine_version": ENGINE_VERSION,
        "sector": sector,
        "esg_score": esg_score,
        "esg_spread_bps": esg_spread,
        "risk_free_rate": rf,
        # Base (no ESG)
        "base": {
            "cost_of_equity": ke_base,
            "equity_value": round(base_eq, 2),
            "fcfe_projections": fcfe_base,
            "terminal_value_gordon": tv_base["terminal_value"],
            "terminal_value_exit": tv_exit_base["terminal_value"],
            "terminal_value_blended": round(tv_blended_base, 2),
            "coe_detail": coe_base,
        },
        # ESG-adjusted
        "esg_adjusted": {
            "cost_of_equity": ke_esg,
            "equity_value": round(esg_eq, 2),
            "fcfe_projections": fcfe_esg,
            "terminal_value_gordon": tv_esg["terminal_value"],
            "terminal_value_exit": tv_exit_esg["terminal_value"],
            "terminal_value_blended": round(tv_blended_esg, 2),
            "coe_detail": coe_esg,
        },
        # Impact
        "delta_pct": delta_pct,
        "delta_usd": round(esg_eq - base_eq, 2),
        # Multiples
        "multiples": multiples_base,
        # Monte Carlo
        "monte_carlo": mc,
        # Methodology
        "methodology": {
            "dcf_method": "FCFE discounted at Ke (Cost of Equity)",
            "beta_method": "5-Factor (sector + size + stage + profitability + liquidity)",
            "esg_beta_adj": "±0.05 based on ESG score band",
            "esg_spread_formula": "spread_bps = -0.8 × (score − 50)",
            "terminal_value": f"Gordon ({round(w_g*100)}%) + Exit Multiple ({round(w_e*100)}%)",
            "mid_year_convention": True,
            "data_source": "Damodaran/NYU Stern + Valuora v7.1",
            "references": [
                "Berg et al. 2022 — ESG-credit spread nexus",
                "ECB WP 2023/2811 — Climate risk and cost of capital",
                "Damodaran — Betas, multiples, sector data",
                "Dimson 1979 — Liquidity adjustment",
            ],
        },
    }
