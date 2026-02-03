"""
MindCast - Documentary-style audio learning.
Run with: streamlit run app.py
"""

import base64

import streamlit as st
from auth import render_login_page, render_user_menu
from database import (
    save_speech, get_user_speeches, get_speech, delete_speech,
    save_audio, get_audio, get_user_subscription, update_user_subscription,
)
from pipeline import run_full_pipeline
from exporter import export_docx, generate_audio
from payments import (
    is_free_user, create_checkout_session, handle_checkout_success,
    get_customer_portal_url, can_generate_free, get_free_episodes_remaining,
    FREE_EPISODE_LIMIT,
)

st.set_page_config(
    page_title="MindCast",
    page_icon="🎧",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Custom CSS ──────────────────────────────────────────────
st.markdown("""
<style>
    /* Safe area for notched phones */
    html {
        padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    }

    /* Smooth scrolling */
    html, body {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
    }

    /* Base styling - clean and spacious */
    .block-container {
        padding-top: 1.5rem;
        padding-left: 1rem;
        padding-right: 1rem;
        max-width: 800px;
    }

    /* Hero header - clean gradient, no animation */
    .hero-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: #6366f1;
        margin-bottom: 1.25rem;
        letter-spacing: -0.02em;
    }

    /* Episode cards - clean, clickable feel */
    .episode-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 0.5rem;
        transition: all 0.2s ease;
        cursor: pointer;
    }
    .episode-card:hover {
        border-color: #6366f1;
        background: #fafafa;
    }
    .episode-card h4 {
        margin: 0 0 0.25rem 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: #1f2937;
        line-height: 1.4;
    }
    .episode-card .meta {
        color: #9ca3af;
        font-size: 0.75rem;
    }

    /* Audio player - light, integrated design */
    .audio-container {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1rem;
        margin: 0.75rem 0;
    }

    /* Hide Streamlit defaults */
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }
    header { visibility: hidden; }

    /* Clean text area */
    .stTextArea textarea {
        border-radius: 10px;
        font-size: 16px; /* Prevents iOS zoom on focus */
        border: 1px solid #e5e7eb;
        padding: 0.875rem;
    }
    .stTextArea textarea:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
    }

    /* Progress status */
    .progress-status {
        text-align: center;
        padding: 1.5rem 1rem;
        color: #6b7280;
        font-size: 0.9rem;
    }

    /* Primary buttons - touch-friendly */
    .stButton > button {
        min-height: 44px; /* iOS touch target */
        font-size: 0.95rem;
    }
    .stButton > button[kind="primary"] {
        background: #6366f1;
        border: none;
        font-weight: 500;
        border-radius: 8px;
    }
    .stButton > button[kind="primary"]:hover {
        background: #4f46e5;
    }

    /* Secondary buttons */
    .stButton > button[kind="secondary"] {
        border: 1px solid #e5e7eb;
        color: #4b5563;
        font-weight: 500;
        border-radius: 8px;
    }
    .stButton > button[kind="secondary"]:hover {
        background: #f9fafb;
        border-color: #d1d5db;
    }

    /* Paywall - clean, professional */
    .paywall-card {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-radius: 16px;
        padding: 2rem 1.5rem;
        text-align: center;
        color: white;
    }
    .paywall-card h2 {
        font-size: 1.35rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }
    .paywall-card p {
        opacity: 0.9;
        font-size: 0.9rem;
    }
    .paywall-price {
        font-size: 2.25rem;
        font-weight: 700;
        margin: 1rem 0;
    }
    .paywall-price span {
        font-size: 0.9rem;
        font-weight: 400;
        opacity: 0.8;
    }

    /* Empty state */
    .empty-state {
        text-align: center;
        padding: 2rem 1.5rem;
        background: #f9fafb;
        border-radius: 12px;
        border: 1px dashed #e5e7eb;
    }
    .empty-state p {
        color: #6b7280;
        margin: 0;
    }

    /* Expander styling */
    .streamlit-expanderHeader {
        font-size: 0.9rem;
        font-weight: 500;
    }

    /* Selectbox styling - touch friendly */
    .stSelectbox > div > div {
        border-radius: 8px;
        min-height: 44px;
    }
    .stSelectbox label {
        font-size: 0.9rem;
        font-weight: 500;
    }

    /* Expander styling - touch friendly */
    .streamlit-expanderHeader {
        font-size: 0.9rem;
        font-weight: 500;
        padding: 0.75rem 0;
    }
    .streamlit-expanderHeader:hover {
        color: #6366f1;
    }

    /* Progress bar styling */
    .stProgress > div > div {
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
        border-radius: 4px;
    }

    /* Download buttons */
    .stDownloadButton > button {
        min-height: 44px;
    }

    /* ═══════════════════════════════════════════════════════════
       RESPONSIVE STYLES - Mobile First
       ═══════════════════════════════════════════════════════════ */

    /* Small phones */
    @media (max-width: 480px) {
        .block-container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            padding-top: 1rem;
        }
        .hero-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        .episode-card {
            padding: 0.875rem;
        }
        .episode-card h4 {
            font-size: 0.9rem;
        }
        .paywall-card {
            padding: 1.5rem 1rem;
            border-radius: 12px;
        }
        .paywall-card h2 {
            font-size: 1.2rem;
        }
        .paywall-price {
            font-size: 2rem;
        }
        .empty-state {
            padding: 1.5rem 1rem;
        }
        .audio-container {
            padding: 0.875rem;
            border-radius: 10px;
        }
        /* Larger touch targets for checkboxes */
        .stCheckbox label {
            padding: 0.5rem 0;
            min-height: 44px;
            display: flex;
            align-items: center;
        }
        .stCheckbox label > span:first-child {
            transform: scale(1.2);
            margin-right: 0.5rem;
        }
        /* Better expander touch target */
        .streamlit-expanderHeader {
            min-height: 48px;
            padding: 0.75rem 0;
        }
        /* More compact progress for mobile */
        .progress-status {
            padding: 1rem 0.5rem;
            font-size: 0.85rem;
        }
        /* Full-width caption text */
        .stCaption {
            text-align: center;
        }
    }

    /* Tablets and larger phones */
    @media (min-width: 481px) and (max-width: 768px) {
        .block-container {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
        }
        .hero-title {
            font-size: 1.65rem;
        }
    }

    /* Desktop */
    @media (min-width: 769px) {
        .block-container {
            padding-left: 2rem;
            padding-right: 2rem;
            padding-top: 2rem;
        }
        .hero-title {
            font-size: 2rem;
            margin-bottom: 1.5rem;
        }
        .episode-card {
            padding: 1.25rem;
        }
        .episode-card h4 {
            font-size: 1rem;
        }
        .paywall-card {
            padding: 2.5rem 2rem;
        }
        .paywall-card h2 {
            font-size: 1.5rem;
        }
        .paywall-price {
            font-size: 2.5rem;
        }
        .audio-container {
            padding: 1.25rem;
        }
    }

    /* Ensure columns stack on mobile */
    @media (max-width: 640px) {
        [data-testid="column"] {
            width: 100% !important;
            flex: 1 1 100% !important;
            min-width: 100% !important;
        }
        [data-testid="stHorizontalBlock"] {
            flex-wrap: wrap;
            gap: 0.5rem;
        }
    }

    /* Lens/Reflect mode styling */
    .lens-category {
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
    }
    .lens-item {
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
    }
    .lens-item:last-child {
        border-bottom: none;
    }

    /* Sidebar section labels */
    .stSidebar [data-testid="stMarkdownContainer"] p {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #9ca3af;
        margin-bottom: 0.25rem;
    }
</style>
""", unsafe_allow_html=True)

# Available TTS voices
VOICES = {
    "Onyx (deep, authoritative)": "onyx",
    "Nova (warm, female)": "nova",
    "Alloy (neutral, balanced)": "alloy",
    "Echo (male, clear)": "echo",
    "Fable (expressive, British)": "fable",
    "Shimmer (soft, female)": "shimmer",
    "Ash (conversational male)": "ash",
    "Coral (warm female)": "coral",
    "Sage (calm, measured)": "sage",
    "Ballad (storyteller)": "ballad",
}

# Episode length options
EPISODE_LENGTHS = ["5 min", "10 min", "15 min", "20 min"]

PIPELINE_LABELS = [
    "Research", "Drafts", "Judge",
    "Critique 1", "Deep Enhancement",
    "Critique 2", "De-AI & Voice",
    "Critique 3", "Oral Optimization",
    "Critique 4", "Final Polish",
]




# ── Helper: audio player ───────────────────────────────────
def _render_audio_player(audio_bytes: bytes, key_prefix: str, autoplay: bool = False):
    """Enhanced audio player with skip controls, speed presets, and autoplay detection."""
    b64 = base64.b64encode(audio_bytes).decode()
    pid = f"p_{key_prefix}"

    html = f"""
    <style>
        .mc-player {{
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 1.25rem;
            position: relative;
        }}
        .mc-player .tap-overlay {{
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: opacity 0.3s ease;
        }}
        .mc-player .tap-overlay.hidden {{
            opacity: 0;
            pointer-events: none;
        }}
        .mc-player .tap-overlay .tap-icon {{
            width: 72px;
            height: 72px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.75rem;
            color: #6366f1;
            margin-bottom: 1rem;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            animation: pulse 2s infinite;
        }}
        @keyframes pulse {{
            0%, 100% {{ transform: scale(1); }}
            50% {{ transform: scale(1.05); }}
        }}
        .mc-player .tap-overlay .tap-text {{
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .mc-player .time-row {{
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
            font-variant-numeric: tabular-nums;
        }}
        .mc-player .progress-bar {{
            width: 100%;
            height: 6px;
            background: #e5e7eb;
            border-radius: 3px;
            cursor: pointer;
            margin-bottom: 1.25rem;
            overflow: hidden;
        }}
        .mc-player .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
            border-radius: 3px;
            width: 0%;
            transition: width 0.1s linear;
        }}
        .mc-player .main-controls {{
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }}
        .mc-player .ctrl-btn {{
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: none;
            background: #e5e7eb;
            color: #374151;
            font-size: 0.85rem;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
            line-height: 1;
        }}
        .mc-player .ctrl-btn:hover {{
            background: #d1d5db;
        }}
        .mc-player .ctrl-btn:active {{
            transform: scale(0.95);
        }}
        .mc-player .ctrl-btn.play {{
            width: 56px;
            height: 56px;
            background: #6366f1;
            color: white;
            font-size: 1.25rem;
        }}
        .mc-player .ctrl-btn.play:hover {{
            background: #4f46e5;
        }}
        .mc-player .skip-num {{
            font-size: 0.6rem;
            font-weight: 600;
        }}
        .mc-player .speed-row {{
            display: flex;
            justify-content: center;
            gap: 0.5rem;
        }}
        .mc-player .speed-btn {{
            padding: 0.35rem 0.7rem;
            border-radius: 16px;
            border: 1px solid #e5e7eb;
            background: white;
            color: #6b7280;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
        }}
        .mc-player .speed-btn:hover {{
            border-color: #6366f1;
            color: #6366f1;
        }}
        .mc-player .speed-btn.active {{
            background: #6366f1;
            border-color: #6366f1;
            color: white;
        }}
        @media (max-width: 480px) {{
            .mc-player {{
                padding: 1rem;
                border-radius: 12px;
            }}
            .mc-player .ctrl-btn {{
                width: 40px;
                height: 40px;
            }}
            .mc-player .ctrl-btn.play {{
                width: 50px;
                height: 50px;
            }}
            .mc-player .main-controls {{
                gap: 0.75rem;
            }}
            .mc-player .speed-btn {{
                padding: 0.3rem 0.6rem;
                font-size: 0.7rem;
            }}
            .mc-player .tap-overlay .tap-icon {{
                width: 64px;
                height: 64px;
                font-size: 1.5rem;
            }}
        }}
    </style>

    <div class="mc-player" id="{pid}_container">
        <audio id="{pid}" preload="auto" style="display:none;">
            <source src="data:audio/mp3;base64,{b64}" type="audio/mp3">
        </audio>

        <!-- Tap to play overlay (shown if autoplay fails) -->
        <div class="tap-overlay{'' if autoplay else ' hidden'}" id="{pid}_overlay" onclick="mcStartPlay_{pid}()">
            <div class="tap-icon">&#9654;</div>
            <div class="tap-text">Tap to Play</div>
        </div>

        <div class="time-row">
            <span id="{pid}_cur">0:00</span>
            <span id="{pid}_tot">0:00</span>
        </div>

        <div class="progress-bar" id="{pid}_bar" onclick="mcSeek_{pid}(event)">
            <div class="progress-fill" id="{pid}_fill"></div>
        </div>

        <div class="main-controls">
            <button class="ctrl-btn" onclick="mcSkip_{pid}(-15)" title="Back 15s">
                <span>&#8592;</span><span class="skip-num">15</span>
            </button>
            <button class="ctrl-btn play" id="{pid}_play" onclick="mcToggle_{pid}()">&#9654;</button>
            <button class="ctrl-btn" onclick="mcSkip_{pid}(15)" title="Forward 15s">
                <span>&#8594;</span><span class="skip-num">15</span>
            </button>
        </div>

        <div class="speed-row">
            <button class="speed-btn" id="{pid}_s1" onclick="mcSpeed_{pid}(1)">1x</button>
            <button class="speed-btn" id="{pid}_s1.25" onclick="mcSpeed_{pid}(1.25)">1.25x</button>
            <button class="speed-btn" id="{pid}_s1.5" onclick="mcSpeed_{pid}(1.5)">1.5x</button>
            <button class="speed-btn" id="{pid}_s2" onclick="mcSpeed_{pid}(2)">2x</button>
        </div>
    </div>

    <script>
    (function() {{
        var a = document.getElementById('{pid}');
        var playBtn = document.getElementById('{pid}_play');
        var curEl = document.getElementById('{pid}_cur');
        var totEl = document.getElementById('{pid}_tot');
        var fillEl = document.getElementById('{pid}_fill');
        var bar = document.getElementById('{pid}_bar');
        var overlay = document.getElementById('{pid}_overlay');

        var saved = localStorage.getItem('mc_speed') || '1';
        a.playbackRate = parseFloat(saved);
        updSpd(parseFloat(saved));

        function fmt(s) {{
            var m = Math.floor(s / 60);
            var sec = Math.floor(s % 60);
            return m + ':' + (sec < 10 ? '0' : '') + sec;
        }}

        function updSpd(r) {{
            [1, 1.25, 1.5, 2].forEach(function(s) {{
                var btn = document.getElementById('{pid}_s' + s);
                if (btn) btn.classList.toggle('active', s === r);
            }});
        }}

        function hideOverlay() {{
            overlay.classList.add('hidden');
        }}

        a.addEventListener('loadedmetadata', function() {{
            totEl.textContent = fmt(a.duration);
        }});

        a.addEventListener('timeupdate', function() {{
            curEl.textContent = fmt(a.currentTime);
            fillEl.style.width = ((a.currentTime / a.duration) * 100 || 0) + '%';
        }});

        a.addEventListener('play', function() {{
            playBtn.innerHTML = '&#10074;&#10074;';
            hideOverlay();
            localStorage.setItem('mc_can_autoplay', 'true');
        }});
        a.addEventListener('pause', function() {{ playBtn.innerHTML = '&#9654;'; }});
        a.addEventListener('ended', function() {{ playBtn.innerHTML = '&#9654;'; }});

        window.mcStartPlay_{pid} = function() {{
            a.play().then(function() {{
                hideOverlay();
            }}).catch(function() {{}});
        }};

        window.mcToggle_{pid} = function() {{
            a.paused ? a.play().catch(function(){{}}) : a.pause();
        }};

        window.mcSkip_{pid} = function(s) {{
            a.currentTime = Math.max(0, Math.min(a.duration, a.currentTime + s));
        }};

        window.mcSpeed_{pid} = function(r) {{
            a.playbackRate = r;
            localStorage.setItem('mc_speed', r.toString());
            updSpd(r);
        }};

        window.mcSeek_{pid} = function(e) {{
            var rect = bar.getBoundingClientRect();
            a.currentTime = ((e.clientX - rect.left) / rect.width) * a.duration;
        }};

        // Autoplay handling with fallback to overlay
        {'var tryAutoplay = function() { a.play().then(function() { hideOverlay(); }).catch(function() { overlay.classList.remove("hidden"); }); }; if (document.readyState === "complete") { setTimeout(tryAutoplay, 50); } else { window.addEventListener("load", function() { setTimeout(tryAutoplay, 50); }); }' if autoplay else 'hideOverlay();'}
    }})();
    </script>
    """
    st.components.v1.html(html, height=190)


def _render_audio_section(speech_id: int, user_id: int, final_text: str, key_prefix: str, autoplay: bool = False):
    """Audio generation and playback - simple and focused."""
    existing_audio = get_audio(speech_id, user_id)

    if existing_audio:
        _render_audio_player(existing_audio, key_prefix, autoplay=autoplay)

        # Simple download button
        st.download_button(
            "Download MP3", data=existing_audio,
            file_name="episode.mp3", mime="audio/mpeg",
            key=f"{key_prefix}_dl_mp3", use_container_width=True,
        )

        # Voice options in expander for those who want customization
        with st.expander("Change voice"):
            voice_name = st.selectbox(
                "Voice", options=list(VOICES.keys()), index=0,
                key=f"{key_prefix}_voice", label_visibility="collapsed",
            )
            if st.button("Regenerate", key=f"{key_prefix}_regen", use_container_width=True):
                voice_id = VOICES[voice_name]
                with st.spinner(f"Regenerating with {voice_name.split(' (')[0]}..."):
                    try:
                        audio_bytes = generate_audio(final_text, voice=voice_id, speed=1.0)
                        save_audio(speech_id, user_id, audio_bytes, voice_id)
                        st.rerun()
                    except Exception as e:
                        st.error(f"Audio generation failed: {e}")
    else:
        # Generate audio if none exists
        if st.button("Generate Audio", type="primary", key=f"{key_prefix}_gen_btn", use_container_width=True):
            with st.spinner("Creating audio..."):
                try:
                    audio_bytes = generate_audio(final_text, voice="onyx", speed=1.0)
                    save_audio(speech_id, user_id, audio_bytes, "onyx")
                    st.rerun()
                except Exception as e:
                    st.error(f"Audio generation failed: {e}")


# ── Auth gate ───────────────────────────────────────────────
if not render_login_page():
    st.stop()

user = st.session_state.user

# ── Payment callback handling ───────────────────────────────
query_params = st.query_params
if query_params.get("payment") == "success":
    session_id = query_params.get("session_id")
    if session_id:
        result = handle_checkout_success(session_id)
        if result and result["user_id"] == user["id"]:
            update_user_subscription(
                user_id=user["id"],
                customer_id=result["customer_id"],
                subscription_id=result["subscription_id"],
                status="active",
            )
            st.query_params.clear()
            st.toast("Subscription activated!")
            st.rerun()
    st.query_params.clear()

if query_params.get("payment") == "cancelled":
    st.query_params.clear()
    st.toast("Payment cancelled.")


# ── Subscription check ──────────────────────────────────────
def user_can_generate() -> bool:
    """Check if current user can generate episodes."""
    # Unlimited free access for specific emails
    if is_free_user(user["email"]):
        return True
    # Check if user has active subscription
    sub = get_user_subscription(user["id"])
    if sub["status"] == "active":
        return True
    # Check if user has free episodes remaining
    return can_generate_free(user["id"])


def render_paywall():
    """Render subscription prompt."""
    st.markdown("")
    st.markdown("""
    <div class="paywall-card">
        <h2>Unlimited Learning</h2>
        <p>Create episodes on any topic you want to explore.</p>
        <div class="paywall-price">$19.99<span>/month</span></div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("")
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if st.button("Subscribe", type="primary", use_container_width=True):
            base_url = st.context.headers.get("Origin", "http://localhost:8501")
            checkout_url = create_checkout_session(user["email"], user["id"], base_url)
            st.markdown(f'<meta http-equiv="refresh" content="0;url={checkout_url}">', unsafe_allow_html=True)


# ── Session state ───────────────────────────────────────────
defaults = {
    "topic": "",
    "length": "10 min",
    "selected_voice": "onyx",
    "running": False,
    "error": None,
    "steps": [],
    "final_text": None,
    "last_speech_id": None,
    "view": "create",
    "viewing_speech": None,
    # Lens/Reflect mode state
    "lens_situation": "",
    "lens_selected": [],  # List of (category_id, lens_id) tuples
    "lens_result": None,
    "lens_audio": None,
    "lens_running": False,
}
for key, val in defaults.items():
    if key not in st.session_state:
        st.session_state[key] = val

# ── Sidebar (clean & minimal) ──────────────────────────────
with st.sidebar:
    render_user_menu()
    st.markdown("---")

    # Two main modes: Learn (Episodes) and Reflect (Lenses)
    st.caption("LEARN")
    if st.button("New Episode", use_container_width=True, type="primary" if st.session_state.view == "create" else "secondary"):
        st.session_state.view = "create"
        st.session_state.viewing_speech = None
        st.session_state.steps = []
        st.session_state.final_text = None
        st.rerun()
    if st.button("My Episodes", use_container_width=True, type="primary" if st.session_state.view == "library" else "secondary"):
        st.session_state.view = "library"
        st.rerun()

    st.markdown("")
    st.caption("REFLECT")
    if st.button("New Reflection", use_container_width=True, type="primary" if st.session_state.view == "reflect" else "secondary"):
        st.session_state.view = "reflect"
        st.session_state.lens_result = None
        st.rerun()

    # Subscription management (only show if subscribed)
    sub = get_user_subscription(user["id"])
    if sub["status"] == "active" and sub["customer_id"]:
        st.markdown("---")
        base_url = st.context.headers.get("Origin", "http://localhost:8501")
        portal_url = get_customer_portal_url(sub["customer_id"], base_url)
        st.link_button("Manage Subscription", portal_url, use_container_width=True)


# ════════════════════════════════════════════════════════════
# VIEW: Create
# ════════════════════════════════════════════════════════════
if st.session_state.view == "create":
    # Check subscription before showing form
    can_generate = user_can_generate()

    if not can_generate:
        render_paywall()
        st.stop()

    # Show results first if we have them (audio-first experience)
    if st.session_state.final_text and st.session_state.last_speech_id:
        st.markdown(f'<h1 class="hero-title">{st.session_state.topic}</h1>', unsafe_allow_html=True)

        # Audio player - prominent and immediate
        _render_audio_section(
            speech_id=st.session_state.last_speech_id,
            user_id=user["id"],
            final_text=st.session_state.final_text,
            key_prefix="create_audio",
            autoplay=True,
        )

        # Create another button
        st.markdown("")
        if st.button("Create Another", use_container_width=True):
            st.session_state.final_text = None
            st.session_state.last_speech_id = None
            st.session_state.topic = ""
            st.rerun()

        # Transcript in expander (minimal)
        with st.expander("Transcript"):
            st.markdown(st.session_state.final_text)

        st.stop()

    # ── Input form (minimal for mobile) ──
    st.markdown('<h1 class="hero-title">What do you want to learn?</h1>', unsafe_allow_html=True)

    topic = st.text_area(
        "Topic",
        height=80,
        placeholder="e.g., How does memory work?",
        label_visibility="collapsed",
    )

    # Defaults - no selection needed
    length = "10 min"
    selected_voice = "onyx"

    # Options hidden in expander for those who want them
    with st.expander("Options"):
        col_len, col_voice = st.columns([1, 1])
        with col_len:
            length = st.selectbox(
                "Duration",
                options=EPISODE_LENGTHS,
                index=1,  # Default to 10 min
            )
        with col_voice:
            voice_choice = st.selectbox(
                "Voice",
                options=["Male narrator", "Female narrator"],
                index=0,
            )
            selected_voice = "onyx" if "Male" in voice_choice else "nova"

    # Single generate button
    generate = st.button(
        "Generate",
        type="primary",
        disabled=(not topic.strip() or st.session_state.running),
        use_container_width=True,
    )

    # Show time estimate (4 enhancement stages now)
    time_estimates = {"5 min": "3-4", "10 min": "4-6", "15 min": "6-8", "20 min": "8-10"}
    st.caption(f"~{time_estimates.get(length, '4-6')} min to generate")

    if generate and topic.strip():
        st.session_state.topic = topic.strip()
        st.session_state.length = length
        st.session_state.selected_voice = selected_voice
        st.session_state.steps = []
        st.session_state.final_text = None
        st.session_state.last_speech_id = None
        st.session_state.running = True
        st.session_state.error = None

        # Clean progress display
        st.markdown("---")
        progress_bar = st.progress(0)
        status_container = st.empty()

        total_steps = 12  # Research, Drafts, Judge, 4x(Critique+Enhancement), Audio
        step_count = 0

        # Friendly progress messages
        stage_messages = {
            "research": "Researching your topic...",
            "drafts": "Writing initial drafts...",
            "judge": "Selecting the best approach...",
            "critique": "Analyzing for improvements...",
            "enhancement": "Enhancing the narrative...",
            "done": "Creating audio...",
        }
        # More specific messages for enhancement stages
        enhancement_messages = [
            "Adding depth and insights...",
            "Removing AI patterns...",
            "Optimizing for audio...",
            "Final polish...",
        ]
        enhancement_idx = 0

        try:
            for step_name, step_type, data in run_full_pipeline(st.session_state.topic, length):
                if data.get("status") == "done" or step_type == "done":
                    step_count += 1
                    st.session_state.steps.append((step_name, step_type, data))
                    progress_bar.progress(min(step_count / total_steps, 1.0))
                    # Track enhancement stage for specific messages
                    if step_type == "enhancement":
                        enhancement_idx = min(enhancement_idx + 1, len(enhancement_messages) - 1)
                else:
                    # Use specific message for enhancement stages
                    if step_type == "enhancement":
                        msg = enhancement_messages[enhancement_idx]
                    else:
                        msg = stage_messages.get(step_type, "Working...")
                    status_container.markdown(f"""
                    <div class="progress-status">{msg}</div>
                    """, unsafe_allow_html=True)

                if step_type == "done":
                    st.session_state.final_text = data.get("final_text")

        except RuntimeError as e:
            st.session_state.error = str(e)

        st.session_state.running = False

        if st.session_state.final_text:
            speech_id = save_speech(
                user_id=user["id"],
                topic=st.session_state.topic,
                final_text=st.session_state.final_text,
                stages=st.session_state.steps,
            )
            st.session_state.last_speech_id = speech_id

            # Generate audio
            voice = st.session_state.get("selected_voice", "onyx")
            status_container.markdown("""
            <div class="progress-status">Generating audio...</div>
            """, unsafe_allow_html=True)
            try:
                audio_bytes = generate_audio(st.session_state.final_text, voice=voice, speed=1.0)
                save_audio(speech_id, user["id"], audio_bytes, voice)
                progress_bar.progress(1.0)
            except Exception:
                pass

        st.rerun()

    # Show error if any
    if st.session_state.error:
        st.error(st.session_state.error)
        st.session_state.error = None


# ════════════════════════════════════════════════════════════
# VIEW: Library
# ════════════════════════════════════════════════════════════
elif st.session_state.view == "library":

    if st.session_state.viewing_speech:
        speech = get_speech(st.session_state.viewing_speech, user["id"])
        if not speech:
            st.error("Episode not found.")
            st.session_state.viewing_speech = None
        else:
            # Back button - clear and visible
            if st.button("Back to episodes", key="back_btn"):
                st.session_state.viewing_speech = None
                st.rerun()

            st.markdown(f'<h1 class="hero-title">{speech["topic"]}</h1>', unsafe_allow_html=True)

            # Audio - primary focus
            _render_audio_section(
                speech_id=speech["id"],
                user_id=user["id"],
                final_text=speech["final_text"],
                key_prefix=f"lib_audio_{speech['id']}",
            )

            # Transcript in expander
            with st.expander("Read transcript"):
                st.markdown(speech["final_text"])
                col1, col2 = st.columns(2)
                with col1:
                    st.download_button(
                        "Download .txt", data=speech["final_text"],
                        file_name="transcript.txt", mime="text/plain",
                        key="lib_dl_txt", use_container_width=True,
                    )
                with col2:
                    docx_bytes = export_docx(speech["final_text"], speech["topic"])
                    st.download_button(
                        "Download .docx", data=docx_bytes,
                        file_name="transcript.docx",
                        mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        key="lib_dl_docx", use_container_width=True,
                    )

            # Delete - subtle, at bottom
            st.markdown("---")
            if st.button("Delete this episode", key="lib_del", type="secondary"):
                delete_speech(speech["id"], user["id"])
                st.session_state.viewing_speech = None
                st.toast("Episode deleted.")
                st.rerun()

    else:
        st.markdown('<h1 class="hero-title">Your Episodes</h1>', unsafe_allow_html=True)
        speeches = get_user_speeches(user["id"])

        if not speeches:
            st.markdown("""
            <div class="empty-state">
                <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No episodes yet</p>
                <p style="font-size: 0.9rem;">Create your first one to start learning</p>
            </div>
            """, unsafe_allow_html=True)
            st.markdown("")
            if st.button("Create Episode", type="primary", use_container_width=True):
                st.session_state.view = "create"
                st.rerun()
        else:
            for speech in speeches:
                # Each episode as a clickable card
                with st.container():
                    st.markdown(
                        f'<div class="episode-card">'
                        f'<h4>{speech["topic"]}</h4>'
                        f'<span class="meta">{speech["created_at"][:10]}</span></div>',
                        unsafe_allow_html=True,
                    )
                    if st.button("Play", key=f"open_{speech['id']}", use_container_width=True):
                        st.session_state.viewing_speech = speech["id"]
                        st.rerun()


# ════════════════════════════════════════════════════════════
# VIEW: Reflect (Sovereign Mind Lenses)
# ════════════════════════════════════════════════════════════
elif st.session_state.view == "reflect":
    from lenses import (
        LENS_CATEGORIES,
        SITUATION_EXAMPLES,
        DEFAULT_LENSES,
        get_all_categories,
        get_lenses_for_category,
        get_lens_display_name,
    )
    from pipeline import run_lens_analysis, run_lens_audio_script

    # Check subscription before showing form
    can_generate = user_can_generate()

    if not can_generate:
        render_paywall()
        st.stop()

    # Show results first if we have audio (audio-first experience)
    if st.session_state.lens_audio:
        st.markdown('<h1 class="hero-title">Your Reflection</h1>', unsafe_allow_html=True)

        # Audio player - prominent and immediate
        _render_audio_player(st.session_state.lens_audio, "lens_audio", autoplay=True)

        # New reflection button
        st.markdown("")
        if st.button("New Reflection", use_container_width=True):
            st.session_state.lens_result = None
            st.session_state.lens_audio = None
            st.session_state.lens_situation = ""
            st.rerun()

        # Transcript in expander
        with st.expander("Transcript"):
            st.markdown(st.session_state.lens_result)

        st.stop()

    # ── Input form (minimal for mobile) ──
    st.markdown('<h1 class="hero-title">What\'s on your mind?</h1>', unsafe_allow_html=True)

    situation = st.text_area(
        "Situation",
        height=80,
        placeholder="Describe a decision or situation...",
        label_visibility="collapsed",
        value=st.session_state.get("lens_situation", ""),
    )

    # Default lenses - no selection needed for quick start
    selected_lenses = list(st.session_state.get("lens_selected", []))

    # Lens selection hidden in expander
    with st.expander("Choose lenses (optional)"):
        st.caption("Default: Cognitive, Opportunity Cost, Virtue Ethics")
        for cat_id, cat in LENS_CATEGORIES.items():
            st.markdown(f"**{cat['icon']} {cat['name']}**")
            lenses = get_lenses_for_category(cat_id)
            cols = st.columns(2)
            for i, lens in enumerate(lenses):
                lens_key = (cat_id, lens["id"])
                is_selected = lens_key in selected_lenses
                with cols[i % 2]:
                    if st.checkbox(lens["name"], value=is_selected, key=f"cb_{cat_id}_{lens['id']}"):
                        if lens_key not in selected_lenses and len(selected_lenses) < 3:
                            selected_lenses.append(lens_key)
                    else:
                        if lens_key in selected_lenses:
                            selected_lenses.remove(lens_key)
            st.markdown("")
        st.session_state.lens_selected = selected_lenses
        if selected_lenses:
            lens_names = [get_lens_display_name(c, l) for c, l in selected_lenses]
            st.info(" • ".join(lens_names))

    # Single primary button - Deep Reflection (audio)
    reflect = st.button(
        "Reflect",
        type="primary",
        disabled=not situation.strip() or st.session_state.lens_running,
        use_container_width=True,
    )
    st.caption("~2 min to generate • 5 min audio reflection")

    # Quick text option as secondary
    quick_mode = st.button(
        "Quick Text Analysis",
        type="secondary",
        disabled=not situation.strip() or st.session_state.lens_running,
        use_container_width=True,
    )

    # Handle generation
    if (reflect or quick_mode) and situation.strip():
        st.session_state.lens_situation = situation
        st.session_state.lens_running = True
        st.session_state.lens_result = None
        st.session_state.lens_audio = None

        # Use selected lenses or defaults
        lenses_to_use = selected_lenses if selected_lenses else DEFAULT_LENSES
        st.session_state.lens_selected = lenses_to_use

        st.markdown("---")

        if quick_mode:
            with st.spinner("Analyzing..."):
                try:
                    result = run_lens_analysis(situation, lenses_to_use)
                    st.session_state.lens_result = result
                except Exception as e:
                    st.error(f"Analysis failed: {e}")
        else:
            # Deep reflection with audio
            progress = st.progress(0)
            status = st.empty()

            status.markdown('<div class="progress-status">Crafting your reflection...</div>', unsafe_allow_html=True)
            try:
                script = run_lens_audio_script(situation, lenses_to_use, minutes=5)
                st.session_state.lens_result = script
                progress.progress(0.5)

                status.markdown('<div class="progress-status">Creating audio...</div>', unsafe_allow_html=True)
                audio_bytes = generate_audio(script, voice="nova", speed=1.0)
                st.session_state.lens_audio = audio_bytes
                progress.progress(1.0)

            except Exception as e:
                st.error(f"Reflection failed: {e}")

        st.session_state.lens_running = False
        st.rerun()

    # Display text-only results (no audio)
    if st.session_state.lens_result and not st.session_state.lens_audio:
        st.markdown("---")
        st.markdown("### Analysis")
        st.markdown(st.session_state.lens_result)

        if st.button("New Reflection", key="new_text", use_container_width=True):
            st.session_state.lens_result = None
            st.session_state.lens_situation = ""
            st.rerun()
