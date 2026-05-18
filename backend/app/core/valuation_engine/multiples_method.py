"""
Multiples Valuation Method (Comparable Company Analysis)
Ported from Valuora v7.1. Unchanged except default added to growth_rate.

Source: Damodaran/NYU Stern (2025), PitchBook, S&P Capital IQ, Equidam
"""

from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

SECTOR_MULTIPLES_FULL = {
    "tecnologia":        {"ev_revenue": 3.5,  "ev_ebitda": 15.0, "pe": 25.0, "ev_gross_profit": 6.0},
    "saas":              {"ev_revenue": 8.0,  "ev_ebitda": 25.0, "pe": 40.0, "ev_gross_profit": 10.0},
    "ecommerce":         {"ev_revenue": 2.0,  "ev_ebitda": 12.0, "pe": 20.0, "ev_gross_profit": 4.0},
    "fintech":           {"ev_revenue": 5.0,  "ev_ebitda": 18.0, "pe": 30.0, "ev_gross_profit": 8.0},
    "saude":             {"ev_revenue": 2.5,  "ev_ebitda": 12.0, "pe": 22.0, "ev_gross_profit": 5.0},
    "farmacia":          {"ev_revenue": 2.0,  "ev_ebitda": 10.0, "pe": 18.0, "ev_gross_profit": 4.5},
    "estetica":          {"ev_revenue": 1.5,  "ev_ebitda": 8.0,  "pe": 15.0, "ev_gross_profit": 3.0},
    "varejo":            {"ev_revenue": 0.8,  "ev_ebitda": 8.0,  "pe": 15.0, "ev_gross_profit": 2.5},
    "atacado":           {"ev_revenue": 0.5,  "ev_ebitda": 7.0,  "pe": 12.0, "ev_gross_profit": 2.0},
    "industria":         {"ev_revenue": 1.2,  "ev_ebitda": 8.0,  "pe": 14.0, "ev_gross_profit": 3.0},
    "alimentos_industria":{"ev_revenue": 1.0, "ev_ebitda": 8.0,  "pe": 14.0, "ev_gross_profit": 2.5},
    "textil":            {"ev_revenue": 0.8,  "ev_ebitda": 7.0,  "pe": 12.0, "ev_gross_profit": 2.0},
    "quimica":           {"ev_revenue": 1.5,  "ev_ebitda": 9.0,  "pe": 16.0, "ev_gross_profit": 3.5},
    "consultoria":       {"ev_revenue": 2.0,  "ev_ebitda": 10.0, "pe": 18.0, "ev_gross_profit": 3.5},
    "contabilidade":     {"ev_revenue": 1.5,  "ev_ebitda": 8.0,  "pe": 14.0, "ev_gross_profit": 3.0},
    "marketing":         {"ev_revenue": 2.0,  "ev_ebitda": 10.0, "pe": 18.0, "ev_gross_profit": 4.0},
    "servicos":          {"ev_revenue": 1.5,  "ev_ebitda": 8.0,  "pe": 15.0, "ev_gross_profit": 3.0},
    "alimentacao":       {"ev_revenue": 1.0,  "ev_ebitda": 7.0,  "pe": 14.0, "ev_gross_profit": 2.5},
    "hotelaria":         {"ev_revenue": 2.0,  "ev_ebitda": 10.0, "pe": 18.0, "ev_gross_profit": 3.5},
    "educacao":          {"ev_revenue": 2.0,  "ev_ebitda": 10.0, "pe": 18.0, "ev_gross_profit": 4.0},
    "edtech":            {"ev_revenue": 4.0,  "ev_ebitda": 18.0, "pe": 30.0, "ev_gross_profit": 7.0},
    "construcao":        {"ev_revenue": 0.8,  "ev_ebitda": 7.0,  "pe": 12.0, "ev_gross_profit": 2.0},
    "imobiliario":       {"ev_revenue": 1.5,  "ev_ebitda": 10.0, "pe": 16.0, "ev_gross_profit": 3.0},
    "agronegocio":       {"ev_revenue": 1.0,  "ev_ebitda": 7.0,  "pe": 12.0, "ev_gross_profit": 2.5},
    "agritech":          {"ev_revenue": 3.0,  "ev_ebitda": 14.0, "pe": 25.0, "ev_gross_profit": 5.0},
    "logistica":         {"ev_revenue": 1.5,  "ev_ebitda": 9.0,  "pe": 16.0, "ev_gross_profit": 3.0},
    "entregas":          {"ev_revenue": 2.0,  "ev_ebitda": 12.0, "pe": 20.0, "ev_gross_profit": 4.0},
    "energia":           {"ev_revenue": 2.0,  "ev_ebitda": 10.0, "pe": 16.0, "ev_gross_profit": 4.0},
    "energia_solar":     {"ev_revenue": 2.5,  "ev_ebitda": 12.0, "pe": 18.0, "ev_gross_profit": 4.5},
    "financeiro":        {"ev_revenue": 3.0,  "ev_ebitda": 12.0, "pe": 15.0, "ev_gross_profit": 5.0},
    "seguros":           {"ev_revenue": 2.0,  "ev_ebitda": 10.0, "pe": 14.0, "ev_gross_profit": 4.0},
    "midia":             {"ev_revenue": 2.0,  "ev_ebitda": 10.0, "pe": 18.0, "ev_gross_profit": 4.0},
    "games":             {"ev_revenue": 3.0,  "ev_ebitda": 15.0, "pe": 25.0, "ev_gross_profit": 5.0},
    "outros":            {"ev_revenue": 1.5,  "ev_ebitda": 8.0,  "pe": 15.0, "ev_gross_profit": 3.0},
}


def calculate_multiples_method_valuation(
    revenue: float,
    net_margin: float,
    sector: str,
    growth_rate: float = 0.0,
    debt: float = 0,
    cash: float = 0,
    ebitda: Optional[float] = None,
    recurring_revenue_pct: float = 0.0,
    years_in_business: int = 3,
    num_employees: int = 0,
    gross_margin: Optional[float] = None,
) -> Dict[str, Any]:
    sector_key = sector.lower()
    multiples = SECTOR_MULTIPLES_FULL.get(sector_key, SECTOR_MULTIPLES_FULL["outros"])

    net_income = revenue * net_margin
    estimated_ebitda = ebitda if (ebitda and ebitda > 0) else revenue * net_margin * 1.5
    estimated_gross_margin = gross_margin if gross_margin else max(0.25, net_margin * 2.5)
    gross_profit = revenue * estimated_gross_margin

    recurring_premium = 1 + recurring_revenue_pct * 0.40

    valuations: Dict[str, Any] = {}
    weights: Dict[str, float] = {}

    # 1. EV/Revenue
    ev_revenue_mult = multiples["ev_revenue"] * recurring_premium
    ev_by_revenue = revenue * ev_revenue_mult
    equity_by_revenue = ev_by_revenue + cash - debt
    valuations["ev_revenue"] = {
        "label": "EV / Revenue",
        "multiple": round(ev_revenue_mult, 2),
        "base_multiple": multiples["ev_revenue"],
        "recurring_premium": round(recurring_premium, 2),
        "enterprise_value": round(ev_by_revenue, 2),
        "equity_value": round(max(0, equity_by_revenue), 2),
        "applicable": True,
    }
    weights["ev_revenue"] = 0.25

    # 2. EV/EBITDA
    if estimated_ebitda > 0:
        ev_ebitda_mult = multiples["ev_ebitda"]
        ev_by_ebitda = estimated_ebitda * ev_ebitda_mult
        equity_by_ebitda = ev_by_ebitda + cash - debt
        valuations["ev_ebitda"] = {
            "label": "EV / EBITDA",
            "multiple": ev_ebitda_mult,
            "enterprise_value": round(ev_by_ebitda, 2),
            "equity_value": round(max(0, equity_by_ebitda), 2),
            "ebitda_used": round(estimated_ebitda, 2),
            "applicable": True,
        }
        weights["ev_ebitda"] = 0.30
    else:
        valuations["ev_ebitda"] = {"label": "EV / EBITDA", "applicable": False, "reason": "Negative or zero EBITDA"}
        weights["ev_ebitda"] = 0.0

    # 3. P/E
    if net_income > 0:
        pe_ratio = multiples["pe"]
        equity_by_pe = net_income * pe_ratio
        valuations["pe_ratio"] = {
            "label": "P/E Ratio",
            "multiple": pe_ratio,
            "net_income": round(net_income, 2),
            "equity_value": round(equity_by_pe, 2),
            "applicable": True,
        }
        weights["pe_ratio"] = 0.25
    else:
        valuations["pe_ratio"] = {"label": "P/E Ratio", "applicable": False, "reason": "Net income non-positive"}
        weights["pe_ratio"] = 0.0

    # 4. EV/Gross Profit
    if gross_profit > 0:
        ev_gp_mult = multiples["ev_gross_profit"]
        ev_by_gp = gross_profit * ev_gp_mult
        equity_by_gp = ev_by_gp + cash - debt
        valuations["ev_gross_profit"] = {
            "label": "EV / Gross Profit",
            "multiple": ev_gp_mult,
            "gross_profit": round(gross_profit, 2),
            "gross_margin": round(estimated_gross_margin * 100, 1),
            "enterprise_value": round(ev_by_gp, 2),
            "equity_value": round(max(0, equity_by_gp), 2),
            "applicable": True,
        }
        weights["ev_gross_profit"] = 0.15
    else:
        valuations["ev_gross_profit"] = {"label": "EV / Gross Profit", "applicable": False, "reason": "No gross profit"}
        weights["ev_gross_profit"] = 0.0

    # 5. ARR (subscription)
    if recurring_revenue_pct > 0.30:
        arr = revenue * recurring_revenue_pct
        arr_multiple = ev_revenue_mult * 1.5
        ev_by_arr = arr * arr_multiple
        equity_by_arr = ev_by_arr + cash - debt
        valuations["arr_multiple"] = {
            "label": "ARR Multiple (SaaS/Subscription)",
            "multiple": round(arr_multiple, 2),
            "arr": round(arr, 2),
            "recurring_revenue_pct": round(recurring_revenue_pct * 100, 1),
            "enterprise_value": round(ev_by_arr, 2),
            "equity_value": round(max(0, equity_by_arr), 2),
            "applicable": True,
        }
        weights["arr_multiple"] = 0.15
    else:
        valuations["arr_multiple"] = {
            "label": "ARR Multiple",
            "applicable": False,
            "reason": f"Recurring revenue too low ({recurring_revenue_pct*100:.0f}% < 30%)",
        }
        weights["arr_multiple"] = 0.0

    # Normalize weights
    total_weight = sum(weights.values())
    normalized_weights = {k: round(v / total_weight, 4) for k, v in weights.items()} if total_weight > 0 else weights

    # Composite
    composite_equity = 0.0
    for key, val_data in valuations.items():
        if val_data.get("applicable", False) and normalized_weights.get(key, 0) > 0:
            composite_equity += val_data["equity_value"] * normalized_weights[key]
            val_data["weight"] = normalized_weights[key]
            val_data["weight_pct"] = round(normalized_weights[key] * 100, 1)
        else:
            val_data["weight"] = 0
            val_data["weight_pct"] = 0
    composite_equity = round(max(0, composite_equity), 2)

    applicable_vals = [v["equity_value"] for v in valuations.values() if v.get("applicable")]
    val_spread = (
        round(((max(applicable_vals) - min(applicable_vals)) / composite_equity) * 100, 1)
        if applicable_vals and composite_equity > 0
        else 0
    )

    return {
        "method": "multiples",
        "method_name": "Multiples / Comparable Company Analysis",
        "valuation": composite_equity,
        "valuation_range": {
            "low": round(composite_equity * 0.75, 2),
            "mid": composite_equity,
            "high": round(composite_equity * 1.25, 2),
            "spread_pct": val_spread,
        },
        "individual_valuations": valuations,
        "weights_used": normalized_weights,
        "applicable_methods_count": sum(1 for v in valuations.values() if v.get("applicable")),
        "total_methods": len(valuations),
        "sector": sector,
        "sector_multiples": multiples,
        "source": "Damodaran/NYU Stern (2025), PitchBook, S&P Capital IQ",
    }
