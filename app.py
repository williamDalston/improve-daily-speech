"""
Streamlit UI for the Speech Writer Pipeline.
Run with: streamlit run app.py
"""

import base64

import streamlit as st
from auth import render_login_page, render_user_menu
from database import (
    save_speech, get_user_speeches, get_speech, delete_speech,
    save_audio, get_audio,
)
from pipeline import run_full_pipeline
from exporter import export_docx, generate_audio

st.set_page_config(
    page_title="Speech Writer",
    page_icon="🎙️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Custom CSS ──────────────────────────────────────────────
st.markdown("""
<style>
    /* Clean up default Streamlit padding */
    .block-container { padding-top: 2rem; max-width: 900px; }

    /* Subtle section cards */
    .speech-card {
        background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 1.25rem 1.5rem;
        margin-bottom: 0.75rem;
        transition: border-color 0.2s;
    }
    .speech-card:hover { border-color: #adb5bd; }
    .speech-card h4 { margin: 0 0 0.25rem 0; font-size: 1.05rem; }
    .speech-card .meta { color: #6c757d; font-size: 0.85rem; }

    /* Progress steps in sidebar */
    .step-done { color: #198754; font-weight: 600; }
    .step-active { color: #0d6efd; font-style: italic; }

    /* Audio player */
    .audio-container {
        background: #1a1a2e;
        border-radius: 12px;
        padding: 1.25rem;
        margin: 0.75rem 0;
    }

    /* Hide default hamburger menu & footer */
    #MainMenu { visibility: hidden; }
    footer { visibility: hidden; }

    /* Nicer text area */
    .stTextArea textarea {
        border-radius: 10px;
        font-size: 1rem;
    }

    /* Metric styling */
    [data-testid="stMetric"] {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 0.75rem;
        text-align: center;
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

# Speech length options
SPEECH_LENGTHS = ["5 min", "10 min", "15 min", "20 min"]

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
                file_name="speech.txt", mime="text/plain",
                key=f"{key_prefix}_dl_txt", use_container_width=True,
            )
        with col_doc:
            docx_bytes = export_docx(final_text, topic or "Speech")
            st.download_button(
                "Download .docx", data=docx_bytes,
                file_name="speech.docx",
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

    if st.button("New Speech", use_container_width=True, type="primary"):
        st.session_state.view = "create"
        st.session_state.viewing_speech = None
        st.rerun()
    if st.button("My Library", use_container_width=True):
        st.session_state.view = "library"
        st.rerun()

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
    st.markdown("## Create a Speech")
    st.caption("AI-powered speech generation with research, multiple drafts, and iterative refinement")

    topic = st.text_area(
        "Topic",
        height=80,
        placeholder="e.g. The neuroscience of creativity and how it shapes human potential",
        label_visibility="collapsed",
    )

    # Speech length selector
    col_length, col_spacer = st.columns([1, 2])
    with col_length:
        length = st.selectbox(
            "Speech Length",
            options=SPEECH_LENGTHS,
            index=1,  # Default to 10 min
            help="Approximate speaking time at normal pace",
        )

    generate = st.button(
        "Generate Speech",
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

        progress_bar = st.progress(0, text="Starting...")
        status_text = st.empty()

        total_steps = 11
        step_count = 0

        try:
            for step_name, step_type, data in run_full_pipeline(st.session_state.topic, length):
                if data.get("status") == "done" or step_type == "done":
                    step_count += 1
                    st.session_state.steps.append((step_name, step_type, data))
                    progress_bar.progress(
                        min(step_count / total_steps, 1.0),
                        text=step_name,
                    )
                else:
                    status_text.text(f"{step_name}...")

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

    # Show results
    if st.session_state.final_text:
        st.success("Speech generated and saved!")

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
            st.error("Speech not found.")
            st.session_state.viewing_speech = None
        else:
            # Header row
            col_back, col_title = st.columns([1, 5])
            with col_back:
                if st.button("← Back"):
                    st.session_state.viewing_speech = None
                    st.rerun()
            with col_title:
                st.markdown(f"## {speech['topic']}")

            st.caption(f"{speech['created_at'][:10]}  ·  {speech['word_count']:,} words")

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
                    file_name="speech.txt", mime="text/plain",
                    key="lib_dl_txt", use_container_width=True,
                )
            with col2:
                docx_bytes = export_docx(speech["final_text"], speech["topic"])
                st.download_button(
                    "Download .docx", data=docx_bytes,
                    file_name="speech.docx",
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    key="lib_dl_docx", use_container_width=True,
                )
            with col3:
                if st.button("Delete Speech", key="lib_del", use_container_width=True):
                    delete_speech(speech["id"], user["id"])
                    st.session_state.viewing_speech = None
                    st.toast("Speech deleted.")
                    st.rerun()

    else:
        st.markdown("## My Library")
        speeches = get_user_speeches(user["id"])

        if not speeches:
            st.markdown("No speeches yet.")
            if st.button("Create your first speech", type="primary"):
                st.session_state.view = "create"
                st.rerun()
        else:
            st.caption(f"{len(speeches)} speech{'es' if len(speeches) != 1 else ''}")

            for speech in speeches:
                st.markdown(
                    f'<div class="speech-card">'
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
