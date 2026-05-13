"""Stripe service — subscription checkout, portal, webhooks for ESG360."""

import asyncio
import logging
from datetime import datetime, timezone

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.domain.models.subscription import Subscription
from app.domain.models.user import User

logger = logging.getLogger(__name__)

# Plans: professional ($299/mo or $2990/yr), enterprise (contact)
PLAN_PRICES = {
    "professional": {
        "month": settings.STRIPE_PRICE_PROFESSIONAL_MONTHLY or "price_professional_monthly",
        "year":  settings.STRIPE_PRICE_PROFESSIONAL_YEARLY  or "price_professional_yearly",
    },
}


def _stripe():
    stripe.api_key = settings.STRIPE_API_KEY
    return stripe


async def get_or_create_customer(
    email: str, name: str, user_id: str, existing_customer_id: str | None
) -> str:
    """Return existing Stripe customer ID or create a new one."""
    s = _stripe()
    if existing_customer_id:
        try:
            customer = await asyncio.to_thread(s.Customer.retrieve, existing_customer_id)
            if not customer.get("deleted"):
                return existing_customer_id
        except Exception:
            pass
    customer = await asyncio.to_thread(
        s.Customer.create,
        email=email,
        name=name,
        metadata={"user_id": user_id},
    )
    return customer["id"]


async def create_checkout_session(
    customer_id: str, plan: str, interval: str, success_url: str, cancel_url: str
) -> str:
    """Create a Stripe Checkout session and return the URL."""
    s = _stripe()
    price_id = PLAN_PRICES.get(plan, {}).get(interval)
    if not price_id:
        raise ValueError(f"Unknown plan/interval: {plan}/{interval}")

    session = await asyncio.to_thread(
        s.checkout.Session.create,
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"plan": plan, "interval": interval},
        subscription_data={
            "metadata": {"plan": plan, "interval": interval},
        },
    )
    return session["url"]


async def create_portal_session(customer_id: str, return_url: str) -> str:
    """Create a Stripe Customer Portal session and return the URL."""
    s = _stripe()
    session = await asyncio.to_thread(
        s.billing_portal.Session.create,
        customer=customer_id,
        return_url=return_url,
    )
    return session["url"]


async def retrieve_checkout_session(session_id: str) -> dict:
    s = _stripe()
    session = await asyncio.to_thread(s.checkout.Session.retrieve, session_id)
    return dict(session)


async def cancel_subscription(stripe_sub_id: str) -> None:
    s = _stripe()
    await asyncio.to_thread(
        s.Subscription.modify, stripe_sub_id, cancel_at_period_end=True
    )


async def reactivate_subscription(stripe_sub_id: str) -> None:
    s = _stripe()
    await asyncio.to_thread(
        s.Subscription.modify, stripe_sub_id, cancel_at_period_end=False
    )


async def get_subscription_details(stripe_sub_id: str) -> dict:
    s = _stripe()
    sub = await asyncio.to_thread(s.Subscription.retrieve, stripe_sub_id)
    return dict(sub)


def construct_webhook_event(payload: bytes, sig_header: str) -> dict:
    s = _stripe()
    event = s.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )
    return dict(event)


# ── DB helpers ──────────────────────────────────────────────────────────

async def activate_subscription(
    db: AsyncSession,
    user_id: str,
    stripe_sub_id: str,
    plan: str,
    interval: str,
    price: float,
    currency: str,
    period_start: datetime,
    period_end: datetime,
) -> None:
    """Deactivate any old subscriptions and create the new active one."""
    old = await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status == "active",
        )
    )
    for sub in old.scalars().all():
        sub.status = "expired"

    new_sub = Subscription(
        user_id=user_id,
        plan=plan,
        status="active",
        price=price,
        currency=currency.upper(),
        interval=interval,
        stripe_subscription_id=stripe_sub_id,
        current_period_start=period_start,
        current_period_end=period_end,
    )
    db.add(new_sub)

    # Sync plan on user row
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        user.subscription_plan = plan

    await db.flush()
    logger.info(f"Subscription activated: plan={plan} user={user_id}")
