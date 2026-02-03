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
    /* Base styling */
    .block-container { padding-top: 1.5rem; max-width: 920px; }

    /* Animated gradient background for hero elements */
    @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
    }

    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }

    /* Hero header */
    .hero-title {
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: gradientShift 4s ease infinite;
        margin-bottom: 0.25rem;
    }

    .hero-subtitle {
        color: #64748b;
        font-size: 1.1rem;
        margin-bottom: 1.5rem;
    }

    /* Episode cards with hover effects */
    .episode-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: fadeInUp 0.5s ease-out;
    }
    .episode-card:hover {
        border-color: #818cf8;
        box-shadow: 0 10px 40px -10px rgba(99, 102, 241, 0.2);
        transform: translateY(-2px);
    }
    .episode-card h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1e293b;
    }
    .episode-card .meta {
        color: #64748b;
        font-size: 0.875rem;
    }

    /* Progress indicator styling */
    .step-done {
        color: #10b981;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .step-active {
        color: #6366f1;
        font-weight: 500;
        animation: pulse 1.5s ease-in-out infinite;
    }

    /* Audio player */
    .audio-container {
        background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
        border-radius: 16px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.15);
    }

    /* Hide Streamlit defaults */
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }

    /* Enhanced text area */
    .stTextArea textarea {
        border-radius: 12px;
        font-size: 1rem;
        border: 2px solid #e2e8f0;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    .stTextArea textarea:focus {
        border-color: #818cf8;
        box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.1);
    }

    /* Metric cards */
    [data-testid="stMetric"] {
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
        border: 1px solid #e2e8f0;
    }

    /* Success message styling */
    .success-banner {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-weight: 500;
        animation: fadeInUp 0.5s ease-out;
        margin: 1rem 0;
    }

    /* Loading animation */
    .loading-card {
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
    }

    /* Pipeline step cards */
    .pipeline-step {
        background: #f8fafc;
        border-left: 4px solid #818cf8;
        padding: 1rem 1.25rem;
        margin: 0.75rem 0;
        border-radius: 0 12px 12px 0;
        animation: fadeInUp 0.4s ease-out;
    }

    /* Buttons enhancement */
    .stButton > button[kind="primary"] {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border: none;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    .stButton > button[kind="primary"]:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    }

    /* Paywall styling */
    .paywall-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        background-size: 200% 200%;
        animation: gradientShift 6s ease infinite;
        border-radius: 20px;
        padding: 3rem 2rem;
        text-align: center;
        color: white;
        box-shadow: 0 20px 60px -10px rgba(102, 126, 234, 0.5);
    }
    .paywall-card h2 {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
    }
    .paywall-card p { opacity: 0.95; }
    .paywall-price {
        font-size: 3rem;
        font-weight: 800;
        margin: 1.5rem 0;
    }
    .paywall-price span {
        font-size: 1.25rem;
        font-weight: 400;
        opacity: 0.8;
    }

    /* Feature list */
    .feature-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0;
        color: rgba(255,255,255,0.95);
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
    "Critique 2", "Final Polish",
]




# ── Helper: audio player ───────────────────────────────────
def _render_audio_player(audio_bytes: bytes, key_prefix: str):
    """Custom HTML5 audio player with speed control."""
    b64 = base64.b64encode(audio_bytes).decode()
    pid = f"p_{key_prefix}"
    sid = f"s_{key_prefix}"
    lid = f"l_{key_prefix}"

    html = f"""
    <div class="audio-container">
        <audio id="{pid}" style="width:100%;margin-bottom:10px;"
               controls controlslist="nodownload">
            <source src="data:audio/mp3;base64,{b64}" type="audio/mp3">
        </audio>
        <div style="display:flex;align-items:center;gap:10px;">
            <span style="color:#cdd6f4;font-size:13px;">Speed</span>
            <input type="range" id="{sid}" min="0.5" max="2.0" step="0.05" value="1.0"
                   style="flex:1;accent-color:#89b4fa;cursor:pointer;"
                   oninput="
                       document.getElementById('{pid}').playbackRate=this.value;
                       document.getElementById('{lid}').textContent=this.value+'x';
                   ">
            <span id="{lid}" style="color:#89b4fa;font-weight:bold;font-size:13px;min-width:35px;">1.0x</span>
        </div>
    </div>
    """
    st.components.v1.html(html, height=140)


def _render_audio_section(speech_id: int, user_id: int, final_text: str, key_prefix: str):
    """Audio generation and playback - simple and focused."""
    existing_audio = get_audio(speech_id, user_id)

    if existing_audio:
        _render_audio_player(existing_audio, key_prefix)

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
        <h2>Keep learning</h2>
        <p style="font-size: 1.1rem; max-width: 400px; margin: 0 auto 1rem auto;">
            Unlock unlimited episodes on any topic that fascinates you.
        </p>
        <div class="paywall-price">$19.99<span>/month</span></div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("")
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if st.button("Continue", type="primary", use_container_width=True):
            base_url = st.context.headers.get("Origin", "http://localhost:8501")
            checkout_url = create_checkout_session(user["email"], user["id"], base_url)
            st.markdown(f'<meta http-equiv="refresh" content="0;url={checkout_url}">', unsafe_allow_html=True)


# ── Session state ───────────────────────────────────────────
defaults = {
    "topic": "",
    "length": "10 min",
    "running": False,
    "error": None,
    "steps": [],
    "final_text": None,
    "last_speech_id": None,
    "view": "create",
    "viewing_speech": None,
}
for key, val in defaults.items():
    if key not in st.session_state:
        st.session_state[key] = val

# ── Sidebar (clean & minimal) ──────────────────────────────
with st.sidebar:
    render_user_menu()
    st.markdown("---")

    if st.button("New Episode", use_container_width=True, type="primary"):
        st.session_state.view = "create"
        st.session_state.viewing_speech = None
        st.session_state.steps = []
        st.session_state.final_text = None
        st.rerun()
    if st.button("My Episodes", use_container_width=True):
        st.session_state.view = "library"
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

    # Clean, focused hero
    st.markdown('<h1 class="hero-title">What do you want to learn?</h1>', unsafe_allow_html=True)

    topic = st.text_area(
        "Topic",
        height=80,
        placeholder="e.g., How does memory work and how can I improve mine?",
        label_visibility="collapsed",
    )

    # Simple duration selector inline
    length = st.select_slider(
        "Episode length",
        options=EPISODE_LENGTHS,
        value="10 min",
        label_visibility="collapsed",
    )
    st.caption(f"{length} episode")

    generate = st.button(
        "Create Episode",
        type="primary",
        disabled=(not topic.strip() or st.session_state.running),
        use_container_width=True,
    )

    if generate and topic.strip():
        st.session_state.topic = topic.strip()
        st.session_state.length = length
        st.session_state.steps = []
        st.session_state.final_text = None
        st.session_state.last_speech_id = None
        st.session_state.running = True
        st.session_state.error = None

        # Clean progress display
        st.markdown("---")
        progress_bar = st.progress(0)
        status_container = st.empty()

        total_steps = 8  # 7 pipeline steps + audio generation
        step_count = 0

        stage_messages = {
            "research": "Gathering knowledge...",
            "drafts": "Exploring perspectives...",
            "judge": "Finding the best angle...",
            "critique": "Refining ideas...",
            "enhancement": "Polishing...",
            "done": "Creating audio...",
        }

        try:
            for step_name, step_type, data in run_full_pipeline(st.session_state.topic, length):
                if data.get("status") == "done" or step_type == "done":
                    step_count += 1
                    st.session_state.steps.append((step_name, step_type, data))
                    progress_bar.progress(min(step_count / total_steps, 1.0))
                else:
                    msg = stage_messages.get(step_type, "Working...")
                    status_container.markdown(f"""
                    <div style="text-align: center; padding: 1rem; color: #64748b;">
                        {msg}
                    </div>
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

            # Generate audio immediately so it's ready when page refreshes
            status_container.markdown("""
            <div style="text-align: center; padding: 1rem; color: #64748b;">
                Creating audio...
            </div>
            """, unsafe_allow_html=True)
            try:
                audio_bytes = generate_audio(st.session_state.final_text, voice="onyx", speed=1.0)
                save_audio(speech_id, user["id"], audio_bytes, "onyx")
                progress_bar.progress(1.0)
            except Exception:
                pass  # Audio will be generated on demand if this fails

        st.rerun()

    # Show error if any
    if st.session_state.error:
        st.error(st.session_state.error)
        st.session_state.error = None

    # Show results - clean and focused on listening
    if st.session_state.final_text and st.session_state.last_speech_id:
        st.markdown("---")
        st.markdown(f"### {st.session_state.topic}")

        # Audio first - already generated during pipeline
        _render_audio_section(
            speech_id=st.session_state.last_speech_id,
            user_id=user["id"],
            final_text=st.session_state.final_text,
            key_prefix="create_audio",
        )

        # Transcript and details in expanders
        with st.expander("Read transcript"):
            st.markdown(st.session_state.final_text)
            col1, col2 = st.columns(2)
            with col1:
                st.download_button(
                    "Download .txt", data=st.session_state.final_text,
                    file_name="transcript.txt", mime="text/plain",
                    key="create_dl_txt", use_container_width=True,
                )
            with col2:
                docx_bytes = export_docx(st.session_state.final_text, st.session_state.topic or "Episode")
                st.download_button(
                    "Download .docx", data=docx_bytes,
                    file_name="transcript.docx",
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    key="create_dl_docx", use_container_width=True,
                )


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
            # Clean header with back
            col_back, col_title = st.columns([1, 5])
            with col_back:
                if st.button("←", key="back_btn"):
                    st.session_state.viewing_speech = None
                    st.rerun()

            st.markdown(f'<h1 class="hero-title" style="font-size: 1.6rem;">{speech["topic"]}</h1>', unsafe_allow_html=True)

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

            # Delete at bottom, subtle
            st.markdown("")
            if st.button("Delete episode", key="lib_del", type="secondary"):
                delete_speech(speech["id"], user["id"])
                st.session_state.viewing_speech = None
                st.toast("Episode deleted.")
                st.rerun()

    else:
        st.markdown('<h1 class="hero-title">Your Episodes</h1>', unsafe_allow_html=True)
        speeches = get_user_speeches(user["id"])

        if not speeches:
            st.markdown("")
            st.markdown("""
            <div style="text-align: center; padding: 3rem; background: #f8fafc; border-radius: 16px; border: 2px dashed #e2e8f0;">
                <p style="font-size: 1.2rem; color: #64748b; margin-bottom: 0.5rem;">No episodes yet</p>
                <p style="color: #94a3b8;">Pick a topic you're curious about</p>
            </div>
            """, unsafe_allow_html=True)
            st.markdown("")
            if st.button("Create Your First Episode", type="primary", use_container_width=True):
                st.session_state.view = "create"
                st.rerun()
        else:
            for speech in speeches:
                st.markdown(
                    f'<div class="episode-card" style="cursor: pointer;">'
                    f'<h4>{speech["topic"]}</h4>'
                    f'<span class="meta">{speech["created_at"][:10]}</span></div>',
                    unsafe_allow_html=True,
                )
                if st.button("Listen", key=f"open_{speech['id']}", use_container_width=True):
                    st.session_state.viewing_speech = speech["id"]
                    st.rerun()
