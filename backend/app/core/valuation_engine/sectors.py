"""
ESG360 Valuation Engine — Industry Sectors
Ported from Valuora v7.1. Sector IDs kept as legacy identifiers.
Labels are in English; CNAE codes retained for reference only (not used in ESG360).
"""

from typing import Dict, List, Any


IBGE_SECTORS: List[Dict[str, Any]] = [
    # Technology & Digital
    {"id": "tecnologia",        "label": "Information Technology",        "group": "Technology & Digital",      "liquidity": "high"},
    {"id": "saas",              "label": "SaaS / Digital Services",       "group": "Technology & Digital",      "liquidity": "high"},
    {"id": "ecommerce",         "label": "E-commerce",                    "group": "Technology & Digital",      "liquidity": "high"},
    {"id": "fintech",           "label": "Fintech / Financial Services",  "group": "Technology & Digital",      "liquidity": "high"},
    # Healthcare
    {"id": "saude",             "label": "Healthcare / Clinics",          "group": "Healthcare & Wellness",     "liquidity": "medium"},
    {"id": "farmacia",          "label": "Pharmaceuticals",               "group": "Healthcare & Wellness",     "liquidity": "medium"},
    {"id": "estetica",          "label": "Aesthetics / Wellness",         "group": "Healthcare & Wellness",     "liquidity": "medium"},
    # Commerce
    {"id": "varejo",            "label": "Retail / Commerce",             "group": "Commerce & Retail",         "liquidity": "medium"},
    {"id": "atacado",           "label": "Wholesale / Distribution",      "group": "Commerce & Retail",         "liquidity": "medium"},
    # Industry
    {"id": "industria",         "label": "Industry / Manufacturing",      "group": "Industry & Manufacturing",  "liquidity": "low"},
    {"id": "alimentos_industria","label": "Food Industry",                "group": "Industry & Manufacturing",  "liquidity": "low"},
    {"id": "textil",            "label": "Textile / Apparel",             "group": "Industry & Manufacturing",  "liquidity": "low"},
    {"id": "quimica",           "label": "Chemicals / Plastics",          "group": "Industry & Manufacturing",  "liquidity": "low"},
    # Professional Services
    {"id": "consultoria",       "label": "Consulting",                    "group": "Professional Services",     "liquidity": "medium"},
    {"id": "contabilidade",     "label": "Accounting / Legal",            "group": "Professional Services",     "liquidity": "medium"},
    {"id": "marketing",         "label": "Marketing / Advertising",       "group": "Professional Services",     "liquidity": "medium"},
    {"id": "servicos",          "label": "General Services",              "group": "Professional Services",     "liquidity": "medium"},
    # Food & Hospitality
    {"id": "alimentacao",       "label": "Food & Restaurants",            "group": "Food & Hospitality",        "liquidity": "medium"},
    {"id": "hotelaria",         "label": "Hotels / Tourism",              "group": "Food & Hospitality",        "liquidity": "low"},
    # Education
    {"id": "educacao",          "label": "Education",                     "group": "Education",                 "liquidity": "medium"},
    {"id": "edtech",            "label": "EdTech / Online Education",     "group": "Education",                 "liquidity": "high"},
    # Construction & Real Estate
    {"id": "construcao",        "label": "Construction",                  "group": "Construction & Real Estate","liquidity": "low"},
    {"id": "imobiliario",       "label": "Real Estate",                   "group": "Construction & Real Estate","liquidity": "low"},
    # Agribusiness
    {"id": "agronegocio",       "label": "Agribusiness",                  "group": "Agribusiness",              "liquidity": "low"},
    {"id": "agritech",          "label": "AgriTech",                      "group": "Agribusiness",              "liquidity": "medium"},
    # Logistics
    {"id": "logistica",         "label": "Logistics / Transportation",    "group": "Logistics & Transportation","liquidity": "medium"},
    {"id": "entregas",          "label": "Delivery / Last-mile",          "group": "Logistics & Transportation","liquidity": "medium"},
    # Energy
    {"id": "energia",           "label": "Energy",                        "group": "Energy & Infrastructure",   "liquidity": "low"},
    {"id": "energia_solar",     "label": "Solar / Renewable Energy",      "group": "Energy & Infrastructure",   "liquidity": "medium"},
    # Financial
    {"id": "financeiro",        "label": "Financial Services",            "group": "Financial",                 "liquidity": "high"},
    {"id": "seguros",           "label": "Insurance",                     "group": "Financial",                 "liquidity": "medium"},
    # Media & Entertainment
    {"id": "midia",             "label": "Media / Entertainment",         "group": "Media & Entertainment",     "liquidity": "medium"},
    {"id": "games",             "label": "Games / Digital Gaming",        "group": "Media & Entertainment",     "liquidity": "high"},
    # Other
    {"id": "outros",            "label": "Other",                         "group": "Other",                     "liquidity": "medium"},
]

SECTOR_BY_ID: Dict[str, Dict[str, Any]] = {s["id"]: s for s in IBGE_SECTORS}
SECTOR_LABELS: Dict[str, str] = {s["id"]: s["label"] for s in IBGE_SECTORS}
SECTOR_LIQUIDITY: Dict[str, str] = {s["id"]: s["liquidity"] for s in IBGE_SECTORS}


def get_sector_list() -> List[Dict[str, str]]:
    return [{"id": s["id"], "label": s["label"], "group": s["group"]} for s in IBGE_SECTORS]


def get_sector_label(sector_id: str) -> str:
    return SECTOR_LABELS.get(sector_id.lower().strip(), sector_id.capitalize())


def get_sector_liquidity(sector_id: str) -> str:
    return SECTOR_LIQUIDITY.get(sector_id.lower().strip(), "medium")


def is_valid_sector(sector_id: str) -> bool:
    return sector_id.lower().strip() in SECTOR_BY_ID
