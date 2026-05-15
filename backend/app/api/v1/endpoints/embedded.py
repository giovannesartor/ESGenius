"""
Embeddable widget endpoint.

Returns an HTML snippet (plus a JSON variant) that can be `<iframe>`-loaded by
any third party — used for "Powered by ESG360" badges on company websites,
investor relations pages and broker reports.

CORS is permissive (open) for these read-only endpoints. They do NOT require
authentication; anyone can show a public ESG score for a company.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.financial_score_service import FinancialScoreService

router = APIRouter(prefix="/embed", tags=["Embed"])


@router.get("/score/{company_id}.json")
async def embed_score_json(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    score = await FinancialScoreService.latest_for_company(db, company_id)
    if not score:
        raise HTTPException(404, "No public score available")
    return {
        "company_id": str(company_id),
        "score": score.score,
        "rating_band": score.rating_band,
        "spread_bps": score.spread_bps,
        "year": score.year,
        "powered_by": "ESG360",
        "url": f"https://esg360.digital/companies/{company_id}",
    }


@router.get("/score/{company_id}.html", response_class=HTMLResponse)
async def embed_score_html(
    company_id: UUID,
    theme: str = Query(default="light", regex="^(light|dark)$"),
    db: AsyncSession = Depends(get_db),
):
    score = await FinancialScoreService.latest_for_company(db, company_id)
    if not score:
        return HTMLResponse(
            content=_no_score_html(theme), status_code=404,
            headers={"Cache-Control": "public, max-age=300"},
        )
    color_score = (
        "#16a34a" if score.score >= 70 else "#f59e0b" if score.score >= 40 else "#dc2626"
    )
    bg = "#0b0f17" if theme == "dark" else "#ffffff"
    fg = "#f8fafc" if theme == "dark" else "#0f172a"
    sub = "#94a3b8" if theme == "dark" else "#64748b"
    border = "#1e293b" if theme == "dark" else "#e2e8f0"

    bps_label = (
        f"{score.spread_bps:+.0f} bps"
        if score.spread_bps is not None
        else "—"
    )

    html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>ESG360 Score Widget</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body {{ margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
         background:{bg}; color:{fg}; }}
  .card {{ display:flex; align-items:center; gap:16px; padding:16px 20px;
          border:1px solid {border}; border-radius:12px; max-width:360px; }}
  .ring {{ width:64px; height:64px; border-radius:50%; display:flex; align-items:center;
          justify-content:center; background:conic-gradient({color_score} {score.score * 3.6}deg, {border} 0); }}
  .inner {{ width:52px; height:52px; border-radius:50%; background:{bg}; display:flex;
           align-items:center; justify-content:center; font-weight:700; color:{color_score}; }}
  .meta .label {{ font-size:11px; color:{sub}; text-transform:uppercase; letter-spacing:0.06em; }}
  .meta .value {{ font-size:18px; font-weight:600; }}
  .badge {{ display:inline-block; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:600;
           background:{color_score}; color:white; margin-left:6px; }}
  a {{ color:{sub}; font-size:11px; text-decoration:none; }}
</style></head>
<body>
  <div class="card">
    <div class="ring"><div class="inner">{score.score:.0f}</div></div>
    <div class="meta">
      <div class="label">ESG Financial Score</div>
      <div class="value">{score.rating_band} <span class="badge">{bps_label}</span></div>
      <div class="label" style="margin-top:6px;">
        <a href="https://esg360.digital/companies/{company_id}" target="_blank" rel="noopener">
          Powered by ESG360 →
        </a>
      </div>
    </div>
  </div>
</body></html>"""
    return HTMLResponse(
        content=html,
        headers={
            "Cache-Control": "public, max-age=300",
            "X-Frame-Options": "ALLOWALL",
            "Content-Security-Policy": "frame-ancestors *",
        },
    )


def _no_score_html(theme: str) -> str:
    bg = "#0b0f17" if theme == "dark" else "#ffffff"
    fg = "#94a3b8" if theme == "dark" else "#64748b"
    return f"""<!doctype html><html><body style="font-family:system-ui;background:{bg};color:{fg};
    margin:0;padding:16px;">No public ESG score available · <a style="color:{fg}"
    href="https://esg360.digital">Powered by ESG360</a></body></html>"""
