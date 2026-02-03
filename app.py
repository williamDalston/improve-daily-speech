"""
Streamlit UI for the Speech Writer Pipeline.
Run with: streamlit run app.py
"""

import streamlit as st
from auth import render_login_page, render_user_menu
from database import (
    save_speech, get_user_speeches, get_speech, delete_speech,
    save_audio, get_audio,
)
from pipeline import run_full_pipeline
from exporter import export_docx, generate_audio

st.set_page_config(page_title="Speech Writer Pipeline", layout="wide")

# Available TTS voices
VOICES = {
    "Onyx": "onyx",       # deep, authoritative
    "Nova": "nova",        # warm, female
    "Alloy": "alloy",      # neutral, balanced
    "Echo": "echo",        # male, clear
    "Fable": "fable",      # expressive, British
    "Shimmer": "shimmer",  # soft, female
    "Ash": "ash",          # conversational male
    "Coral": "coral",      # warm female
    "Sage": "sage",        # calm, measured
    "Ballad": "ballad",    # storyteller
}


# ============================================================
# Shared: Render pipeline steps (defined first so it's callable)
# ============================================================
def _render_steps(steps, final_text, topic, key_prefix="main"):
    """Render pipeline step outputs."""
    if not steps:
        if not st.session_state.get("running"):
            st.info("Enter a topic above and click 'Generate Speech' to start.")
        return

    for idx, (step_name, step_type, data) in enumerate(steps):
        if data.get("status") != "done" and step_type != "done":
            continue

        if step_type == "research":
            with st.expander(f"📚 {step_name}", expanded=False):
                st.markdown(data["text"])

        elif step_type == "drafts":
            with st.expander(f"✍️ {step_name} (3 parallel drafts)", expanded=False):
                drafts = data["drafts"]
                tabs = st.tabs([d["label"] for d in drafts])
                for tab, draft in zip(tabs, drafts):
                    with tab:
                        st.markdown(draft["text"])
                        wc = len(draft["text"].split())
                        st.caption(f"Word count: {wc}")

        elif step_type == "judge":
            with st.expander(f"⚖️ {step_name}", expanded=False):
                st.success(f"Winner: **{data.get('winner_label', 'N/A')}**")
                st.markdown("**Full Judgment:**")
                st.markdown(data.get("judgment", ""))

        elif step_type == "critique":
            with st.expander(f"🔍 {step_name}", expanded=False):
                st.markdown(data["text"])

        elif step_type == "enhancement":
            stage_idx = data.get("stage_index", 0)
            is_final = (stage_idx == 3)
            with st.expander(f"🎯 {step_name}", expanded=is_final):
                st.markdown(data["text"])
                wc = len(data["text"].split())
                st.caption(f"Word count: {wc}")

    # Export section
    if final_text:
        st.divider()
        st.subheader("Final Speech")
        word_count = len(final_text.split())
        st.metric("Word Count", word_count)

        col1, col2 = st.columns(2)
        with col1:
            st.download_button(
                "Download as .txt",
                data=final_text,
                file_name="speech.txt",
                mime="text/plain",
                key=f"{key_prefix}_export_txt",
            )
        with col2:
            docx_bytes = export_docx(final_text, topic or "Speech")
            st.download_button(
                "Download as .docx",
                data=docx_bytes,
                file_name="speech.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                key=f"{key_prefix}_export_docx",
            )


def _render_audio_player(audio_bytes: bytes, key_prefix: str):
    """Render custom HTML5 audio player with playback speed control."""
    import base64
    b64 = base64.b64encode(audio_bytes).decode()
    player_id = f"player_{key_prefix}"
    speed_id = f"speed_{key_prefix}"
    label_id = f"label_{key_prefix}"

    html = f"""
    <div style="background: #1e1e2e; border-radius: 12px; padding: 20px; margin: 10px 0;">
        <audio id="{player_id}" style="width: 100%; margin-bottom: 12px;"
               controls controlslist="nodownload">
            <source src="data:audio/mp3;base64,{b64}" type="audio/mp3">
        </audio>
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #cdd6f4; font-size: 14px; min-width: 50px;">Speed:</span>
            <input type="range" id="{speed_id}" min="0.5" max="2.0" step="0.05" value="1.0"
                   style="flex: 1; accent-color: #89b4fa; cursor: pointer;"
                   oninput="
                       document.getElementById('{player_id}').playbackRate = this.value;
                       document.getElementById('{label_id}').textContent = this.value + 'x';
                   ">
            <span id="{label_id}" style="color: #89b4fa; font-weight: bold; font-size: 14px; min-width: 40px;">1.0x</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #6c7086; font-size: 11px; margin-top: 4px; padding: 0 62px;">
            <span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span>
        </div>
    </div>
    """
    st.components.v1.html(html, height=160)


def _render_audio_section(speech_id: int, user_id: int, final_text: str, key_prefix: str):
    """Render audio generation and playback for a speech."""
    st.divider()
    st.subheader("Listen to Speech")

    existing_audio = get_audio(speech_id, user_id)

    if existing_audio:
        _render_audio_player(existing_audio, key_prefix)

        col_dl, col_regen = st.columns([1, 1])
        with col_dl:
            st.download_button(
                "Download MP3",
                data=existing_audio,
                file_name="speech.mp3",
                mime="audio/mpeg",
                key=f"{key_prefix}_dl_mp3",
            )
        with col_regen:
            if st.button("Regenerate Audio", key=f"{key_prefix}_regen_audio"):
                st.session_state[f"{key_prefix}_gen_audio"] = True
                st.rerun()

    if not existing_audio or st.session_state.get(f"{key_prefix}_gen_audio"):
        col_voice, col_speed = st.columns(2)
        with col_voice:
            voice_name = st.selectbox(
                "Voice",
                options=list(VOICES.keys()),
                index=0,
                key=f"{key_prefix}_voice",
                help="Preview voices at platform.openai.com/docs/guides/text-to-speech",
            )
        with col_speed:
            gen_speed = st.slider(
                "Generation Speed",
                min_value=0.75, max_value=1.5, value=1.0, step=0.05,
                key=f"{key_prefix}_gen_speed",
                help="Baked-in speech pace. Use the player slider for real-time speed changes.",
            )

        voice_id = VOICES[voice_name]

        if st.button(
            "Generate Audio" if not existing_audio else "Generate with New Settings",
            type="primary",
            key=f"{key_prefix}_gen_btn",
        ):
            with st.spinner(f"Generating audio with '{voice_name}' voice at {gen_speed}x..."):
                try:
                    audio_bytes = generate_audio(final_text, voice=voice_id, speed=gen_speed)
                    save_audio(speech_id, user_id, audio_bytes, voice_id)
                    st.session_state.pop(f"{key_prefix}_gen_audio", None)
                    st.rerun()
                except Exception as e:
                    st.error(f"Audio generation failed: {e}")


# --- Authentication gate ---
if not render_login_page():
    st.stop()

# User is authenticated from here
user = st.session_state.user

# --- Session state init ---
defaults = {
    "topic": "",
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

# --- Sidebar ---
with st.sidebar:
    render_user_menu()
    st.divider()

    st.header("Navigation")
    if st.button("✍️ Create New Speech", use_container_width=True):
        st.session_state.view = "create"
        st.session_state.viewing_speech = None
        st.rerun()
    if st.button("📚 My Speech Library", use_container_width=True):
        st.session_state.view = "library"
        st.rerun()

    if st.session_state.view == "create":
        st.divider()
        st.header("Pipeline Progress")
        if st.session_state.steps:
            for step_name, step_type, data in st.session_state.steps:
                if data.get("status") == "done":
                    st.markdown(f"**{step_name}**")
                else:
                    st.markdown(f"*{step_name}...*")
        else:
            st.caption("No pipeline running yet.")

        st.divider()
        st.markdown(
            "**Pipeline stages:**\n"
            "1. Research Gathering\n"
            "2. 3 Parallel Drafts (Opus / Sonnet / GPT-4o)\n"
            "3. Judge Selects Best Draft\n"
            "4. Critique → Artistic Enhancement\n"
            "5. Critique → Academic Depth\n"
            "6. Critique → Humanization\n"
            "7. Critique → Final Polish\n"
            "8. Text-to-Speech (OpenAI TTS)"
        )


# ============================================================
# VIEW: Create New Speech
# ============================================================
if st.session_state.view == "create":
    st.title("Speech Writer Pipeline")
    st.caption(
        "Enter a topic → Research → 3 parallel drafts → Judge picks best → "
        "4 enhancement stages with critiques → Final polished speech → Listen"
    )

    topic = st.text_area("What should the speech be about?", height=100,
                         placeholder="e.g. The neuroscience of creativity")
    generate = st.button("Generate Speech", type="primary",
                         disabled=(not topic or st.session_state.running))

    if generate and topic:
        st.session_state.topic = topic
        st.session_state.steps = []
        st.session_state.final_text = None
        st.session_state.last_speech_id = None
        st.session_state.running = True
        st.session_state.error = None

        progress_bar = st.progress(0, text="Starting pipeline...")
        status_text = st.empty()

        total_steps = 11
        step_count = 0

        try:
            for step_name, step_type, data in run_full_pipeline(topic):
                if data.get("status") == "done" or step_type == "done":
                    step_count += 1
                    st.session_state.steps.append((step_name, step_type, data))
                    progress_bar.progress(
                        min(step_count / total_steps, 1.0),
                        text=f"Completed: {step_name}"
                    )
                else:
                    status_text.text(f"Running: {step_name}...")

                if step_type == "done":
                    st.session_state.final_text = data.get("final_text")

        except RuntimeError as e:
            st.session_state.error = str(e)

        st.session_state.running = False

        # Auto-save on completion
        if st.session_state.final_text:
            speech_id = save_speech(
                user_id=user["id"],
                topic=st.session_state.topic,
                final_text=st.session_state.final_text,
                stages=st.session_state.steps,
            )
            st.session_state.last_speech_id = speech_id
            st.toast(f"Speech saved automatically!")

        st.rerun()

    if st.session_state.error:
        st.error(st.session_state.error)
        st.session_state.error = None

    _render_steps(st.session_state.steps, st.session_state.final_text,
                  st.session_state.topic, key_prefix="create")

    # Audio section for just-created speech
    if st.session_state.final_text and st.session_state.last_speech_id:
        _render_audio_section(
            speech_id=st.session_state.last_speech_id,
            user_id=user["id"],
            final_text=st.session_state.final_text,
            key_prefix="create_audio",
        )


# ============================================================
# VIEW: Speech Library
# ============================================================
elif st.session_state.view == "library":
    st.title("My Speech Library")

    if st.session_state.viewing_speech:
        speech = get_speech(st.session_state.viewing_speech, user["id"])
        if speech:
            st.subheader(speech["topic"])
            st.caption(f"Created: {speech['created_at'][:19]} | Words: {speech['word_count']}")

            if st.button("← Back to Library"):
                st.session_state.viewing_speech = None
                st.rerun()

            # Audio player at the top for easy access
            _render_audio_section(
                speech_id=speech["id"],
                user_id=user["id"],
                final_text=speech["final_text"],
                key_prefix=f"lib_audio_{speech['id']}",
            )

            # Show stages
            stages = speech.get("stages", [])
            if stages:
                steps = [(s["name"], s["type"], s["data"]) for s in stages]
                _render_steps(steps, speech["final_text"], speech["topic"],
                              key_prefix=f"lib_{speech['id']}")
            else:
                st.markdown(speech["final_text"])

            st.divider()
            col1, col2, col3 = st.columns(3)
            with col1:
                st.download_button(
                    "Download .txt",
                    data=speech["final_text"],
                    file_name="speech.txt",
                    mime="text/plain",
                    key="lib_dl_txt",
                )
            with col2:
                docx_bytes = export_docx(speech["final_text"], speech["topic"])
                st.download_button(
                    "Download .docx",
                    data=docx_bytes,
                    file_name="speech.docx",
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    key="lib_dl_docx",
                )
            with col3:
                if st.button("🗑️ Delete Speech", type="secondary"):
                    delete_speech(speech["id"], user["id"])
                    st.session_state.viewing_speech = None
                    st.toast("Speech deleted.")
                    st.rerun()
        else:
            st.error("Speech not found.")
            st.session_state.viewing_speech = None

    else:
        speeches = get_user_speeches(user["id"])

        if not speeches:
            st.info("No speeches yet. Create your first one!")
            if st.button("Create New Speech"):
                st.session_state.view = "create"
                st.rerun()
        else:
            st.caption(f"{len(speeches)} speech{'es' if len(speeches) != 1 else ''} saved")

            for speech in speeches:
                col1, col2 = st.columns([4, 1])
                with col1:
                    if st.button(
                        f"**{speech['topic']}**\n\n"
                        f"{speech['created_at'][:10]} · {speech['word_count']} words",
                        key=f"speech_{speech['id']}",
                        use_container_width=True,
                    ):
                        st.session_state.viewing_speech = speech["id"]
                        st.rerun()
                with col2:
                    if st.button("🗑️", key=f"del_{speech['id']}"):
                        delete_speech(speech["id"], user["id"])
                        st.rerun()
