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
    save_reflection, save_reflection_audio, get_reflection_audio,
    get_user_reflections, get_reflection, delete_reflection,
    get_user_streak, get_reflection_stats,
)
from pipeline import run_full_pipeline, generate_addon, generate_perspective, generate_combined_perspectives
from prompts import LEARNING_ADDONS, PERSPECTIVE_LENSES
from exporter import export_docx, generate_audio
from payments import (
    is_free_user, create_checkout_session, handle_checkout_success,
    get_customer_portal_url, can_generate_free, get_free_episodes_remaining,
    FREE_EPISODE_LIMIT,
)
from topics import get_random_topic, get_featured_topics, TOPIC_CATEGORIES, get_topics_by_category
from visual_kit import inject_css, stepper, progress_status, chapter_marker, pull_quote, takeaway_box, cover_art, celebrate

st.set_page_config(
    page_title="MindCast",
    page_icon="🎧",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Inject Visual Kit CSS ───────────────────────────────────
inject_css()

# ── App-Specific Styles (extend visual kit) ─────────────────
st.markdown("""
<style>
    /* Hero title (legacy class) */
    .hero-title {
        font-size: 2rem;
        font-weight: 700;
        background: var(--mc-brand-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 1.25rem;
        letter-spacing: -0.02em;
    }

    /* Progress status (legacy class) */
    .progress-status {
        text-align: center;
        padding: 1.5rem 1rem;
        color: var(--mc-text-secondary);
        font-size: 0.9rem;
    }

    /* Topic suggestions */
    .topic-suggestions {
        margin: 1rem 0;
    }
    .topic-suggestions-label {
        font-size: 0.8rem;
        color: var(--mc-text-tertiary);
        margin-bottom: 0.5rem;
    }

    /* Surprise me button */
    .surprise-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        background: var(--mc-brand-gradient);
        border: none;
        border-radius: 20px;
        padding: 0.5rem 1rem;
        margin: 0.25rem;
        font-size: 0.85rem;
        color: white;
        cursor: pointer;
        transition: all var(--mc-transition-fast);
        font-weight: 500;
    }
    .surprise-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    /* Success celebration */
    .success-card {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: var(--mc-radius-lg);
        padding: 1.5rem;
        text-align: center;
        color: white;
        margin-bottom: 1rem;
        animation: successPop 0.4s ease-out;
        box-shadow: var(--mc-shadow-md);
    }
    @keyframes successPop {
        0% { transform: scale(0.95); opacity: 0; }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); opacity: 1; }
    }
    .success-card h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
        color: white;
    }
    .success-card p {
        opacity: 0.9;
        font-size: 0.9rem;
        margin: 0;
        color: white;
    }

    /* Free episodes badge */
    .free-badge {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.35rem 0.75rem;
        border-radius: 20px;
        display: inline-block;
        margin-bottom: 1rem;
    }
    .free-badge.low {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    /* Sidebar section labels */
    .stSidebar [data-testid="stMarkdownContainer"] p {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--mc-text-tertiary);
        margin-bottom: 0.25rem;
    }

    /* Ready to generate pulse */
    @keyframes subtlePulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        50% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15); }
    }
    .ready-to-generate {
        animation: subtlePulse 2s infinite;
    }

    /* Learning Add-ons Section */
    .addons-section {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--mc-border);
    }
    .addons-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--mc-text-primary);
        margin-bottom: 0.75rem;
    }
    .addon-btn-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    @media (max-width: 480px) {
        .addon-btn-grid {
            grid-template-columns: 1fr;
        }
    }
    .addon-result {
        background: var(--mc-bg-tertiary);
        border: 1px solid var(--mc-border);
        border-radius: var(--mc-radius-md);
        padding: 1.25rem;
        margin-top: 1rem;
    }
    .addon-result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    .addon-result-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--mc-text-primary);
    }

    /* Perspective Lenses */
    .lens-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    @media (max-width: 480px) {
        .lens-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    .lens-chip {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        background: var(--mc-bg-secondary);
        border: 1px solid var(--mc-border);
        border-radius: var(--mc-radius-sm);
        padding: 0.5rem 0.75rem;
        font-size: 0.85rem;
        color: var(--mc-text-secondary);
        cursor: pointer;
        transition: all var(--mc-transition-fast);
    }
    .lens-chip:hover {
        background: var(--mc-bg-accent);
        border-color: var(--mc-brand);
    }
    .lens-chip.selected {
        background: var(--mc-brand);
        border-color: var(--mc-brand);
        color: white;
    }
    .lens-chip .icon {
        font-size: 1rem;
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
        <h2>🎧 Unlock Unlimited Learning</h2>
        <p>Create documentary-style episodes on any topic.<br/>Learn while you commute, exercise, or relax.</p>
        <div class="paywall-price">$19.99<span>/month</span></div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("")
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if st.button("Start Learning", type="primary", use_container_width=True):
            base_url = st.context.headers.get("Origin", "http://localhost:8501")
            checkout_url = create_checkout_session(user["email"], user["id"], base_url)
            st.markdown(f'<meta http-equiv="refresh" content="0;url={checkout_url}">', unsafe_allow_html=True)
        st.caption("Cancel anytime · Secure payment via Stripe")


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
    # Learning add-ons state
    "addon_results": {},  # {addon_key: result_text}
    "addon_running": None,  # Currently generating addon key
    "selected_perspectives": [],  # List of perspective lens keys
    "perspective_result": None,
    # Sovereign Mind reflection state
    "sm_last_reflection_id": None,
    "sm_context_used": "",  # The context that was used for the reflection
    "sm_mode_used": "",  # The mode used
    "sm_module_used": "",  # Module used
    "sm_exercise_used": "",  # Exercise used
    "viewing_reflection": None,  # For viewing past reflections
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
    if st.button("✨ New Episode", use_container_width=True, type="primary" if st.session_state.view == "create" else "secondary"):
        st.session_state.view = "create"
        st.session_state.viewing_speech = None
        st.session_state.steps = []
        st.session_state.final_text = None
        st.rerun()
    if st.button("📚 My Episodes", use_container_width=True, type="primary" if st.session_state.view == "library" else "secondary"):
        st.session_state.view = "library"
        st.rerun()

    st.markdown("")
    st.caption("REFLECT")
    if st.button("🧠 Sovereign Mind", use_container_width=True, type="primary" if st.session_state.view == "reflect" else "secondary"):
        st.session_state.view = "reflect"
        st.session_state.sm_result = None
        st.session_state.sm_audio = None
        st.rerun()
    if st.button("📜 My Reflections", use_container_width=True, type="primary" if st.session_state.view == "reflections" else "secondary"):
        st.session_state.view = "reflections"
        st.rerun()

    # Show streak if user has reflections
    streak_info = get_user_streak(user["id"])
    if streak_info["total_reflections"] > 0:
        streak_display = f"🔥 {streak_info['current_streak']}" if streak_info["current_streak"] > 0 else "💤"
        st.markdown(
            f'<div style="text-align:center;padding:8px;margin-top:8px;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:8px;">'
            f'<span style="font-size:1.2em;">{streak_display}</span> '
            f'<span style="color:#888;font-size:0.85em;">{streak_info["total_reflections"]} reflections</span>'
            f'</div>',
            unsafe_allow_html=True,
        )

    # Show free episodes remaining (for non-subscribed, non-free users)
    sub = get_user_subscription(user["id"])
    if sub["status"] != "active" and not is_free_user(user["email"]):
        remaining = get_free_episodes_remaining(user["id"])
        if remaining > 0:
            st.markdown("---")
            badge_class = "free-badge low" if remaining == 1 else "free-badge"
            st.markdown(f'<div class="{badge_class}">{remaining} free episode{"s" if remaining > 1 else ""} left</div>', unsafe_allow_html=True)

    # Subscription management (only show if subscribed)
    if sub["status"] == "active" and sub["customer_id"]:
        st.markdown("---")
        base_url = st.context.headers.get("Origin", "http://localhost:8501")
        portal_url = get_customer_portal_url(sub["customer_id"], base_url)
        st.link_button("⚙️ Manage Subscription", portal_url, use_container_width=True)


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
        # Success celebration
        st.markdown("""
        <div class="success-card">
            <h2>Your episode is ready!</h2>
            <p>Press play to start learning</p>
        </div>
        """, unsafe_allow_html=True)

        st.markdown(f'<h1 class="hero-title">{st.session_state.topic}</h1>', unsafe_allow_html=True)

        # Audio player - prominent and immediate
        _render_audio_section(
            speech_id=st.session_state.last_speech_id,
            user_id=user["id"],
            final_text=st.session_state.final_text,
            key_prefix="create_audio",
            autoplay=True,
        )

        # ── Learning Add-ons Section ──
        st.markdown('<div class="addons-section">', unsafe_allow_html=True)
        st.markdown('<div class="addons-title">🎓 Deepen Your Learning</div>', unsafe_allow_html=True)

        # Quick add-on buttons (quiz, journal, takeaways)
        addon_cols = st.columns(3)
        for i, (addon_key, addon) in enumerate(LEARNING_ADDONS.items()):
            with addon_cols[i]:
                is_generated = addon_key in st.session_state.addon_results
                btn_label = f"{addon['icon']} {addon['name']}" if not is_generated else f"✓ {addon['name']}"
                if st.button(
                    btn_label,
                    key=f"addon_{addon_key}",
                    use_container_width=True,
                    disabled=st.session_state.addon_running is not None,
                ):
                    if not is_generated:
                        st.session_state.addon_running = addon_key
                        with st.spinner(f"Generating {addon['name'].lower()}..."):
                            try:
                                result = generate_addon(
                                    addon_key,
                                    st.session_state.topic,
                                    st.session_state.final_text
                                )
                                st.session_state.addon_results[addon_key] = result
                            except Exception as e:
                                st.error(f"Failed to generate {addon['name']}: {e}")
                        st.session_state.addon_running = None
                        st.rerun()

        # Show generated add-on results
        for addon_key, result in st.session_state.addon_results.items():
            addon = LEARNING_ADDONS[addon_key]
            with st.expander(f"{addon['icon']} {addon['name']}", expanded=True):
                st.markdown(result)

        # ── Perspective Lenses Section ──
        st.markdown("")
        with st.expander("🔍 Apply Thinking Lenses"):
            st.caption("Analyze this topic through different intellectual frameworks")

            # Lens selection as checkboxes
            lens_cols = st.columns(2)
            selected = list(st.session_state.selected_perspectives)
            for i, (lens_key, lens) in enumerate(PERSPECTIVE_LENSES.items()):
                with lens_cols[i % 2]:
                    is_selected = lens_key in selected
                    if st.checkbox(
                        f"{lens['icon']} {lens['name']}",
                        value=is_selected,
                        key=f"perspective_{lens_key}",
                        help=lens['description']
                    ):
                        if lens_key not in selected:
                            selected.append(lens_key)
                    else:
                        if lens_key in selected:
                            selected.remove(lens_key)
            st.session_state.selected_perspectives = selected

            # Generate button
            if selected:
                st.caption(f"Selected: {', '.join(PERSPECTIVE_LENSES[k]['name'] for k in selected)}")
                if st.button(
                    f"Generate {len(selected)}-Lens Analysis",
                    type="primary",
                    use_container_width=True,
                    key="generate_perspectives",
                ):
                    with st.spinner("Applying lenses..."):
                        try:
                            if len(selected) == 1:
                                result = generate_perspective(
                                    selected[0],
                                    st.session_state.topic,
                                    st.session_state.final_text
                                )
                            else:
                                result = generate_combined_perspectives(
                                    selected,
                                    st.session_state.topic,
                                    st.session_state.final_text
                                )
                            st.session_state.perspective_result = result
                        except Exception as e:
                            st.error(f"Failed to generate perspective analysis: {e}")
                    st.rerun()
            else:
                st.caption("Select 1-3 lenses to apply")

        # Show perspective result
        if st.session_state.perspective_result:
            lens_names = " + ".join(
                PERSPECTIVE_LENSES[k]['icon'] + " " + PERSPECTIVE_LENSES[k]['name']
                for k in st.session_state.selected_perspectives
            )
            with st.expander(f"🔍 {lens_names}", expanded=True):
                st.markdown(st.session_state.perspective_result)
                if st.button("Clear", key="clear_perspective"):
                    st.session_state.perspective_result = None
                    st.session_state.selected_perspectives = []
                    st.rerun()

        st.markdown('</div>', unsafe_allow_html=True)

        # Create another button
        st.markdown("")
        if st.button("Create Another", use_container_width=True):
            st.session_state.final_text = None
            st.session_state.last_speech_id = None
            st.session_state.topic = ""
            st.session_state.topic_text_area = ""
            st.session_state.addon_results = {}
            st.session_state.perspective_result = None
            st.session_state.selected_perspectives = []
            st.rerun()

        # Transcript in expander (minimal)
        with st.expander("Transcript"):
            st.markdown(st.session_state.final_text)

        st.stop()

    # ── Input form (minimal for mobile) ──
    st.markdown('<h1 class="hero-title">What do you want to learn?</h1>', unsafe_allow_html=True)

    # Initialize topic in session state
    if "topic_text_area" not in st.session_state:
        st.session_state.topic_text_area = ""

    topic = st.text_area(
        "Topic",
        height=80,
        placeholder="e.g., How does memory work and why do we forget?",
        label_visibility="collapsed",
        key="topic_text_area",
    )

    # "Surprise me" and topic suggestions
    col_surprise, col_spacer = st.columns([1, 2])
    with col_surprise:
        if st.button("🎲 Surprise me", key="surprise_btn", use_container_width=True):
            st.session_state.topic_text_area = get_random_topic()
            st.rerun()

    # Show topic suggestions when input is empty
    if not topic.strip():
        st.markdown('<div class="topic-suggestions-label">Or try one of these:</div>', unsafe_allow_html=True)
        suggestions = get_featured_topics(4)
        cols = st.columns(2)
        for i, suggestion in enumerate(suggestions):
            with cols[i % 2]:
                # Truncate long suggestions for display
                display = suggestion[:40] + "..." if len(suggestion) > 43 else suggestion
                if st.button(display, key=f"suggestion_{i}", use_container_width=True):
                    st.session_state.topic_text_area = suggestion
                    st.rerun()

        # Category browsing
        with st.expander("Browse by category"):
            selected_cat = st.selectbox(
                "Category",
                options=list(TOPIC_CATEGORIES.keys()),
                format_func=lambda x: f"{TOPIC_CATEGORIES[x]['icon']} {TOPIC_CATEGORIES[x]['name']}",
                label_visibility="collapsed",
            )
            if selected_cat:
                cat_topics = get_topics_by_category(selected_cat, n=6)
                if cat_topics:
                    for i, cat_topic in enumerate(cat_topics):
                        display = cat_topic[:50] + "..." if len(cat_topic) > 53 else cat_topic
                        if st.button(display, key=f"cat_topic_{i}", use_container_width=True):
                            st.session_state.topic_text_area = cat_topic
                            st.rerun()
                else:
                    st.caption("No topics found in this category.")

    # Defaults - no selection needed
    length = "5 min"
    selected_voice = "onyx"

    # Options hidden in expander for those who want them
    with st.expander("Options"):
        col_len, col_voice = st.columns([1, 1])
        with col_len:
            length = st.selectbox(
                "Duration",
                options=EPISODE_LENGTHS,
                index=0,  # Default to 5 min (mobile-friendly)
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
    st.caption(f"⏱️ ~{time_estimates.get(length, '4-6')} min to craft your episode")
    if not topic.strip():
        st.caption("💡 Tip: The more specific your topic, the better the episode")

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

            # ── Learning Add-ons for Library ──
            st.markdown('<div class="addons-section">', unsafe_allow_html=True)
            st.markdown('<div class="addons-title">🎓 Deepen Your Learning</div>', unsafe_allow_html=True)

            # Initialize library-specific addon state with speech ID
            lib_addon_key = f"lib_addon_{speech['id']}"
            lib_perspective_key = f"lib_perspective_{speech['id']}"
            if lib_addon_key not in st.session_state:
                st.session_state[lib_addon_key] = {}
            if lib_perspective_key not in st.session_state:
                st.session_state[lib_perspective_key] = None

            # Quick add-on buttons
            addon_cols = st.columns(3)
            for i, (addon_key, addon) in enumerate(LEARNING_ADDONS.items()):
                with addon_cols[i]:
                    is_generated = addon_key in st.session_state[lib_addon_key]
                    btn_label = f"{addon['icon']} {addon['name']}" if not is_generated else f"✓ {addon['name']}"
                    if st.button(btn_label, key=f"lib_addon_{speech['id']}_{addon_key}", use_container_width=True):
                        if not is_generated:
                            with st.spinner(f"Generating {addon['name'].lower()}..."):
                                try:
                                    result = generate_addon(addon_key, speech["topic"], speech["final_text"])
                                    st.session_state[lib_addon_key][addon_key] = result
                                except Exception as e:
                                    st.error(f"Failed: {e}")
                            st.rerun()

            # Show generated add-on results
            for addon_key, result in st.session_state[lib_addon_key].items():
                addon = LEARNING_ADDONS[addon_key]
                with st.expander(f"{addon['icon']} {addon['name']}", expanded=True):
                    st.markdown(result)

            # Perspective lenses
            with st.expander("🔍 Apply Thinking Lenses"):
                lib_selected_key = f"lib_selected_lenses_{speech['id']}"
                if lib_selected_key not in st.session_state:
                    st.session_state[lib_selected_key] = []

                lens_cols = st.columns(2)
                selected = list(st.session_state[lib_selected_key])
                for i, (lens_key, lens) in enumerate(PERSPECTIVE_LENSES.items()):
                    with lens_cols[i % 2]:
                        is_selected = lens_key in selected
                        if st.checkbox(
                            f"{lens['icon']} {lens['name']}",
                            value=is_selected,
                            key=f"lib_persp_{speech['id']}_{lens_key}",
                            help=lens['description']
                        ):
                            if lens_key not in selected:
                                selected.append(lens_key)
                        else:
                            if lens_key in selected:
                                selected.remove(lens_key)
                st.session_state[lib_selected_key] = selected

                if selected:
                    st.caption(f"Selected: {', '.join(PERSPECTIVE_LENSES[k]['name'] for k in selected)}")
                    if st.button(f"Generate Analysis", type="primary", use_container_width=True, key=f"lib_gen_persp_{speech['id']}"):
                        with st.spinner("Applying lenses..."):
                            try:
                                if len(selected) == 1:
                                    result = generate_perspective(selected[0], speech["topic"], speech["final_text"])
                                else:
                                    result = generate_combined_perspectives(selected, speech["topic"], speech["final_text"])
                                st.session_state[lib_perspective_key] = result
                            except Exception as e:
                                st.error(f"Failed: {e}")
                        st.rerun()

            if st.session_state[lib_perspective_key]:
                lib_selected_key = f"lib_selected_lenses_{speech['id']}"
                lens_names = " + ".join(PERSPECTIVE_LENSES[k]['icon'] + " " + PERSPECTIVE_LENSES[k]['name'] for k in st.session_state.get(lib_selected_key, []))
                with st.expander(f"🔍 {lens_names}", expanded=True):
                    st.markdown(st.session_state[lib_perspective_key])

            st.markdown('</div>', unsafe_allow_html=True)

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
                <p style="font-size: 2rem; margin-bottom: 0.75rem;">🎧</p>
                <p style="font-size: 1.1rem; margin-bottom: 0.5rem; font-weight: 500;">Your library is empty</p>
                <p style="font-size: 0.9rem;">Create your first episode and start your learning journey</p>
            </div>
            """, unsafe_allow_html=True)
            st.markdown("")
            if st.button("✨ Create Your First Episode", type="primary", use_container_width=True):
                st.session_state.view = "create"
                st.rerun()
        else:
            for speech in speeches:
                # Estimate duration from word count (~150 words per minute for narration)
                word_count = len(speech.get("final_text", "").split())
                duration_min = max(1, round(word_count / 150))

                # Each episode as a clickable card
                with st.container():
                    st.markdown(
                        f'<div class="episode-card">'
                        f'<h4>{speech["topic"]}</h4>'
                        f'<span class="meta">{speech["created_at"][:10]} · ~{duration_min} min</span></div>',
                        unsafe_allow_html=True,
                    )
                    if st.button("▶️ Play", key=f"open_{speech['id']}", use_container_width=True):
                        st.session_state.viewing_speech = speech["id"]
                        st.rerun()


# ════════════════════════════════════════════════════════════
# VIEW: Sovereign Mind (Full Cognitive Operating System)
# ════════════════════════════════════════════════════════════
elif st.session_state.view == "reflect":
    from sovereign_mind import (
        LENS_CATEGORIES,
        SOVEREIGN_LENSES,
        PRACTICE_MODULES,
        DAILY_RITUALS,
        IDENTITY_MODULES,
        SOCIAL_MODULES,
        EMBODIMENT_MODULES,
        ENVIRONMENT_MODULES,
        MEANING_MODULES,
        get_lenses_by_category,
        build_multi_lens_prompt,
        build_exercise_prompt,
        build_ritual_prompt,
        build_identity_prompt,
        build_social_prompt,
        build_embodiment_prompt,
        build_environment_prompt,
        build_meaning_prompt,
    )
    from pipeline import _call_llm_safe

    # Check subscription before showing form
    can_generate = user_can_generate()

    if not can_generate:
        render_paywall()
        st.stop()

    # Initialize Sovereign Mind state
    if "sm_mode" not in st.session_state:
        st.session_state.sm_mode = "lens"  # lens, practice, ritual
    if "sm_selected_lenses" not in st.session_state:
        st.session_state.sm_selected_lenses = []
    if "sm_result" not in st.session_state:
        st.session_state.sm_result = None
    if "sm_audio" not in st.session_state:
        st.session_state.sm_audio = None

    # Show results first if we have them
    if st.session_state.sm_result:
        # Success header with mode info
        mode_info = SM_MODES.get(st.session_state.get("sm_mode_used", ""), {})
        mode_icon = mode_info.get("icon", "🧠")
        mode_name = mode_info.get("name", "Reflection")

        st.markdown(f"""
        <div class="success-card" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);">
            <h2>{mode_icon} {mode_name} Complete</h2>
            <p>Your reflection is ready</p>
        </div>
        """, unsafe_allow_html=True)

        # Audio section
        if st.session_state.sm_audio:
            _render_audio_player(st.session_state.sm_audio, "sm_audio", autoplay=True)
        else:
            # Offer to generate audio
            if st.button("🔊 Generate Audio Version", use_container_width=True):
                with st.spinner("Creating audio..."):
                    try:
                        audio_bytes = generate_audio(st.session_state.sm_result, voice="nova", speed=1.0)
                        st.session_state.sm_audio = audio_bytes
                        # Save audio if we have a reflection ID
                        if st.session_state.sm_last_reflection_id:
                            save_reflection_audio(
                                st.session_state.sm_last_reflection_id,
                                user["id"],
                                audio_bytes,
                                "nova"
                            )
                        st.rerun()
                    except Exception as e:
                        st.error(f"Audio generation failed: {e}")

        # Result content
        with st.expander("📖 Full Analysis", expanded=not st.session_state.sm_audio):
            st.markdown(st.session_state.sm_result)

        # Action buttons
        st.markdown("")
        col1, col2 = st.columns(2)
        with col1:
            # Save reflection (if not already saved)
            if not st.session_state.sm_last_reflection_id:
                if st.button("💾 Save Reflection", use_container_width=True, type="primary"):
                    reflection_id = save_reflection(
                        user_id=user["id"],
                        mode=st.session_state.get("sm_mode_used", ""),
                        module=st.session_state.get("sm_module_used"),
                        exercise=st.session_state.get("sm_exercise_used"),
                        context=st.session_state.get("sm_context_used", ""),
                        result=st.session_state.sm_result,
                    )
                    st.session_state.sm_last_reflection_id = reflection_id
                    # Save audio if we have it
                    if st.session_state.sm_audio:
                        save_reflection_audio(reflection_id, user["id"], st.session_state.sm_audio, "nova")
                    st.toast("Reflection saved!")
                    st.rerun()
            else:
                st.success("✓ Saved")

        with col2:
            if st.button("✨ New Reflection", use_container_width=True):
                st.session_state.sm_result = None
                st.session_state.sm_audio = None
                st.session_state.sm_selected_lenses = []
                st.session_state.lens_situation = ""
                st.session_state.sm_last_reflection_id = None
                st.session_state.sm_context_used = ""
                st.session_state.sm_mode_used = ""
                st.session_state.sm_module_used = ""
                st.session_state.sm_exercise_used = ""
                st.rerun()

        st.stop()

    # ── Sovereign Mind - Cognitive Operating System ──
    st.markdown('<h1 class="hero-title">Sovereign Mind</h1>', unsafe_allow_html=True)
    st.caption("Your cognitive operating system for intentional thinking")

    # Mode definitions with full descriptions
    SM_MODES = {
        "lens": {
            "icon": "🔍",
            "name": "Lenses",
            "tagline": "See clearly through 34 philosophical perspectives",
            "category": "perceive",
        },
        "practice": {
            "icon": "🥋",
            "name": "Practice",
            "tagline": "Train your mind in the mental gyms",
            "category": "train",
        },
        "ritual": {
            "icon": "🌅",
            "name": "Rituals",
            "tagline": "Structure your day with intention",
            "category": "train",
        },
        "identity": {
            "icon": "🧭",
            "name": "Identity",
            "tagline": "Clarify who you're becoming",
            "category": "self",
        },
        "social": {
            "icon": "🤝",
            "name": "Social",
            "tagline": "Navigate relationships skillfully",
            "category": "world",
        },
        "body": {
            "icon": "🧘",
            "name": "Body",
            "tagline": "Connect mind and body",
            "category": "world",
        },
        "environment": {
            "icon": "🏠",
            "name": "Environment",
            "tagline": "Shape your surroundings",
            "category": "world",
        },
        "meaning": {
            "icon": "✨",
            "name": "Meaning",
            "tagline": "Connect with what's larger",
            "category": "self",
        },
    }

    # Grouped mode selection
    mode_options = [f"{SM_MODES[k]['icon']} {SM_MODES[k]['name']} — {SM_MODES[k]['tagline']}" for k in SM_MODES]
    mode_keys = list(SM_MODES.keys())

    current_idx = mode_keys.index(st.session_state.sm_mode) if st.session_state.sm_mode in mode_keys else 0

    selected_display = st.selectbox(
        "What would you like to work on?",
        options=mode_options,
        index=current_idx,
        key="sm_mode_selector",
    )

    # Update mode from selection
    selected_idx = mode_options.index(selected_display)
    new_mode = mode_keys[selected_idx]
    if new_mode != st.session_state.sm_mode:
        st.session_state.sm_mode = new_mode
        st.rerun()

    # Time-based suggestion
    from datetime import datetime
    hour = datetime.now().hour
    if hour < 10:
        suggested = ("ritual", "morning", "Start your day with intention")
    elif hour < 14:
        suggested = ("lens", None, "Apply clear thinking to a challenge")
    elif hour < 18:
        suggested = ("practice", None, "Train a mental skill")
    else:
        suggested = ("ritual", "evening", "Reflect on your day")

    if st.session_state.sm_mode != suggested[0]:
        st.caption(f"💡 Suggestion: {suggested[2]}")

    st.markdown("---")

    # ════════════════════════════════════════════════════════════
    # MODE: Lens Analysis (34 lenses across 7 categories)
    # ════════════════════════════════════════════════════════════
    if st.session_state.sm_mode == "lens":
        st.caption("Apply multiple perspectives to any situation")

        situation = st.text_area(
            "Situation",
            height=100,
            placeholder="Describe a decision, dilemma, or situation you're facing...",
            label_visibility="collapsed",
            key="sm_situation",
        )

        # Lens selection by category
        st.markdown("**Select 1-5 lenses:**")
        selected = list(st.session_state.sm_selected_lenses)

        for cat_id, cat in LENS_CATEGORIES.items():
            with st.expander(f"{cat['icon']} {cat['name']} — {cat['question']}"):
                lenses = get_lenses_by_category(cat_id)
                cols = st.columns(2)
                for i, lens in enumerate(lenses):
                    with cols[i % 2]:
                        is_selected = lens["id"] in selected
                        if st.checkbox(
                            f"{lens['icon']} {lens['name']}",
                            value=is_selected,
                            key=f"sm_lens_{lens['id']}",
                            help=lens["description"],
                        ):
                            if lens["id"] not in selected and len(selected) < 5:
                                selected.append(lens["id"])
                        else:
                            if lens["id"] in selected:
                                selected.remove(lens["id"])

        st.session_state.sm_selected_lenses = selected

        # Show selected lenses
        if selected:
            selected_names = [f"{SOVEREIGN_LENSES[lid]['icon']} {SOVEREIGN_LENSES[lid]['name']}" for lid in selected]
            st.info(f"Selected: {' • '.join(selected_names)}")

        # Generate buttons
        col1, col2 = st.columns(2)
        with col1:
            analyze_btn = st.button(
                "Analyze",
                type="primary",
                disabled=not situation.strip() or not selected or st.session_state.lens_running,
                use_container_width=True,
            )
        with col2:
            audio_btn = st.button(
                "Analyze + Audio",
                type="secondary",
                disabled=not situation.strip() or not selected or st.session_state.lens_running,
                use_container_width=True,
            )

        if (analyze_btn or audio_btn) and situation.strip() and selected:
            st.session_state.lens_running = True
            st.session_state.lens_situation = situation

            # Track context for saving
            st.session_state.sm_mode_used = "lens"
            st.session_state.sm_context_used = situation
            st.session_state.sm_module_used = ", ".join(selected)
            st.session_state.sm_exercise_used = None
            st.session_state.sm_last_reflection_id = None

            system, user_content = build_multi_lens_prompt(selected, situation)

            with st.spinner("Applying lenses..."):
                try:
                    result = _call_llm_safe(
                        provider="anthropic",
                        system=system,
                        user_content=user_content,
                        temperature=0.7,
                        model_override="claude-sonnet-4-20250514",
                    )
                    st.session_state.sm_result = result

                    if audio_btn:
                        with st.spinner("Creating audio..."):
                            audio_bytes = generate_audio(result, voice="nova", speed=1.0)
                            st.session_state.sm_audio = audio_bytes

                except Exception as e:
                    st.error(f"Analysis failed: {e}")

            st.session_state.lens_running = False
            st.rerun()

    # ════════════════════════════════════════════════════════════
    # MODE: Practice Modules (Mental Gyms)
    # ════════════════════════════════════════════════════════════
    elif st.session_state.sm_mode == "practice":
        st.caption("Train specific mental capabilities")

        # Module selection
        selected_module = st.selectbox(
            "Choose a practice module:",
            options=list(PRACTICE_MODULES.keys()),
            format_func=lambda x: f"{PRACTICE_MODULES[x]['icon']} {PRACTICE_MODULES[x]['name']}",
        )

        module = PRACTICE_MODULES[selected_module]
        st.markdown(f"*{module['description']}*")

        # Exercise selection
        st.markdown("**Choose an exercise:**")
        exercise_idx = st.radio(
            "Exercise",
            options=range(len(module["exercises"])),
            format_func=lambda x: module["exercises"][x]["name"],
            label_visibility="collapsed",
            horizontal=True,
        )

        exercise = module["exercises"][exercise_idx]
        with st.expander(f"📋 {exercise['name']} — View full prompt", expanded=False):
            st.markdown(exercise["prompt"])

        # Context input
        st.markdown("**Your context:**")
        context = st.text_area(
            "Your context",
            height=100,
            placeholder="Describe your current situation or what you want to work on...",
            label_visibility="collapsed",
            key="sm_practice_context",
        )

        if st.button("Start Exercise", type="primary", disabled=not context.strip(), use_container_width=True):
            # Track context for saving
            st.session_state.sm_mode_used = "practice"
            st.session_state.sm_context_used = context
            st.session_state.sm_module_used = module["name"]
            st.session_state.sm_exercise_used = exercise["name"]
            st.session_state.sm_last_reflection_id = None
            st.session_state.sm_audio = None

            system, user_content = build_exercise_prompt(selected_module, exercise_idx, context)

            with st.spinner(f"Preparing {exercise['name']}..."):
                try:
                    result = _call_llm_safe(
                        provider="anthropic",
                        system=system,
                        user_content=user_content,
                        temperature=0.7,
                        model_override="claude-sonnet-4-20250514",
                    )
                    st.session_state.sm_result = result
                except Exception as e:
                    st.error(f"Exercise failed: {e}")

            st.rerun()

    # ════════════════════════════════════════════════════════════
    # MODE: Daily Rituals
    # ════════════════════════════════════════════════════════════
    elif st.session_state.sm_mode == "ritual":
        st.caption("Structured daily reflection practices")

        # Ritual selection
        cols = st.columns(3)
        for i, (ritual_id, ritual) in enumerate(DAILY_RITUALS.items()):
            with cols[i]:
                st.markdown(f"""
                <div style="text-align: center; padding: 1rem; background: #f9fafb;
                            border-radius: 12px; border: 1px solid #e5e7eb;">
                    <div style="font-size: 2rem;">{ritual['icon']}</div>
                    <div style="font-weight: 600; margin: 0.5rem 0;">{ritual['name']}</div>
                    <div style="color: #6b7280; font-size: 0.8rem;">{ritual['duration']}</div>
                </div>
                """, unsafe_allow_html=True)
                if st.button(f"Start", key=f"ritual_{ritual_id}", use_container_width=True):
                    st.session_state.sm_selected_ritual = ritual_id

        # If ritual selected, show it
        if "sm_selected_ritual" in st.session_state and st.session_state.sm_selected_ritual:
            ritual_id = st.session_state.sm_selected_ritual
            ritual = DAILY_RITUALS[ritual_id]

            st.markdown("---")
            st.markdown(f"### {ritual['icon']} {ritual['name']}")

            # Show prompts
            for i, prompt in enumerate(ritual["prompts"]):
                st.markdown(f"**{i+1}.** {prompt}")

            # Option to get AI guidance
            if st.button("Get Guided Reflection", type="primary", use_container_width=True):
                # Track context for saving
                st.session_state.sm_mode_used = "ritual"
                st.session_state.sm_context_used = f"{ritual['name']} ritual"
                st.session_state.sm_module_used = ritual["name"]
                st.session_state.sm_exercise_used = ritual["time"]
                st.session_state.sm_last_reflection_id = None
                st.session_state.sm_audio = None

                system, user_content = build_ritual_prompt(ritual_id)

                with st.spinner("Preparing your reflection..."):
                    try:
                        result = _call_llm_safe(
                            provider="anthropic",
                            system=system,
                            user_content=user_content,
                            temperature=0.7,
                            model_override="claude-sonnet-4-20250514",
                        )
                        st.session_state.sm_result = result
                    except Exception as e:
                        st.error(f"Failed: {e}")

                st.rerun()

            if st.button("Back", use_container_width=True):
                st.session_state.sm_selected_ritual = None
                st.rerun()

    # ════════════════════════════════════════════════════════════
    # MODE: Identity Layer - "Who Am I Choosing to Become?"
    # ════════════════════════════════════════════════════════════
    elif st.session_state.sm_mode == "identity":
        st.caption("Clarify who you are and who you're becoming")

        # Module selection
        selected_module = st.selectbox(
            "Choose an identity module:",
            options=list(IDENTITY_MODULES.keys()),
            format_func=lambda x: f"{IDENTITY_MODULES[x]['icon']} {IDENTITY_MODULES[x]['name']}",
            key="sm_identity_module",
        )

        module = IDENTITY_MODULES[selected_module]
        st.markdown(f"*{module['description']}*")

        # Exercise selection
        st.markdown("**Choose an exercise:**")
        exercise_idx = st.radio(
            "Exercise",
            options=range(len(module["exercises"])),
            format_func=lambda x: module["exercises"][x]["name"],
            label_visibility="collapsed",
            horizontal=True,
            key="sm_identity_exercise",
        )

        exercise = module["exercises"][exercise_idx]
        with st.expander(f"📋 {exercise['name']} — View full prompt", expanded=False):
            st.markdown(exercise["prompt"])

        # Context input
        st.markdown("**Your reflection:**")
        context = st.text_area(
            "Your reflection",
            height=100,
            placeholder="What are you exploring about your identity?",
            label_visibility="collapsed",
            key="sm_identity_context",
        )

        if st.button("Start Exercise", type="primary", disabled=not context.strip(), use_container_width=True, key="sm_identity_start"):
            # Track context for saving
            st.session_state.sm_mode_used = "identity"
            st.session_state.sm_context_used = context
            st.session_state.sm_module_used = module["name"]
            st.session_state.sm_exercise_used = exercise["name"]
            st.session_state.sm_last_reflection_id = None
            st.session_state.sm_audio = None

            system, user_content = build_identity_prompt(selected_module, exercise_idx, context)

            with st.spinner(f"Exploring {exercise['name']}..."):
                try:
                    result = _call_llm_safe(
                        provider="anthropic",
                        system=system,
                        user_content=user_content,
                        temperature=0.7,
                        model_override="claude-sonnet-4-20250514",
                    )
                    st.session_state.sm_result = result
                except Exception as e:
                    st.error(f"Exercise failed: {e}")

            st.rerun()

    # ════════════════════════════════════════════════════════════
    # MODE: Social Layer - "How Do I Exist With Others?"
    # ════════════════════════════════════════════════════════════
    elif st.session_state.sm_mode == "social":
        st.caption("Navigate relationships and social dynamics")

        # Module selection
        selected_module = st.selectbox(
            "Choose a social module:",
            options=list(SOCIAL_MODULES.keys()),
            format_func=lambda x: f"{SOCIAL_MODULES[x]['icon']} {SOCIAL_MODULES[x]['name']}",
            key="sm_social_module",
        )

        module = SOCIAL_MODULES[selected_module]
        st.markdown(f"*{module['description']}*")

        # Exercise selection
        st.markdown("**Choose an exercise:**")
        exercise_idx = st.radio(
            "Exercise",
            options=range(len(module["exercises"])),
            format_func=lambda x: module["exercises"][x]["name"],
            label_visibility="collapsed",
            horizontal=True,
            key="sm_social_exercise",
        )

        exercise = module["exercises"][exercise_idx]
        with st.expander(f"📋 {exercise['name']} — View full prompt", expanded=False):
            st.markdown(exercise["prompt"])

        # Context input
        st.markdown("**Your situation:**")
        context = st.text_area(
            "Your situation",
            height=100,
            placeholder="Describe the relationship or social situation you're navigating...",
            label_visibility="collapsed",
            key="sm_social_context",
        )

        if st.button("Start Exercise", type="primary", disabled=not context.strip(), use_container_width=True, key="sm_social_start"):
            # Track context for saving
            st.session_state.sm_mode_used = "social"
            st.session_state.sm_context_used = context
            st.session_state.sm_module_used = module["name"]
            st.session_state.sm_exercise_used = exercise["name"]
            st.session_state.sm_last_reflection_id = None
            st.session_state.sm_audio = None

            system, user_content = build_social_prompt(selected_module, exercise_idx, context)

            with st.spinner(f"Working through {exercise['name']}..."):
                try:
                    result = _call_llm_safe(
                        provider="anthropic",
                        system=system,
                        user_content=user_content,
                        temperature=0.7,
                        model_override="claude-sonnet-4-20250514",
                    )
                    st.session_state.sm_result = result
                except Exception as e:
                    st.error(f"Exercise failed: {e}")

            st.rerun()

    # ════════════════════════════════════════════════════════════
    # MODE: Embodiment Layer - "How Does the Body Participate?"
    # ════════════════════════════════════════════════════════════
    elif st.session_state.sm_mode == "body":
        st.caption("Connect mind and body for state management")

        # Module selection
        selected_module = st.selectbox(
            "Choose a body module:",
            options=list(EMBODIMENT_MODULES.keys()),
            format_func=lambda x: f"{EMBODIMENT_MODULES[x]['icon']} {EMBODIMENT_MODULES[x]['name']}",
            key="sm_body_module",
        )

        module = EMBODIMENT_MODULES[selected_module]
        st.markdown(f"*{module['description']}*")

        # Exercise selection
        st.markdown("**Choose a practice:**")
        exercise_idx = st.radio(
            "Practice",
            options=range(len(module["exercises"])),
            format_func=lambda x: module["exercises"][x]["name"],
            label_visibility="collapsed",
            horizontal=True,
            key="sm_body_exercise",
        )

        exercise = module["exercises"][exercise_idx]
        with st.expander(f"📋 {exercise['name']} — View full prompt", expanded=False):
            st.markdown(exercise["prompt"])

        # Context input
        st.markdown("**Your current state:**")
        context = st.text_area(
            "Your current state",
            height=100,
            placeholder="How are you feeling physically and emotionally right now?",
            label_visibility="collapsed",
            key="sm_body_context",
        )

        if st.button("Start Practice", type="primary", disabled=not context.strip(), use_container_width=True, key="sm_body_start"):
            # Track context for saving
            st.session_state.sm_mode_used = "body"
            st.session_state.sm_context_used = context
            st.session_state.sm_module_used = module["name"]
            st.session_state.sm_exercise_used = exercise["name"]
            st.session_state.sm_last_reflection_id = None
            st.session_state.sm_audio = None

            system, user_content = build_embodiment_prompt(selected_module, exercise_idx, context)

            with st.spinner(f"Guiding {exercise['name']}..."):
                try:
                    result = _call_llm_safe(
                        provider="anthropic",
                        system=system,
                        user_content=user_content,
                        temperature=0.7,
                        model_override="claude-sonnet-4-20250514",
                    )
                    st.session_state.sm_result = result
                except Exception as e:
                    st.error(f"Practice failed: {e}")

            st.rerun()

    # ════════════════════════════════════════════════════════════
    # MODE: Environment Layer - "What Surrounds Me Shapes Me"
    # ════════════════════════════════════════════════════════════
    elif st.session_state.sm_mode == "environment":
        st.caption("Design your surroundings for success")

        # Module selection
        selected_module = st.selectbox(
            "Choose an environment module:",
            options=list(ENVIRONMENT_MODULES.keys()),
            format_func=lambda x: f"{ENVIRONMENT_MODULES[x]['icon']} {ENVIRONMENT_MODULES[x]['name']}",
            key="sm_env_module",
        )

        module = ENVIRONMENT_MODULES[selected_module]
        st.markdown(f"*{module['description']}*")

        # Exercise selection
        st.markdown("**Choose an exercise:**")
        exercise_idx = st.radio(
            "Exercise",
            options=range(len(module["exercises"])),
            format_func=lambda x: module["exercises"][x]["name"],
            label_visibility="collapsed",
            horizontal=True,
            key="sm_env_exercise",
        )

        exercise = module["exercises"][exercise_idx]
        with st.expander(f"📋 {exercise['name']} — View full prompt", expanded=False):
            st.markdown(exercise["prompt"])

        # Context input
        st.markdown("**Your situation:**")
        context = st.text_area(
            "Your situation",
            height=100,
            placeholder="Describe your current environment or what you want to change...",
            label_visibility="collapsed",
            key="sm_env_context",
        )

        if st.button("Start Exercise", type="primary", disabled=not context.strip(), use_container_width=True, key="sm_env_start"):
            # Track context for saving
            st.session_state.sm_mode_used = "environment"
            st.session_state.sm_context_used = context
            st.session_state.sm_module_used = module["name"]
            st.session_state.sm_exercise_used = exercise["name"]
            st.session_state.sm_last_reflection_id = None
            st.session_state.sm_audio = None

            system, user_content = build_environment_prompt(selected_module, exercise_idx, context)

            with st.spinner(f"Analyzing {exercise['name']}..."):
                try:
                    result = _call_llm_safe(
                        provider="anthropic",
                        system=system,
                        user_content=user_content,
                        temperature=0.7,
                        model_override="claude-sonnet-4-20250514",
                    )
                    st.session_state.sm_result = result
                except Exception as e:
                    st.error(f"Exercise failed: {e}")

            st.rerun()

    # ════════════════════════════════════════════════════════════
    # MODE: Meaning Layer - "What Is Larger Than Me?"
    # ════════════════════════════════════════════════════════════
    elif st.session_state.sm_mode == "meaning":
        st.caption("Connect with purpose, legacy, and transcendence")

        # Module selection
        selected_module = st.selectbox(
            "Choose a meaning module:",
            options=list(MEANING_MODULES.keys()),
            format_func=lambda x: f"{MEANING_MODULES[x]['icon']} {MEANING_MODULES[x]['name']}",
            key="sm_meaning_module",
        )

        module = MEANING_MODULES[selected_module]
        st.markdown(f"*{module['description']}*")

        # Exercise selection
        st.markdown("**Choose an exercise:**")
        exercise_idx = st.radio(
            "Exercise",
            options=range(len(module["exercises"])),
            format_func=lambda x: module["exercises"][x]["name"],
            label_visibility="collapsed",
            horizontal=True,
            key="sm_meaning_exercise",
        )

        exercise = module["exercises"][exercise_idx]
        with st.expander(f"📋 {exercise['name']} — View full prompt", expanded=False):
            st.markdown(exercise["prompt"])

        # Context input
        st.markdown("**Your reflection:**")
        context = st.text_area(
            "Your reflection",
            height=100,
            placeholder="What are you contemplating about meaning, purpose, or legacy?",
            label_visibility="collapsed",
            key="sm_meaning_context",
        )

        if st.button("Start Exercise", type="primary", disabled=not context.strip(), use_container_width=True, key="sm_meaning_start"):
            st.session_state.sm_mode_used = "meaning"
            st.session_state.sm_context_used = context
            st.session_state.sm_module_used = selected_module["name"]
            st.session_state.sm_exercise_used = exercise["name"]
            st.session_state.sm_last_reflection_id = None
            st.session_state.sm_audio = None

            system, user_content = build_meaning_prompt(selected_module, exercise_idx, context)

            with st.spinner(f"Exploring {exercise['name']}..."):
                try:
                    result = _call_llm_safe(
                        provider="anthropic",
                        system=system,
                        user_content=user_content,
                        temperature=0.7,
                        model_override="claude-sonnet-4-20250514",
                    )
                    st.session_state.sm_result = result
                except Exception as e:
                    st.error(f"Exercise failed: {e}")

            st.rerun()

# ════════════════════════════════════════════════════════════
# VIEW: Reflections History
# ════════════════════════════════════════════════════════════
elif st.session_state.view == "reflections":
    st.markdown('<h1 class="hero-title">My Reflections</h1>', unsafe_allow_html=True)
    st.markdown('<p class="hero-subtitle">Your journey of self-discovery</p>', unsafe_allow_html=True)

    # Stats overview
    stats = get_reflection_stats(user["id"])

    # Streak and stats cards
    stat_cols = st.columns(4)
    with stat_cols[0]:
        st.metric("🔥 Current Streak", f"{stats['current_streak']} days")
    with stat_cols[1]:
        st.metric("🏆 Longest Streak", f"{stats['longest_streak']} days")
    with stat_cols[2]:
        st.metric("📝 Total Reflections", stats["total_reflections"])
    with stat_cols[3]:
        st.metric("📅 This Week", stats["this_week"])

    st.markdown("---")

    # Mode breakdown
    if stats["by_mode"]:
        st.subheader("Reflections by Mode")
        mode_cols = st.columns(min(len(stats["by_mode"]), 8))
        mode_icons = {
            "lens": "🔍", "practice": "🥋", "ritual": "🌅",
            "identity": "🪞", "social": "🤝", "body": "🏃",
            "environment": "🏠", "meaning": "✨"
        }
        for i, (mode, count) in enumerate(stats["by_mode"].items()):
            with mode_cols[i % len(mode_cols)]:
                icon = mode_icons.get(mode, "📝")
                st.markdown(
                    f'<div style="text-align:center;padding:12px;background:#1a1a2e;border-radius:8px;">'
                    f'<div style="font-size:1.5em;">{icon}</div>'
                    f'<div style="font-weight:600;">{count}</div>'
                    f'<div style="color:#888;font-size:0.8em;text-transform:capitalize;">{mode}</div>'
                    f'</div>',
                    unsafe_allow_html=True,
                )
        st.markdown("")

    # Filter by mode
    st.subheader("Reflection History")
    filter_options = ["All Modes"] + list(stats["by_mode"].keys()) if stats["by_mode"] else ["All Modes"]
    filter_mode = st.selectbox(
        "Filter by mode",
        options=filter_options,
        key="reflection_filter",
    )

    mode_filter = None if filter_mode == "All Modes" else filter_mode
    reflections = get_user_reflections(user["id"], limit=50, mode=mode_filter)

    if not reflections:
        st.info("No reflections yet. Start your journey with Sovereign Mind!")
        if st.button("🧠 Go to Sovereign Mind", type="primary"):
            st.session_state.view = "reflect"
            st.rerun()
    else:
        mode_icons_local = {
            "lens": "🔍", "practice": "🥋", "ritual": "🌅",
            "identity": "🪞", "social": "🤝", "body": "🏃",
            "environment": "🏠", "meaning": "✨"
        }
        for ref in reflections:
            mode_icon = mode_icons_local.get(ref["mode"], "📝")
            created = datetime.fromisoformat(ref["created_at"]).strftime("%b %d, %Y • %I:%M %p")

            with st.expander(f"{mode_icon} {ref['mode'].title()} — {created}", expanded=False):
                # Show module/exercise if available
                if ref.get("module"):
                    st.caption(f"📚 {ref['module']}" + (f" → {ref['exercise']}" if ref.get("exercise") else ""))

                # Context
                st.markdown("**Your context:**")
                st.markdown(f"> {ref['context']}")

                st.markdown("---")

                # Result
                st.markdown("**Reflection:**")
                st.markdown(ref["result"])

                # Audio playback if available
                audio_data = get_reflection_audio(ref["id"], user["id"])
                if audio_data:
                    st.markdown("---")
                    st.audio(audio_data, format="audio/mp3")

                # Delete button
                st.markdown("")
                if st.button("🗑️ Delete", key=f"del_ref_{ref['id']}", type="secondary"):
                    delete_reflection(ref["id"], user["id"])
                    st.success("Reflection deleted")
                    st.rerun()
