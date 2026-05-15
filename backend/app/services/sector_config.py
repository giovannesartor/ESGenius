"""Sector-aware few-shot configurations and helpers for prompts."""

from typing import Optional

SECTOR_CONFIG: dict[str, dict] = {
    "mining": {
        "label": "Mining & Metals",
        "key_metrics": [
            "tailings_management", "water_withdrawal_m3", "tCO2e_per_ton_ore",
            "biodiversity_impact", "community_grievances", "fatality_rate",
        ],
        "frameworks": ["GRI", "SASB", "TCFD", "ICMM"],
        "regulations": ["IBAMA", "ANM", "Conduct Mining Code"],
        "few_shot": (
            "Mining sector typical disclosures include tailings dam stability, "
            "water consumption per ton of ore, scope 1 emissions from diesel haul "
            "trucks, biodiversity offsets, and LTIFR for safety."
        ),
    },
    "banking": {
        "label": "Banking & Financial Services",
        "key_metrics": [
            "financed_emissions", "green_loans_pct", "aum_esg_funds",
            "exposure_carbon_intensive", "diversity_board_pct",
        ],
        "frameworks": ["GRI", "SASB-FN", "TCFD", "PCAF", "ISSB"],
        "regulations": ["BCB Resolution 4945", "CMN 4943", "CSRD (EU subs)"],
        "few_shot": (
            "Banks report financed emissions per PCAF, climate risk per TCFD, "
            "% of green/sustainable loans, and exposure to carbon-intensive sectors."
        ),
    },
    "retail": {
        "label": "Retail & Consumer Goods",
        "key_metrics": [
            "scope3_purchased_goods", "supplier_audits_pct", "packaging_recyclability",
            "store_energy_kwh_m2", "food_waste_kg",
        ],
        "frameworks": ["GRI", "SASB-CG", "CDP"],
        "regulations": ["CSRD", "EU Packaging Directive"],
        "few_shot": (
            "Retailers typically disclose Scope 3 from purchased goods, supply chain audits, "
            "packaging recyclability, store energy intensity, and food waste."
        ),
    },
    "energy": {
        "label": "Energy & Utilities",
        "key_metrics": [
            "renewable_capacity_mw", "scope1_intensity_kgco2_kwh",
            "transmission_loss_pct", "spill_count",
        ],
        "frameworks": ["GRI", "SASB-IF", "TCFD", "ISSB"],
        "regulations": ["ANEEL", "ANP", "CSRD", "CVM 193"],
        "few_shot": (
            "Energy firms disclose generation mix, scope 1 emission intensity per kWh, "
            "renewable capacity, and methane leaks (oil & gas)."
        ),
    },
    "agriculture": {
        "label": "Agriculture & Food",
        "key_metrics": [
            "land_use_ha", "deforestation_alerts", "water_consumption_m3",
            "fertilizer_use_kg_ha", "scope1_livestock_methane",
        ],
        "frameworks": ["GRI", "SASB", "SBTN", "CDP Forests"],
        "regulations": ["Forest Code (BR)", "EUDR", "CSRD"],
        "few_shot": (
            "Agribusiness reports land use, deforestation alerts (PRODES/DETER), "
            "water consumption, fertilizer/pesticide use, and livestock methane."
        ),
    },
    "tech": {
        "label": "Technology & Software",
        "key_metrics": [
            "datacenter_pue", "renewable_energy_pct", "scope3_business_travel",
            "diversity_tech_workforce_pct",
        ],
        "frameworks": ["GRI", "SASB-TC", "ISSB"],
        "regulations": ["CSRD", "AI Act"],
        "few_shot": (
            "Tech firms report data center PUE, renewable electricity %, "
            "Scope 3 business travel, diversity in tech roles, and data privacy."
        ),
    },
    "manufacturing": {
        "label": "Manufacturing & Industrial",
        "key_metrics": [
            "scope1_process_emissions", "energy_intensity_mwh_unit",
            "hazardous_waste_kg", "ltifr",
        ],
        "frameworks": ["GRI", "SASB-RT", "TCFD"],
        "regulations": ["CONAMA", "CSRD", "REACH"],
        "few_shot": (
            "Manufacturers disclose process emissions, energy intensity per unit, "
            "hazardous waste generation, and lost-time injury frequency rate (LTIFR)."
        ),
    },
    "construction": {
        "label": "Construction & Real Estate",
        "key_metrics": [
            "embodied_carbon_kgco2_m2", "operational_energy_kwh_m2",
            "green_building_certifications", "site_safety_incidents",
        ],
        "frameworks": ["GRESB", "GRI", "SBTi-Buildings"],
        "regulations": ["LEED", "BREEAM", "EU Taxonomy"],
        "few_shot": (
            "Real estate firms report embodied + operational carbon per m2, "
            "green-building certifications (LEED, BREEAM), and on-site safety."
        ),
    },
}

DEFAULT_SECTOR = "general"


def get_sector_config(sector: Optional[str]) -> dict:
    if not sector:
        return {"label": "General", "key_metrics": [], "frameworks": ["GRI"], "regulations": [], "few_shot": ""}
    key = sector.lower().strip()
    aliases = {
        "fintech": "banking",
        "financial": "banking",
        "bank": "banking",
        "supermarket": "retail",
        "consumer": "retail",
        "agribusiness": "agriculture",
        "agro": "agriculture",
        "food": "agriculture",
        "oil": "energy",
        "gas": "energy",
        "utility": "energy",
        "utilities": "energy",
        "real estate": "construction",
        "realestate": "construction",
        "software": "tech",
        "saas": "tech",
        "industrial": "manufacturing",
        "industry": "manufacturing",
    }
    key = aliases.get(key, key)
    return SECTOR_CONFIG.get(
        key, {"label": sector, "key_metrics": [], "frameworks": ["GRI"], "regulations": [], "few_shot": ""}
    )


def recommend_frameworks(sector: Optional[str], country: Optional[str], size: Optional[str]) -> list[dict]:
    """Return ordered list of recommended frameworks with rationale."""
    cfg = get_sector_config(sector)
    base = list(cfg.get("frameworks", []))

    country_l = (country or "").lower()
    if any(c in country_l for c in ["brazil", "brasil", "br"]):
        base.extend(["CVM-193", "B3-ISE", "GRI"])
    if any(c in country_l for c in ["europe", "germany", "france", "spain", "italy", "portugal", "eu"]):
        base.extend(["CSRD", "ESRS", "EU-Taxonomy"])
    if any(c in country_l for c in ["usa", "united states", "us"]):
        base.extend(["SASB", "SEC-Climate"])
    if any(c in country_l for c in ["uk", "united kingdom"]):
        base.extend(["TCFD", "ISSB"])

    size_l = (size or "").lower()
    if size_l in ("large", "enterprise"):
        base.extend(["TCFD", "ISSB", "CDP"])

    seen = set()
    ordered = []
    for code in base:
        if code not in seen:
            seen.add(code)
            ordered.append(code)

    rationales = {
        "GRI": "Universal multi-stakeholder reporting standard.",
        "SASB": "Sector-specific financial materiality standards.",
        "TCFD": "Climate risk financial disclosure (now ISSB).",
        "ISSB": "Global IFRS S1/S2 sustainability disclosure baseline.",
        "CDP": "Climate, water and forests questionnaire.",
        "CSRD": "EU mandatory corporate sustainability reporting.",
        "ESRS": "European Sustainability Reporting Standards.",
        "EU-Taxonomy": "EU classification of sustainable activities.",
        "CVM-193": "Brazilian CVM mandatory ISSB-aligned disclosure.",
        "B3-ISE": "B3 Corporate Sustainability Index (Brazil).",
        "SEC-Climate": "U.S. SEC climate disclosure rule.",
        "PCAF": "Financed emissions accounting (banking).",
        "SBTi-Buildings": "Science-Based Targets for buildings.",
        "GRESB": "Real estate ESG benchmark.",
        "ICMM": "International Council on Mining & Metals principles.",
        "SBTN": "Science-Based Targets for Nature.",
    }

    return [
        {"code": code, "rationale": rationales.get(code, "Recommended for your profile.")}
        for code in ordered[:8]
    ]
