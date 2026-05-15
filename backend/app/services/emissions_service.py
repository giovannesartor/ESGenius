"""Carbon emissions calculator — Scope 1/2/3 with emission factors."""

from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.regulatory import CarbonEmission
from app.repositories.platform_repos import (
    CarbonEmissionRepository,
    EmissionFactorRepository,
)
from app.services.units_service import convert


class EmissionsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.factor_repo = EmissionFactorRepository(db)
        self.emission_repo = CarbonEmissionRepository(db)

    async def calculate(
        self,
        scope: int,
        category: str,
        activity: str,
        quantity: float,
        unit: str,
        region: Optional[str] = None,
    ) -> dict:
        """Calculate kgCO2e for an activity. Returns dict with details."""
        factor = await self.factor_repo.find_factor(scope, activity, region)
        if not factor:
            raise ValueError(
                f"No emission factor found for scope={scope}, activity='{activity}'"
            )

        # If units differ, convert quantity to factor.unit
        if unit.lower() != factor.unit.lower():
            converted = convert(quantity, unit, factor.unit)
            if converted is None:
                raise ValueError(
                    f"Cannot convert {unit} to {factor.unit} for activity '{activity}'"
                )
            quantity_in_factor_unit = converted
        else:
            quantity_in_factor_unit = quantity

        co2e_kg = quantity_in_factor_unit * factor.factor
        return {
            "co2e_kg": co2e_kg,
            "co2e_tonnes": co2e_kg / 1000.0,
            "factor_used": factor.factor,
            "factor_unit": factor.unit,
            "factor_source": factor.source,
            "scope": scope,
            "factor_id": factor.id,
        }

    async def record(
        self,
        company_id: UUID,
        scope: int,
        category: str,
        activity: str,
        quantity: float,
        unit: str,
        year: int,
        region: Optional[str] = None,
        notes: Optional[str] = None,
        created_by: Optional[UUID] = None,
    ) -> CarbonEmission:
        """Calculate and persist an emission record."""
        result = await self.calculate(scope, category, activity, quantity, unit, region)
        emission = CarbonEmission(
            company_id=company_id,
            year=year,
            scope=scope,
            category=category,
            activity=activity,
            quantity=quantity,
            unit=unit,
            factor_id=result["factor_id"],
            co2e_kg=result["co2e_kg"],
            notes=notes,
            created_by=created_by,
        )
        return await self.emission_repo.create(emission)

    async def summary(self, company_id: UUID, year: int) -> dict:
        emissions = await self.emission_repo.list_for_company(company_id, year=year)
        scope_totals = {1: 0.0, 2: 0.0, 3: 0.0}
        by_category: dict[str, float] = {}
        for e in emissions:
            scope_totals[e.scope] = scope_totals.get(e.scope, 0.0) + e.co2e_kg
            key = f"scope_{e.scope}_{e.category}"
            by_category[key] = by_category.get(key, 0.0) + e.co2e_kg
        total = sum(scope_totals.values())
        return {
            "year": year,
            "scope_1_kg": scope_totals[1],
            "scope_2_kg": scope_totals[2],
            "scope_3_kg": scope_totals[3],
            "total_kg": total,
            "total_tonnes": total / 1000.0,
            "by_category": by_category,
        }
