"""Seed script for platform features:
- ESG frameworks (CSRD/ESRS, ISSB IFRS S1/S2, CDP, B3, CVM 193, Taxonomia BR)
- Emission factors (GHG Protocol + IPCC AR6 essentials)
- Sector benchmarks (anonymized starter data)
- Report templates (official starter set)

Run: python seed_platform.py
Idempotent: skips if records already exist.
"""

import asyncio
from datetime import date, datetime, timezone

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.domain.models.framework import Framework
from app.domain.models.regulatory import EmissionFactor, RegulatoryUpdate, SectorBenchmark
from app.domain.models.report_version import ReportTemplate


# ---------- Frameworks ----------
FRAMEWORKS = [
    {
        "code": "CSRD",
        "name": "Corporate Sustainability Reporting Directive (ESRS)",
        "description": "EU directive requiring sustainability disclosure under ESRS standards (E1-E5, S1-S4, G1).",
        "version": "2024",
    },
    {
        "code": "ISSB",
        "name": "ISSB IFRS S1 / S2",
        "description": "International Sustainability Standards Board: IFRS S1 (general) and S2 (climate-related).",
        "version": "2023",
    },
    {
        "code": "CDP",
        "name": "CDP Climate / Water / Forests",
        "description": "Carbon Disclosure Project questionnaires for environmental disclosure.",
        "version": "2024",
    },
    {
        "code": "B3",
        "name": "B3 Practique ou Explique ESG",
        "description": "Bolsa brasileira: práticas ESG comply-or-explain para companhias listadas.",
        "version": "2024",
    },
    {
        "code": "CVM193",
        "name": "CVM Resolução 193 (ISSB BR)",
        "description": "Resolução 193 da CVM: divulgação obrigatória de informações financeiras relacionadas à sustentabilidade no Brasil (alinhada ao ISSB).",
        "version": "2023",
    },
    {
        "code": "TAXONOMIA-BR",
        "name": "Taxonomia Sustentável Brasileira",
        "description": "Taxonomia oficial brasileira de atividades econômicas sustentáveis.",
        "version": "2025",
    },
    {
        "code": "GRI",
        "name": "Global Reporting Initiative",
        "description": "Padrão global de relato de sustentabilidade (GRI Universal + Topic Standards).",
        "version": "2021",
    },
    {
        "code": "SASB",
        "name": "SASB Standards",
        "description": "Sustainability Accounting Standards Board: padrões setoriais (agora sob ISSB).",
        "version": "2023",
    },
    {
        "code": "TCFD",
        "name": "Task Force on Climate-related Financial Disclosures",
        "description": "Recomendações TCFD para divulgação climática (incorporada ao IFRS S2).",
        "version": "2017",
    },
]


# ---------- Emission factors (GHG Protocol + IPCC AR6) ----------
EMISSION_FACTORS = [
    # Scope 1 - Stationary combustion
    {"scope": 1, "category": "stationary_combustion", "activity": "natural_gas", "unit": "m3", "factor": 2.02, "source": "IPCC AR6", "region": None},
    {"scope": 1, "category": "stationary_combustion", "activity": "diesel", "unit": "L", "factor": 2.68, "source": "IPCC AR6", "region": None},
    {"scope": 1, "category": "stationary_combustion", "activity": "lpg", "unit": "kg", "factor": 2.94, "source": "IPCC AR6", "region": None},
    {"scope": 1, "category": "stationary_combustion", "activity": "fuel_oil", "unit": "L", "factor": 3.15, "source": "IPCC AR6", "region": None},
    {"scope": 1, "category": "stationary_combustion", "activity": "coal", "unit": "kg", "factor": 2.42, "source": "IPCC AR6", "region": None},
    # Scope 1 - Mobile combustion
    {"scope": 1, "category": "mobile_combustion", "activity": "gasoline", "unit": "L", "factor": 2.31, "source": "IPCC AR6", "region": None},
    {"scope": 1, "category": "mobile_combustion", "activity": "diesel", "unit": "L", "factor": 2.68, "source": "IPCC AR6", "region": None},
    {"scope": 1, "category": "mobile_combustion", "activity": "ethanol", "unit": "L", "factor": 1.51, "source": "IPCC AR6", "region": "BR"},
    {"scope": 1, "category": "mobile_combustion", "activity": "biodiesel", "unit": "L", "factor": 2.50, "source": "IPCC AR6", "region": None},
    # Scope 1 - Fugitive
    {"scope": 1, "category": "fugitive", "activity": "r410a", "unit": "kg", "factor": 2088.0, "source": "IPCC AR6 GWP100", "region": None},
    {"scope": 1, "category": "fugitive", "activity": "r134a", "unit": "kg", "factor": 1430.0, "source": "IPCC AR6 GWP100", "region": None},
    # Scope 2 - Electricity (location-based)
    {"scope": 2, "category": "electricity", "activity": "grid_electricity", "unit": "kWh", "factor": 0.0817, "source": "MCTI BR 2024", "region": "BR"},
    {"scope": 2, "category": "electricity", "activity": "grid_electricity", "unit": "kWh", "factor": 0.231, "source": "EEA 2023", "region": "EU"},
    {"scope": 2, "category": "electricity", "activity": "grid_electricity", "unit": "kWh", "factor": 0.386, "source": "EPA eGRID 2023", "region": "US"},
    {"scope": 2, "category": "electricity", "activity": "grid_electricity", "unit": "kWh", "factor": 0.475, "source": "IEA 2023", "region": None},
    # Scope 2 - Heat / Steam
    {"scope": 2, "category": "heat", "activity": "purchased_steam", "unit": "kWh", "factor": 0.215, "source": "DEFRA 2024", "region": None},
    # Scope 3 - Business travel
    {"scope": 3, "category": "business_travel", "activity": "flight_short_haul", "unit": "km", "factor": 0.158, "source": "DEFRA 2024", "region": None},
    {"scope": 3, "category": "business_travel", "activity": "flight_long_haul", "unit": "km", "factor": 0.195, "source": "DEFRA 2024", "region": None},
    {"scope": 3, "category": "business_travel", "activity": "car_rental", "unit": "km", "factor": 0.171, "source": "DEFRA 2024", "region": None},
    {"scope": 3, "category": "business_travel", "activity": "train", "unit": "km", "factor": 0.035, "source": "DEFRA 2024", "region": None},
    # Scope 3 - Transportation
    {"scope": 3, "category": "transportation", "activity": "freight_truck", "unit": "tkm", "factor": 0.105, "source": "GLEC 2023", "region": None},
    {"scope": 3, "category": "transportation", "activity": "freight_rail", "unit": "tkm", "factor": 0.022, "source": "GLEC 2023", "region": None},
    {"scope": 3, "category": "transportation", "activity": "freight_sea", "unit": "tkm", "factor": 0.014, "source": "GLEC 2023", "region": None},
    {"scope": 3, "category": "transportation", "activity": "freight_air", "unit": "tkm", "factor": 1.13, "source": "GLEC 2023", "region": None},
    # Scope 3 - Waste
    {"scope": 3, "category": "waste", "activity": "landfill", "unit": "kg", "factor": 0.467, "source": "EPA WARM v15", "region": None},
    {"scope": 3, "category": "waste", "activity": "recycling", "unit": "kg", "factor": 0.021, "source": "EPA WARM v15", "region": None},
    {"scope": 3, "category": "waste", "activity": "composting", "unit": "kg", "factor": 0.010, "source": "EPA WARM v15", "region": None},
    {"scope": 3, "category": "waste", "activity": "incineration", "unit": "kg", "factor": 0.220, "source": "EPA WARM v15", "region": None},
    # Scope 3 - Water
    {"scope": 3, "category": "water", "activity": "supply", "unit": "m3", "factor": 0.344, "source": "DEFRA 2024", "region": None},
    {"scope": 3, "category": "water", "activity": "treatment", "unit": "m3", "factor": 0.708, "source": "DEFRA 2024", "region": None},
]


# ---------- Sector benchmarks (starter — public sources/estimates) ----------
SECTOR_BENCHMARKS = [
    # Mining
    {"sector": "mining", "year": 2024, "metric_code": "ghg_intensity", "avg_value": 142.5, "median_value": 128.0, "p25": 95.0, "p75": 175.0, "unit": "tCO2e/M$", "sample_size": 42, "region": None},
    {"sector": "mining", "year": 2024, "metric_code": "water_intensity", "avg_value": 0.85, "median_value": 0.74, "p25": 0.41, "p75": 1.18, "unit": "m3/$", "sample_size": 38, "region": None},
    {"sector": "mining", "year": 2024, "metric_code": "trir", "avg_value": 1.42, "median_value": 1.10, "p25": 0.72, "p75": 1.95, "unit": "per 200k h", "sample_size": 50, "region": None},
    # Banking
    {"sector": "banking", "year": 2024, "metric_code": "ghg_intensity", "avg_value": 8.2, "median_value": 6.5, "p25": 3.1, "p75": 11.8, "unit": "tCO2e/M$", "sample_size": 65, "region": None},
    {"sector": "banking", "year": 2024, "metric_code": "financed_emissions_pct_disclosed", "avg_value": 62.0, "median_value": 70.0, "p25": 35.0, "p75": 90.0, "unit": "%", "sample_size": 58, "region": None},
    # Energy
    {"sector": "energy", "year": 2024, "metric_code": "ghg_intensity", "avg_value": 385.0, "median_value": 320.0, "p25": 180.0, "p75": 510.0, "unit": "tCO2e/M$", "sample_size": 48, "region": None},
    {"sector": "energy", "year": 2024, "metric_code": "renewable_share", "avg_value": 28.5, "median_value": 22.0, "p25": 8.0, "p75": 45.0, "unit": "%", "sample_size": 48, "region": None},
    # Retail
    {"sector": "retail", "year": 2024, "metric_code": "ghg_intensity", "avg_value": 24.5, "median_value": 19.0, "p25": 11.0, "p75": 32.0, "unit": "tCO2e/M$", "sample_size": 72, "region": None},
    {"sector": "retail", "year": 2024, "metric_code": "waste_recycled_pct", "avg_value": 58.0, "median_value": 62.0, "p25": 41.0, "p75": 78.0, "unit": "%", "sample_size": 70, "region": None},
    # Tech
    {"sector": "tech", "year": 2024, "metric_code": "ghg_intensity", "avg_value": 6.8, "median_value": 4.2, "p25": 2.1, "p75": 9.5, "unit": "tCO2e/M$", "sample_size": 95, "region": None},
    {"sector": "tech", "year": 2024, "metric_code": "renewable_share", "avg_value": 72.0, "median_value": 80.0, "p25": 50.0, "p75": 95.0, "unit": "%", "sample_size": 85, "region": None},
    # Manufacturing
    {"sector": "manufacturing", "year": 2024, "metric_code": "ghg_intensity", "avg_value": 95.0, "median_value": 78.0, "p25": 42.0, "p75": 125.0, "unit": "tCO2e/M$", "sample_size": 110, "region": None},
    # Agriculture
    {"sector": "agriculture", "year": 2024, "metric_code": "ghg_intensity", "avg_value": 215.0, "median_value": 180.0, "p25": 95.0, "p75": 295.0, "unit": "tCO2e/M$", "sample_size": 35, "region": None},
    {"sector": "agriculture", "year": 2024, "metric_code": "water_intensity", "avg_value": 4.2, "median_value": 3.5, "p25": 1.8, "p75": 5.9, "unit": "m3/$", "sample_size": 35, "region": None},
    # Construction
    {"sector": "construction", "year": 2024, "metric_code": "ghg_intensity", "avg_value": 78.0, "median_value": 65.0, "p25": 38.0, "p75": 105.0, "unit": "tCO2e/M$", "sample_size": 55, "region": None},
    {"sector": "construction", "year": 2024, "metric_code": "trir", "avg_value": 2.85, "median_value": 2.40, "p25": 1.55, "p75": 3.75, "unit": "per 200k h", "sample_size": 60, "region": None},
]


# ---------- Report templates ----------
REPORT_TEMPLATES = [
    {
        "name": "GRI Standards 2021 — Universal + Core",
        "slug": "gri-2021-universal-core",
        "description": "Relatório completo seguindo GRI 1, 2, 3 e topic standards principais.",
        "framework_codes": ["GRI"],
        "language": "pt",
        "is_official": True,
        "structure": {
            "sections": [
                {"id": "gri_2", "title": "GRI 2 — Disclosures Gerais", "prompts": ["Atividades e trabalhadores", "Governança", "Estratégia, políticas e práticas"]},
                {"id": "gri_3", "title": "GRI 3 — Tópicos Materiais", "prompts": ["Lista de tópicos materiais", "Gestão de tópicos materiais"]},
                {"id": "gri_300", "title": "Ambiental (300 series)", "prompts": ["Energia (302)", "Água (303)", "Emissões (305)", "Resíduos (306)"]},
                {"id": "gri_400", "title": "Social (400 series)", "prompts": ["Emprego (401)", "Saúde e segurança (403)", "Diversidade (405)"]},
            ]
        },
    },
    {
        "name": "CSRD / ESRS — Full Set",
        "slug": "csrd-esrs-full",
        "description": "Relatório alinhado às 12 normas ESRS (E1-E5, S1-S4, G1, ESRS 1, ESRS 2).",
        "framework_codes": ["CSRD"],
        "region": "EU",
        "language": "en",
        "is_official": True,
        "structure": {
            "sections": [
                {"id": "esrs_1", "title": "ESRS 1 — General Requirements"},
                {"id": "esrs_2", "title": "ESRS 2 — General Disclosures"},
                {"id": "e1", "title": "E1 — Climate Change"},
                {"id": "e2", "title": "E2 — Pollution"},
                {"id": "e3", "title": "E3 — Water & Marine Resources"},
                {"id": "e4", "title": "E4 — Biodiversity & Ecosystems"},
                {"id": "e5", "title": "E5 — Resource Use & Circular Economy"},
                {"id": "s1", "title": "S1 — Own Workforce"},
                {"id": "s2", "title": "S2 — Workers in Value Chain"},
                {"id": "s3", "title": "S3 — Affected Communities"},
                {"id": "s4", "title": "S4 — Consumers & End-Users"},
                {"id": "g1", "title": "G1 — Business Conduct"},
            ]
        },
    },
    {
        "name": "ISSB IFRS S1 + S2",
        "slug": "issb-s1-s2",
        "description": "Divulgações IFRS S1 (gerais) e S2 (clima) alinhadas ao TCFD.",
        "framework_codes": ["ISSB", "TCFD"],
        "language": "en",
        "is_official": True,
        "structure": {
            "sections": [
                {"id": "s1_governance", "title": "S1 — Governance"},
                {"id": "s1_strategy", "title": "S1 — Strategy"},
                {"id": "s1_risk", "title": "S1 — Risk Management"},
                {"id": "s1_metrics", "title": "S1 — Metrics & Targets"},
                {"id": "s2_climate", "title": "S2 — Climate-related Disclosures"},
                {"id": "s2_scenario", "title": "S2 — Scenario Analysis"},
                {"id": "s2_scope123", "title": "S2 — Scope 1/2/3 Emissions"},
            ]
        },
    },
    {
        "name": "CVM 193 — Relato BR ISSB",
        "slug": "cvm-193-br",
        "description": "Modelo brasileiro alinhado à Resolução CVM 193 (adoção ISSB no Brasil).",
        "framework_codes": ["CVM193", "ISSB"],
        "region": "BR",
        "language": "pt",
        "is_official": True,
        "structure": {
            "sections": [
                {"id": "governanca", "title": "Governança"},
                {"id": "estrategia", "title": "Estratégia climática"},
                {"id": "riscos", "title": "Gestão de riscos e oportunidades climáticas"},
                {"id": "metricas", "title": "Métricas e metas (Scope 1/2/3)"},
                {"id": "metas_transicao", "title": "Plano de transição climática"},
            ]
        },
    },
    {
        "name": "B3 Practique ou Explique",
        "slug": "b3-practique-explique",
        "description": "Modelo para companhias listadas na B3 — comply-or-explain ESG.",
        "framework_codes": ["B3"],
        "region": "BR",
        "language": "pt",
        "is_official": True,
        "structure": {
            "sections": [
                {"id": "ambiental", "title": "Ambiental — emissões, energia, água, resíduos"},
                {"id": "social", "title": "Social — diversidade, saúde e segurança, comunidades"},
                {"id": "governanca", "title": "Governança — composição do conselho, ética, anticorrupção"},
            ]
        },
    },
    {
        "name": "CDP Climate Change",
        "slug": "cdp-climate",
        "description": "Questionário CDP Climate Change (módulos C0-C15).",
        "framework_codes": ["CDP"],
        "language": "en",
        "is_official": True,
        "structure": {
            "sections": [
                {"id": "c1", "title": "C1 Governance"},
                {"id": "c2", "title": "C2 Risks & Opportunities"},
                {"id": "c3", "title": "C3 Business Strategy"},
                {"id": "c4", "title": "C4 Targets & Performance"},
                {"id": "c5", "title": "C5 Emissions Methodology"},
                {"id": "c6", "title": "C6 Emissions Data"},
                {"id": "c7", "title": "C7 Emissions Breakdown"},
            ]
        },
    },
    {
        "name": "TCFD — Standalone",
        "slug": "tcfd-standalone",
        "description": "Disclosure climático autônomo TCFD (4 pilares).",
        "framework_codes": ["TCFD"],
        "language": "en",
        "is_official": True,
        "structure": {
            "sections": [
                {"id": "governance", "title": "Governance"},
                {"id": "strategy", "title": "Strategy"},
                {"id": "risk", "title": "Risk Management"},
                {"id": "metrics", "title": "Metrics & Targets"},
            ]
        },
    },
    {
        "name": "Mining Sector — SASB EM-MM",
        "slug": "sasb-mining",
        "description": "Padrão setorial SASB para mineração metálica.",
        "framework_codes": ["SASB"],
        "sector": "mining",
        "language": "en",
        "is_official": True,
        "structure": {
            "sections": [
                {"id": "ghg", "title": "GHG Emissions"},
                {"id": "air", "title": "Air Quality"},
                {"id": "energy", "title": "Energy Management"},
                {"id": "water", "title": "Water Management"},
                {"id": "waste", "title": "Waste & Hazardous Materials"},
                {"id": "biodiversity", "title": "Biodiversity Impacts"},
                {"id": "community", "title": "Community Relations"},
                {"id": "labor", "title": "Labor Practices"},
                {"id": "safety", "title": "Workforce Health & Safety"},
            ]
        },
    },
]


# ---------- Regulatory updates (starter feed) ----------
REGULATORY_UPDATES = [
    {
        "title": "CVM Resolução 193 entra em vigor",
        "summary": "Companhias abertas brasileiras devem divulgar informações financeiras relacionadas à sustentabilidade alinhadas ao ISSB.",
        "source": "CVM",
        "region": "BR",
        "framework_codes": ["CVM193", "ISSB"],
        "severity": "critical",
        "effective_date": date(2026, 1, 1),
        "deadline_date": date(2026, 12, 31),
        "url": "https://conteudo.cvm.gov.br/legislacao/resolucoes/resol193.html",
    },
    {
        "title": "ESRS — primeira onda de relatórios CSRD",
        "summary": "Grandes empresas europeias publicam primeiros relatórios sob ESRS referentes a 2024.",
        "source": "EFRAG",
        "region": "EU",
        "framework_codes": ["CSRD"],
        "severity": "warning",
        "effective_date": date(2025, 1, 1),
        "url": "https://www.efrag.org/",
    },
    {
        "title": "Taxonomia Sustentável Brasileira — consulta pública",
        "summary": "Ministério da Fazenda publica taxonomia BR para classificação de atividades sustentáveis.",
        "source": "Ministério da Fazenda",
        "region": "BR",
        "framework_codes": ["TAXONOMIA-BR"],
        "severity": "info",
        "effective_date": date(2025, 6, 1),
        "url": "https://www.gov.br/fazenda/",
    },
    {
        "title": "CDP 2025 — abertura do questionário",
        "summary": "CDP abre janela de submissão para questionários Climate, Water e Forests.",
        "source": "CDP",
        "region": None,
        "framework_codes": ["CDP"],
        "severity": "info",
        "deadline_date": date(2026, 7, 30),
        "url": "https://www.cdp.net/",
    },
]


async def _exists(db, model, **filters):
    stmt = select(model).filter_by(**filters).limit(1)
    return (await db.execute(stmt)).scalar_one_or_none() is not None


async def seed_frameworks(db):
    created = 0
    for f in FRAMEWORKS:
        if await _exists(db, Framework, code=f["code"]):
            continue
        db.add(Framework(**f, is_active=True))
        created += 1
    print(f"  frameworks: +{created}")


async def seed_emission_factors(db):
    created = 0
    for f in EMISSION_FACTORS:
        if await _exists(db, EmissionFactor, scope=f["scope"], activity=f["activity"], unit=f["unit"], region=f.get("region")):
            continue
        db.add(EmissionFactor(year=2024, **f))
        created += 1
    print(f"  emission_factors: +{created}")


async def seed_benchmarks(db):
    created = 0
    for b in SECTOR_BENCHMARKS:
        if await _exists(db, SectorBenchmark, sector=b["sector"], year=b["year"], metric_code=b["metric_code"], region=b.get("region")):
            continue
        db.add(SectorBenchmark(**b))
        created += 1
    print(f"  sector_benchmarks: +{created}")


async def seed_templates(db):
    created = 0
    for t in REPORT_TEMPLATES:
        if await _exists(db, ReportTemplate, slug=t["slug"]):
            continue
        db.add(ReportTemplate(**t))
        created += 1
    print(f"  report_templates: +{created}")


async def seed_regulatory(db):
    created = 0
    for r in REGULATORY_UPDATES:
        if await _exists(db, RegulatoryUpdate, title=r["title"]):
            continue
        db.add(RegulatoryUpdate(published_at=datetime.now(timezone.utc), sectors=[], **r))
        created += 1
    print(f"  regulatory_updates: +{created}")


async def main():
    print("Seeding platform data...")
    async with AsyncSessionLocal() as db:
        await seed_frameworks(db)
        await seed_emission_factors(db)
        await seed_benchmarks(db)
        await seed_templates(db)
        await seed_regulatory(db)
        await db.commit()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
