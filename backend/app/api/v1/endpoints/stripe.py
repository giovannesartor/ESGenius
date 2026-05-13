"""Stripe API endpoints — checkout, portal, subscription, webhook."""

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.api.dependencies import get_current_user
from app.domain.models.user import User
from app.domain.models.subscription import Subscription
from app.services.stripe_service import (
    activate_subscription,
    cancel_subscription,
    construct_webhook_event,
    create_checkout_session,
    create_portal_session,
    get_or_create_customer,
    get_subscription_details,
    reactivate_subscription,
    retrieve_checkout_session,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stripe", tags=["Stripe"])


class CheckoutRequest(BaseModel):
    plan: str = "professional"
    interval: str = "month"  # month | year


class SubscriptionResponse(BaseModel):
    plan: str
    status: str
    price: float
    currency: str
    interval: str
    stripe_subscription_id: str | None
    current_period_start: datetime | None
    current_period_end: datetime | None
    cancel_at_period_end: bool

    class Config:
        from_attributes = True


@router.post("/create-checkout")
async def create_checkout(
    data: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session for upgrading to Professional."""
    if data.plan not in ("professional",):
        raise HTTPException(status_code=400, detail="Invalid plan.")
    if data.interval not in ("month", "year"):
        raise HTTPException(status_code=400, detail="Invalid interval.")

    # Only superadmins need no subscription
    if current_user.is_superadmin:
        raise HTTPException(status_code=400, detail="Admins don't need a subscription.")

    customer_id = await get_or_create_customer(
        email=current_user.email,
        name=current_user.full_name,
        user_id=str(current_user.id),
        existing_customer_id=current_user.stripe_customer_id,
    )
    if current_user.stripe_customer_id != customer_id:
        current_user.stripe_customer_id = customer_id
        await db.flush()

    # Check existing active subscription
    result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active",
            Subscription.plan != "free",
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Already subscribed. Use the portal to manage your subscription.",
        )

    base = settings.FRONTEND_URL.rstrip("/")
    success_url = f"{base}/dashboard/subscription?success=true&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{base}/dashboard/subscription?cancelled=true"

    url = await create_checkout_session(
        customer_id=customer_id,
        plan=data.plan,
        interval=data.interval,
        success_url=success_url,
        cancel_url=cancel_url,
    )
    return {"url": url}


@router.post("/portal")
async def customer_portal(
    current_user: User = Depends(get_current_user),
):
    """Create a Stripe Customer Portal session for billing management."""
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found.")

    return_url = f"{settings.FRONTEND_URL.rstrip('/')}/dashboard/subscription"
    url = await create_portal_session(current_user.stripe_customer_id, return_url)
    return {"url": url}


@router.post("/verify-session")
async def verify_checkout_session(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fallback: verify checkout session when webhook hasn't arrived yet."""
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    try:
        session = await retrieve_checkout_session(session_id)
    except Exception as e:
        logger.error(f"Failed to retrieve session {session_id}: {e}")
        raise HTTPException(status_code=400, detail="Could not verify session")

    if session.get("status") != "complete" and session.get("payment_status") != "paid":
        return {"status": "pending", "message": "Payment not yet completed"}

    session_customer = session.get("customer")
    if session_customer:
        if not current_user.stripe_customer_id:
            current_user.stripe_customer_id = session_customer
            await db.flush()
        elif session_customer != current_user.stripe_customer_id:
            raise HTTPException(status_code=403, detail="Session does not belong to this user")

    subscription_id = session.get("subscription")
    if not subscription_id:
        return {"status": "no_subscription"}

    # Already in DB?
    existing = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == subscription_id)
    )
    if existing.scalar_one_or_none():
        return {"status": "already_active"}

    # Webhook hasn't arrived — create subscription now
    metadata = session.get("metadata", {})
    plan = metadata.get("plan", "professional")
    interval = metadata.get("interval", "month")

    import stripe as stripe_lib
    import asyncio
    stripe_lib.api_key = settings.STRIPE_API_KEY
    stripe_sub = await asyncio.to_thread(stripe_lib.Subscription.retrieve, subscription_id)

    try:
        price_obj = stripe_sub.items.data[0].price
        actual_price = (price_obj.unit_amount or 0) / 100.0
        currency = price_obj.currency or "usd"
    except Exception:
        actual_price = 299.0
        currency = "usd"

    await activate_subscription(
        db=db,
        user_id=str(current_user.id),
        stripe_sub_id=subscription_id,
        plan=plan,
        interval=interval,
        price=actual_price,
        currency=currency,
        period_start=datetime.fromtimestamp(stripe_sub.current_period_start, tz=timezone.utc),
        period_end=datetime.fromtimestamp(stripe_sub.current_period_end, tz=timezone.utc),
    )
    await db.commit()
    return {"status": "activated", "plan": plan}


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's active subscription."""
    if current_user.is_superadmin:
        return SubscriptionResponse(
            plan="enterprise",
            status="active",
            price=0,
            currency="USD",
            interval="month",
            stripe_subscription_id=None,
            current_period_start=None,
            current_period_end=None,
            cancel_at_period_end=False,
        )

    result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status.in_(["active", "past_due"]),
        ).order_by(Subscription.created_at.desc())
    )
    sub = result.scalar_one_or_none()

    if not sub:
        return SubscriptionResponse(
            plan="free",
            status="active",
            price=0,
            currency="USD",
            interval="month",
            stripe_subscription_id=None,
            current_period_start=None,
            current_period_end=None,
            cancel_at_period_end=False,
        )

    cancel_at_period_end = sub.cancel_at_period_end
    if sub.stripe_subscription_id:
        try:
            details = await get_subscription_details(sub.stripe_subscription_id)
            cancel_at_period_end = details.get("cancel_at_period_end", False)
            sub.cancel_at_period_end = cancel_at_period_end
        except Exception:
            pass

    return SubscriptionResponse(
        plan=sub.plan,
        status=sub.status,
        price=float(sub.price),
        currency=sub.currency,
        interval=sub.interval,
        stripe_subscription_id=sub.stripe_subscription_id,
        current_period_start=sub.current_period_start,
        current_period_end=sub.current_period_end,
        cancel_at_period_end=cancel_at_period_end,
    )


@router.post("/cancel")
async def cancel_my_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel subscription at period end."""
    result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active",
            Subscription.plan != "free",
        )
    )
    sub = result.scalar_one_or_none()
    if not sub or not sub.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription found.")

    await cancel_subscription(sub.stripe_subscription_id)
    sub.cancel_at_period_end = True
    await db.flush()
    return {"message": "Subscription will be cancelled at the end of the billing period."}


@router.post("/reactivate")
async def reactivate_my_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reactivate a cancelled subscription."""
    result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active",
            Subscription.plan != "free",
        )
    )
    sub = result.scalar_one_or_none()
    if not sub or not sub.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No subscription to reactivate.")

    await reactivate_subscription(sub.stripe_subscription_id)
    sub.cancel_at_period_end = False
    await db.flush()
    return {"message": "Subscription reactivated successfully."}


# ── Webhook ─────────────────────────────────────────────────────────────

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events."""
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = construct_webhook_event(payload, sig_header)
    except Exception as e:
        logger.error(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    data = event["data"]["object"]
    logger.info(f"Stripe webhook: {event_type}")

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(data, db)
    elif event_type == "customer.subscription.updated":
        await _handle_subscription_updated(data, db)
    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_deleted(data, db)
    elif event_type == "invoice.payment_failed":
        await _handle_payment_failed(data, db)

    await db.flush()
    return {"status": "ok"}


async def _handle_checkout_completed(data: dict, db: AsyncSession):
    subscription_id = data.get("subscription")
    customer_id = data.get("customer")
    if not subscription_id or not customer_id:
        return

    metadata = data.get("metadata", {})
    plan = metadata.get("plan", "professional")
    interval = metadata.get("interval", "month")

    # Find user by stripe customer id
    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        logger.warning(f"No user found for customer {customer_id}")
        return

    import stripe as stripe_lib
    import asyncio
    stripe_lib.api_key = settings.STRIPE_API_KEY
    stripe_sub = await asyncio.to_thread(stripe_lib.Subscription.retrieve, subscription_id)

    try:
        price_obj = stripe_sub.items.data[0].price
        actual_price = (price_obj.unit_amount or 0) / 100.0
        currency = price_obj.currency or "usd"
    except Exception:
        actual_price = 299.0
        currency = "usd"

    await activate_subscription(
        db=db,
        user_id=str(user.id),
        stripe_sub_id=subscription_id,
        plan=plan,
        interval=interval,
        price=actual_price,
        currency=currency,
        period_start=datetime.fromtimestamp(stripe_sub.current_period_start, tz=timezone.utc),
        period_end=datetime.fromtimestamp(stripe_sub.current_period_end, tz=timezone.utc),
    )


async def _handle_subscription_updated(data: dict, db: AsyncSession):
    stripe_sub_id = data.get("id")
    result = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return

    sub.status = data.get("status", sub.status)
    sub.cancel_at_period_end = data.get("cancel_at_period_end", False)
    if data.get("current_period_end"):
        sub.current_period_end = datetime.fromtimestamp(data["current_period_end"], tz=timezone.utc)
    if data.get("current_period_start"):
        sub.current_period_start = datetime.fromtimestamp(data["current_period_start"], tz=timezone.utc)


async def _handle_subscription_deleted(data: dict, db: AsyncSession):
    stripe_sub_id = data.get("id")
    result = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
    )
    sub = result.scalar_one_or_none()
    if sub:
        sub.status = "expired"
        # Reset plan on user
        user_result = await db.execute(select(User).where(User.id == sub.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            user.subscription_plan = "free"


async def _handle_payment_failed(data: dict, db: AsyncSession):
    stripe_sub_id = data.get("subscription")
    if not stripe_sub_id:
        return
    result = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
    )
    sub = result.scalar_one_or_none()
    if sub:
        sub.status = "past_due"
        logger.warning(f"Payment failed for subscription {stripe_sub_id}")
