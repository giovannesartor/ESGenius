"""Unit reconciliation — deterministic SI conversions for ESG metrics.

Avoids delegating unit normalization to the LLM (slow + error-prone).
"""

from typing import Optional

# Canonical units per dimension
CANONICAL = {
    "mass": "kg",
    "energy": "MWh",
    "volume_liquid": "L",
    "volume_gas": "m3",
    "distance": "km",
    "co2": "tCO2e",
    "currency": "USD",
    "percent": "%",
    "ratio": "ratio",
    "count": "count",
    "time": "h",
    "area": "m2",
}

# Conversion table: (unit_aliases) -> (dimension, factor_to_canonical)
_FACTORS: dict[str, tuple[str, float]] = {
    # mass
    "g": ("mass", 0.001),
    "kg": ("mass", 1.0),
    "t": ("mass", 1000.0),
    "ton": ("mass", 1000.0),
    "tonne": ("mass", 1000.0),
    "tonnes": ("mass", 1000.0),
    "metric ton": ("mass", 1000.0),
    "lb": ("mass", 0.453592),
    "lbs": ("mass", 0.453592),
    # CO2-specific (treated as mass in tCO2e)
    "kgco2e": ("co2", 0.001),
    "kgco2": ("co2", 0.001),
    "tco2e": ("co2", 1.0),
    "tco2": ("co2", 1.0),
    "mtco2e": ("co2", 1_000_000.0),  # million tonnes
    "gco2e": ("co2", 1e-6),
    # energy
    "j": ("energy", 1 / 3.6e9),
    "kj": ("energy", 1 / 3.6e6),
    "mj": ("energy", 1 / 3600.0),
    "gj": ("energy", 1 / 3.6),
    "tj": ("energy", 277.778),
    "wh": ("energy", 1e-6),
    "kwh": ("energy", 0.001),
    "mwh": ("energy", 1.0),
    "gwh": ("energy", 1000.0),
    "twh": ("energy", 1_000_000.0),
    "kcal": ("energy", 1.163e-6),
    # volume liquid
    "ml": ("volume_liquid", 0.001),
    "l": ("volume_liquid", 1.0),
    "liter": ("volume_liquid", 1.0),
    "liters": ("volume_liquid", 1.0),
    "litre": ("volume_liquid", 1.0),
    "m3": ("volume_liquid", 1000.0),
    "gal": ("volume_liquid", 3.78541),
    "bbl": ("volume_liquid", 158.987),
    # volume gas
    "scm": ("volume_gas", 1.0),
    "nm3": ("volume_gas", 1.0),
    "scf": ("volume_gas", 0.0283168),
    "mcf": ("volume_gas", 28.3168),
    # distance
    "m": ("distance", 0.001),
    "km": ("distance", 1.0),
    "mi": ("distance", 1.609344),
    "miles": ("distance", 1.609344),
    # currency (1:1, normalized later)
    "usd": ("currency", 1.0),
    "$": ("currency", 1.0),
    "brl": ("currency", 1.0),
    "r$": ("currency", 1.0),
    "eur": ("currency", 1.0),
    "€": ("currency", 1.0),
    # percent / ratio / count
    "%": ("percent", 1.0),
    "percent": ("percent", 1.0),
    "ratio": ("ratio", 1.0),
    "count": ("count", 1.0),
    "unit": ("count", 1.0),
    "units": ("count", 1.0),
    # time
    "s": ("time", 1 / 3600.0),
    "min": ("time", 1 / 60.0),
    "h": ("time", 1.0),
    "hour": ("time", 1.0),
    "hours": ("time", 1.0),
    "d": ("time", 24.0),
    # area
    "m2": ("area", 1.0),
    "ha": ("area", 10000.0),
    "km2": ("area", 1_000_000.0),
}


def _normalize_unit_str(unit: str) -> str:
    return unit.strip().lower().replace(" ", "").replace("²", "2").replace("³", "3")


def get_canonical(unit: str) -> Optional[tuple[str, str, float]]:
    """Returns (dimension, canonical_unit, factor_to_canonical) or None."""
    if not unit:
        return None
    norm = _normalize_unit_str(unit)
    if norm in _FACTORS:
        dim, factor = _FACTORS[norm]
        return dim, CANONICAL[dim], factor
    # try without trailing 's'
    if norm.endswith("s") and norm[:-1] in _FACTORS:
        dim, factor = _FACTORS[norm[:-1]]
        return dim, CANONICAL[dim], factor
    return None


def convert(value: float, from_unit: str, to_unit: str) -> Optional[float]:
    """Convert a numeric value between two compatible units."""
    src = get_canonical(from_unit)
    dst = get_canonical(to_unit)
    if not src or not dst or src[0] != dst[0]:
        return None
    canonical_value = value * src[2]
    return canonical_value / dst[2]


def to_canonical(value: float, unit: str) -> Optional[tuple[float, str]]:
    """Normalize a value+unit to its canonical SI form."""
    info = get_canonical(unit)
    if not info:
        return None
    return value * info[2], info[1]


def reconcile(value: float, unit: str) -> dict:
    """High-level helper. Returns dict with original + canonical."""
    info = get_canonical(unit)
    if not info:
        return {
            "original_value": value,
            "original_unit": unit,
            "canonical_value": None,
            "canonical_unit": None,
            "dimension": None,
            "converted": False,
        }
    dim, canonical_unit, factor = info
    return {
        "original_value": value,
        "original_unit": unit,
        "canonical_value": value * factor,
        "canonical_unit": canonical_unit,
        "dimension": dim,
        "converted": True,
    }
