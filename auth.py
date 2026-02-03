"""
Google OAuth authentication for Streamlit.

Setup required:
1. Go to https://console.cloud.google.com/
2. Create a project (or use existing)
3. Enable "Google Identity" API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Application type: Web application
6. Add authorized redirect URI: http://localhost:8501 (and your production URL)
7. Copy Client ID and Client Secret to .env
"""

import os
import streamlit as st
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv

load_dotenv()

# Also try st.secrets for Streamlit Cloud
try:
    for key in ("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"):
        if key not in os.environ and key in st.secrets:
            os.environ[key] = st.secrets[key]
except Exception:
    pass

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

# Allow HTTP for local development (remove in production)
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


def _get_redirect_uri() -> str:
    """Get the redirect URI based on current context."""
    return "http://localhost:8501"


def _build_flow() -> Flow:
    """Build the Google OAuth flow."""
    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [_get_redirect_uri()],
        }
    }
    flow = Flow.from_client_config(
        client_config,
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
        redirect_uri=_get_redirect_uri(),
    )
    return flow


def get_login_url() -> str:
    """Generate the Google OAuth login URL."""
    flow = _build_flow()
    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="select_account",
    )
    return auth_url


def handle_callback(auth_code: str) -> dict | None:
    """
    Exchange the auth code for tokens and get user info.
    Returns dict with email, name, picture or None on failure.
    """
    try:
        flow = _build_flow()
        flow.fetch_token(code=auth_code)
        credentials = flow.credentials

        user_info = id_token.verify_oauth2_token(
            credentials.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )

        return {
            "email": user_info.get("email", ""),
            "name": user_info.get("name", ""),
            "picture": user_info.get("picture", ""),
        }
    except Exception as e:
        st.error(f"Authentication failed: {e}")
        return None


def is_configured() -> bool:
    """Check if Google OAuth credentials are set."""
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)


def render_login_page():
    """Render the login page. Returns True if user is authenticated."""
    if "user" in st.session_state and st.session_state.user:
        return True

    # Check for OAuth callback
    query_params = st.query_params
    auth_code = query_params.get("code")

    if auth_code:
        with st.spinner("Signing you in..."):
            user_info = handle_callback(auth_code)
            if user_info:
                from database import get_or_create_user
                user = get_or_create_user(
                    email=user_info["email"],
                    name=user_info["name"],
                    picture=user_info.get("picture", ""),
                    provider="google",
                )
                st.session_state.user = user
                st.query_params.clear()
                st.rerun()
        return False

    # ── Login page ──
    st.markdown("""
    <div style="text-align: center; padding: 3rem 0 1rem 0;">
        <h1 style="font-size: 2.5rem; margin-bottom: 0.25rem;">Speech Writer</h1>
        <p style="color: #6c757d; font-size: 1.1rem; max-width: 500px; margin: 0 auto;">
            Generate polished speeches on any topic using multi-stage AI refinement
        </p>
    </div>
    """, unsafe_allow_html=True)

    if not is_configured():
        # Dev mode
        st.markdown("---")
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            st.caption("DEV MODE — OAuth not configured")
            dev_name = st.text_input("Name", value="Developer")
            dev_email = st.text_input("Email", value="dev@localhost")
            if st.button("Sign In", type="primary", use_container_width=True):
                from database import get_or_create_user
                user = get_or_create_user(
                    email=dev_email, name=dev_name, provider="dev"
                )
                st.session_state.user = user
                st.rerun()
        return False

    # Google login
    st.markdown("")
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        login_url = get_login_url()
        st.link_button("Sign in with Google", login_url, use_container_width=True)
        st.caption("We only access your name and email.")

    return False


def render_user_menu():
    """Render the user info and logout button in the sidebar."""
    if "user" not in st.session_state or not st.session_state.user:
        return

    user = st.session_state.user
    st.markdown(f"**{user['name']}**")
    st.caption(user["email"])

    if st.button("Sign Out", use_container_width=True):
        st.session_state.user = None
        st.session_state.steps = []
        st.session_state.final_text = None
        st.rerun()
