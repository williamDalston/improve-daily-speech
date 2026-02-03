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
    "Critique 1", "Enhancement 1",
    "Critique 2", "Enhancement 2",
    "Critique 3", "Enhancement 3",
    "Critique 4", "Final Polish",
]


# ── Helper: render pipeline output ─────────────────────────
def _render_pipeline_output(steps, final_text, topic, key_prefix="main"):
    """Show completed pipeline stages as expandable sections."""
    if not steps:
        return

    # Group: show final speech prominently first, then details below
    if final_text:
        st.markdown("---")
        col_wc, col_txt, col_doc = st.columns([1, 1, 1])
        with col_wc:
            st.metric("Words", f"{len(final_text.split()):,}")
        with col_txt:
            st.download_button(
                "Download .txt", data=final_text,
                file_name="transcript.txt", mime="text/plain",
                key=f"{key_prefix}_dl_txt", use_container_width=True,
            )
        with col_doc:
            docx_bytes = export_docx(final_text, topic or "Episode")
            st.download_button(
                "Download .docx", data=docx_bytes,
                file_name="transcript.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                key=f"{key_prefix}_dl_docx", use_container_width=True,
            )

    # Pipeline details — collapsed by default
    with st.expander("View pipeline details", expanded=False):
        for idx, (step_name, step_type, data) in enumerate(steps):
            if data.get("status") != "done" and step_type != "done":
                continue

            if step_type == "research":
                st.markdown(f"**{step_name}**")
                st.markdown(data["text"])
                st.markdown("---")

            elif step_type == "drafts":
                st.markdown(f"**{step_name}**")
                drafts = data["drafts"]
                tabs = st.tabs([d["label"] for d in drafts])
                for tab, draft in zip(tabs, drafts):
                    with tab:
                        st.markdown(draft["text"])
                        st.caption(f"{len(draft['text'].split())} words")
                st.markdown("---")

            elif step_type == "judge":
                st.markdown(f"**{step_name}**")
                st.success(f"Winner: **{data.get('winner_label', 'N/A')}**")
                st.markdown(data.get("judgment", ""))
                st.markdown("---")

            elif step_type == "critique":
                st.markdown(f"**{step_name}**")
                st.markdown(data["text"])
                st.markdown("---")

            elif step_type == "enhancement":
                stage_idx = data.get("stage_index", 0)
                is_final = (stage_idx == 3)
                label = "**Final Speech**" if is_final else f"**{step_name}**"
                st.markdown(label)
                st.markdown(data["text"])
                st.caption(f"{len(data['text'].split())} words")
                if not is_final:
                    st.markdown("---")


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
    """Audio generation and playback."""
    existing_audio = get_audio(speech_id, user_id)

    if existing_audio:
        _render_audio_player(existing_audio, key_prefix)

        col_dl, col_regen = st.columns(2)
        with col_dl:
            st.download_button(
                "Download MP3", data=existing_audio,
                file_name="speech.mp3", mime="audio/mpeg",
                key=f"{key_prefix}_dl_mp3", use_container_width=True,
            )
        with col_regen:
            if st.button("Regenerate Audio", key=f"{key_prefix}_regen_audio", use_container_width=True):
                st.session_state[f"{key_prefix}_gen_audio"] = True
                st.rerun()

    if not existing_audio or st.session_state.get(f"{key_prefix}_gen_audio"):
        col_voice, col_speed = st.columns(2)
        with col_voice:
            voice_name = st.selectbox(
                "Voice", options=list(VOICES.keys()), index=0,
                key=f"{key_prefix}_voice",
            )
        with col_speed:
            gen_speed = st.slider(
                "Speed", min_value=0.75, max_value=1.5, value=1.0, step=0.05,
                key=f"{key_prefix}_gen_speed",
                help="Baked-in pace. Use the player slider for real-time changes.",
            )

        voice_id = VOICES[voice_name]

        if st.button(
            "Generate Audio" if not existing_audio else "Regenerate with New Settings",
            type="primary", key=f"{key_prefix}_gen_btn", use_container_width=True,
        ):
            with st.spinner(f"Generating audio with '{voice_name.split(' (')[0]}' voice..."):
                try:
                    audio_bytes = generate_audio(final_text, voice=voice_id, speed=gen_speed)
                    save_audio(speech_id, user_id, audio_bytes, voice_id)
                    st.session_state.pop(f"{key_prefix}_gen_audio", None)
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
    """Render subscription paywall."""
    st.markdown("")
    st.markdown(f"""
    <div class="paywall-card">
        <h2>You've used your {FREE_EPISODE_LIMIT} free episodes</h2>
        <p style="font-size: 1.1rem; max-width: 400px; margin: 0 auto 1rem auto;">
            Subscribe to unlock unlimited documentary-style audio on any topic you want to master.
        </p>
        <div class="paywall-price">$19.99<span>/month</span></div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 280px; margin: 1.5rem auto 0 auto; text-align: left;">
            <div class="feature-item">
                <span>&#10003;</span> Unlimited episodes
            </div>
            <div class="feature-item">
                <span>&#10003;</span> AI research & expert perspectives
            </div>
            <div class="feature-item">
                <span>&#10003;</span> Professional documentary audio
            </div>
            <div class="feature-item">
                <span>&#10003;</span> Download transcripts & audio
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("")
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        if st.button("Subscribe Now", type="primary", use_container_width=True):
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

# ── Sidebar (minimal) ──────────────────────────────────────
with st.sidebar:
    render_user_menu()
    st.markdown("---")

    if st.button("New Episode", use_container_width=True, type="primary"):
        st.session_state.view = "create"
        st.session_state.viewing_speech = None
        st.rerun()
    if st.button("My Episodes", use_container_width=True):
        st.session_state.view = "library"
        st.rerun()

    # Subscription status
    st.markdown("---")
    if is_free_user(user["email"]):
        st.caption("Unlimited Access")
    else:
        sub = get_user_subscription(user["id"])
        if sub["status"] == "active":
            st.caption("Subscribed")
            if sub["customer_id"]:
                base_url = st.context.headers.get("Origin", "http://localhost:8501")
                portal_url = get_customer_portal_url(sub["customer_id"], base_url)
                st.link_button("Manage Subscription", portal_url, use_container_width=True)
        else:
            # Show free episodes remaining
            remaining = get_free_episodes_remaining(user["id"])
            if remaining > 0:
                st.caption(f"Free: {remaining}/{FREE_EPISODE_LIMIT} episodes left")
            else:
                st.caption("Free trial used")

    # Pipeline progress (only during create view)
    if st.session_state.view == "create" and st.session_state.steps:
        st.markdown("---")
        st.caption("PIPELINE PROGRESS")
        completed = len([s for s in st.session_state.steps
                        if s[2].get("status") == "done"])
        st.progress(min(completed / 11, 1.0))
        for step_name, step_type, data in st.session_state.steps:
            if data.get("status") == "done":
                st.markdown(f'<span class="step-done">✓ {step_name}</span>',
                           unsafe_allow_html=True)


# ════════════════════════════════════════════════════════════
# VIEW: Create
# ════════════════════════════════════════════════════════════
if st.session_state.view == "create":
    st.markdown('<h1 class="hero-title">Explore a Topic</h1>', unsafe_allow_html=True)
    st.markdown('<p class="hero-subtitle">Transform any topic into an engaging documentary that makes knowledge stick</p>', unsafe_allow_html=True)

    # Check subscription before showing form
    can_generate = user_can_generate()

    if not can_generate:
        render_paywall()
        st.stop()

    st.markdown("**What do you want to learn about?**")
    topic = st.text_area(
        "Topic",
        height=100,
        placeholder="Enter your topic... e.g., 'The future of renewable energy and why it matters for the next generation'",
        label_visibility="collapsed",
    )

    # Episode length selector with better layout
    col_length, col_info = st.columns([1, 2])
    with col_length:
        length = st.selectbox(
            "Duration",
            options=EPISODE_LENGTHS,
            index=1,
            help="Approximate speaking time at normal pace",
        )
    with col_info:
        length_words = {"5 min": "~750", "10 min": "~1,500", "15 min": "~2,250", "20 min": "~3,000"}
        st.caption(f"")
        st.markdown(f"<p style='color: #64748b; font-size: 0.9rem; margin-top: 1.7rem;'>{length_words.get(length, '')} words</p>", unsafe_allow_html=True)

    st.markdown("")
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

        # Enhanced progress display
        st.markdown("---")
        st.markdown("### Crafting your episode...")

        progress_bar = st.progress(0)
        status_container = st.empty()

        total_steps = 11
        step_count = 0

        stage_messages = {
            "research": "Researching your topic deeply...",
            "drafts": "Creating multiple perspectives...",
            "judge": "Selecting the best approach...",
            "critique": "Analyzing and refining...",
            "enhancement": "Polishing the content...",
            "done": "Finalizing your episode...",
        }

        try:
            for step_name, step_type, data in run_full_pipeline(st.session_state.topic, length):
                if data.get("status") == "done" or step_type == "done":
                    step_count += 1
                    st.session_state.steps.append((step_name, step_type, data))
                    progress_bar.progress(min(step_count / total_steps, 1.0))
                else:
                    msg = stage_messages.get(step_type, step_name)
                    status_container.markdown(f"""
                    <div class="loading-card">
                        <p style="font-size: 1.1rem; font-weight: 500; color: #475569; margin: 0;">{msg}</p>
                        <p style="font-size: 0.875rem; color: #94a3b8; margin: 0.5rem 0 0 0;">{step_name}</p>
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

        st.rerun()

    # Show error if any
    if st.session_state.error:
        st.error(st.session_state.error)
        st.session_state.error = None

    # Show results with enhanced success message
    if st.session_state.final_text:
        word_count = len(st.session_state.final_text.split())
        st.markdown(f"""
        <div class="success-banner">
            Your episode is ready! {word_count:,} words crafted for you.
        </div>
        """, unsafe_allow_html=True)

    _render_pipeline_output(
        st.session_state.steps, st.session_state.final_text,
        st.session_state.topic, key_prefix="create",
    )

    # Audio
    if st.session_state.final_text and st.session_state.last_speech_id:
        st.markdown("---")
        st.markdown("### Listen")
        _render_audio_section(
            speech_id=st.session_state.last_speech_id,
            user_id=user["id"],
            final_text=st.session_state.final_text,
            key_prefix="create_audio",
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
            # Header with back button
            if st.button("← Back to Library", type="secondary"):
                st.session_state.viewing_speech = None
                st.rerun()

            st.markdown(f'<h1 class="hero-title" style="font-size: 1.8rem;">{speech["topic"]}</h1>', unsafe_allow_html=True)
            st.markdown(f'<p class="hero-subtitle" style="font-size: 0.95rem;">{speech["created_at"][:10]}  ·  {speech["word_count"]:,} words</p>', unsafe_allow_html=True)

            # Audio first
            st.markdown("### Listen")
            _render_audio_section(
                speech_id=speech["id"],
                user_id=user["id"],
                final_text=speech["final_text"],
                key_prefix=f"lib_audio_{speech['id']}",
            )

            # Pipeline output
            stages = speech.get("stages", [])
            if stages:
                steps = [(s["name"], s["type"], s["data"]) for s in stages]
                _render_pipeline_output(
                    steps, speech["final_text"], speech["topic"],
                    key_prefix=f"lib_{speech['id']}",
                )
            else:
                st.markdown("---")
                st.markdown(speech["final_text"])

            # Actions
            st.markdown("---")
            col1, col2, col3 = st.columns(3)
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
            with col3:
                if st.button("Delete Episode", key="lib_del", use_container_width=True):
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
                <p style="font-size: 1.2rem; color: #64748b; margin-bottom: 1rem;">No episodes yet</p>
                <p style="color: #94a3b8;">Create your first episode to get started!</p>
            </div>
            """, unsafe_allow_html=True)
            st.markdown("")
            if st.button("Create Your First Episode", type="primary", use_container_width=True):
                st.session_state.view = "create"
                st.rerun()
        else:
            st.markdown(f'<p class="hero-subtitle">{len(speeches)} episode{"s" if len(speeches) != 1 else ""} created</p>', unsafe_allow_html=True)

            for speech in speeches:
                st.markdown(
                    f'<div class="episode-card">'
                    f'<h4>{speech["topic"]}</h4>'
                    f'<span class="meta">{speech["created_at"][:10]}  ·  '
                    f'{speech["word_count"]:,} words</span></div>',
                    unsafe_allow_html=True,
                )
                col_open, col_del = st.columns([5, 1])
                with col_open:
                    if st.button("Open", key=f"open_{speech['id']}", use_container_width=True):
                        st.session_state.viewing_speech = speech["id"]
                        st.rerun()
                with col_del:
                    if st.button("🗑️", key=f"del_{speech['id']}"):
                        delete_speech(speech["id"], user["id"])
                        st.rerun()
