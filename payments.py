"""
Stripe subscription management.

Flow:
1. User clicks Subscribe -> create_checkout_session() -> redirect to Stripe
2. User completes payment -> Stripe redirects to success_url with session_id
3. handle_checkout_success() verifies and updates user's subscription status
4. is_subscribed() checks if user has active subscription or is exempt
"""

import os
from datetime import datetime, timezone

import stripe
from dotenv import load_dotenv

load_dotenv()


def _init_stripe():
    """Load Stripe key from env or st.secrets."""
    try:
        import streamlit as st
        if "STRIPE_SECRET_KEY" not in os.environ and "STRIPE_SECRET_KEY" in st.secrets:
            os.environ["STRIPE_SECRET_KEY"] = st.secrets["STRIPE_SECRET_KEY"]
    except Exception:
        pass
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")


# Emails that get unlimited free access (no payment required)
FREE_ACCESS_EMAILS = {
    "faradaybach@gmail.com",
    "iamemanucci@gmail.com",
    "test@example.com",  # Test account
}

# Number of free episodes for all users before payment required
FREE_EPISODE_LIMIT = 3

PRICE_ID = "price_1SwbCg4IwNCnJfAHoDc0u2YD"


def is_free_user(email: str) -> bool:
    """Check if email has unlimited free access."""
    return email.lower() in {e.lower() for e in FREE_ACCESS_EMAILS}


def get_free_episodes_remaining(user_id: int) -> int:
    """Get number of free episodes remaining for a user."""
    from database import count_user_speeches
    used = count_user_speeches(user_id)
    return max(0, FREE_EPISODE_LIMIT - used)


def can_generate_free(user_id: int) -> bool:
    """Check if user has free episodes remaining."""
    return get_free_episodes_remaining(user_id) > 0


def create_checkout_session(user_email: str, user_id: int, base_url: str) -> str:
    """
    Create a Stripe Checkout session for subscription.
    Returns the checkout URL to redirect to.
    """
    _init_stripe()

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": PRICE_ID, "quantity": 1}],
        customer_email=user_email,
        metadata={"user_id": str(user_id)},
        success_url=f"{base_url}?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{base_url}?payment=cancelled",
    )
    return session.url


def handle_checkout_success(session_id: str) -> dict | None:
    """
    Verify checkout session and return subscription info.
    Returns dict with subscription_id, customer_id, status, or None on failure.
    """
    _init_stripe()

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == "paid":
            return {
                "subscription_id": session.subscription,
                "customer_id": session.customer,
                "status": "active",
                "user_id": int(session.metadata.get("user_id", 0)),
            }
    except stripe.StripeError:
        pass
    return None


def get_subscription_status(subscription_id: str) -> str:
    """Get current status of a subscription from Stripe."""
    _init_stripe()

    try:
        sub = stripe.Subscription.retrieve(subscription_id)
        return sub.status  # active, past_due, canceled, etc.
    except stripe.StripeError:
        return "unknown"


def cancel_subscription(subscription_id: str) -> bool:
    """Cancel a subscription at period end. Returns True on success."""
    _init_stripe()

    try:
        stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True,
        )
        return True
    except stripe.StripeError:
        return False


def get_customer_portal_url(customer_id: str, base_url: str) -> str:
    """Create a Stripe Customer Portal session for managing subscription."""
    _init_stripe()

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=base_url,
    )
    return session.url
