"""
Streamlit UI for the Speech Writer Pipeline.
Run with: streamlit run app.py
"""

import streamlit as st
from auth import render_login_page, render_user_menu
from database import save_speech, get_user_speeches, get_speech, delete_speech
from pipeline import run_full_pipeline
from exporter import export_docx

st.set_page_config(page_title="Speech Writer Pipeline", layout="wide")


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

    # Navigation
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
            "7. Critique → Final Polish"
        )


# ============================================================
# VIEW: Create New Speech
# ============================================================
if st.session_state.view == "create":
    st.title("Speech Writer Pipeline")
    st.caption(
        "Enter a topic → Research → 3 parallel drafts → Judge picks best → "
        "4 enhancement stages with critiques → Final polished speech"
    )

    topic = st.text_area("What should the speech be about?", height=100,
                         placeholder="e.g. The neuroscience of creativity")
    generate = st.button("Generate Speech", type="primary",
                         disabled=(not topic or st.session_state.running))

    if generate and topic:
        st.session_state.topic = topic
        st.session_state.steps = []
        st.session_state.final_text = None
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
            st.toast(f"Speech saved automatically! (ID: {speech_id})")

        st.rerun()

    if st.session_state.error:
        st.error(st.session_state.error)
        st.session_state.error = None

    _render_steps(st.session_state.steps, st.session_state.final_text,
                  st.session_state.topic, key_prefix="create")


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
