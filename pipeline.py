"""
Core pipeline engine (optimized for quality).

Flow:
  1. Stage 0: Research gathering (Anthropic)
  2. Stage 1: 2 parallel drafts (Sonnet + GPT-4o)
  3. Judge: Pick best draft + note strengths from loser
  4. Stages 2-5: Four enhancement stages with critique before each:
     - Stage 2: Deep Enhancement (artistic + academic depth)
     - Stage 3: De-AI & Voice Authenticity (strip LLM patterns)
     - Stage 4: Oral Delivery Optimization (breath, rhythm, flow)
     - Stage 5: Final Polish (line-by-line refinement)
  5. Save opening paragraph for future differentiation

Each enhancement stage receives: topic, research brief, critique feedback, previous output.
"""

import json
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import anthropic
import openai
from dotenv import load_dotenv

from prompts import (
    CRITIQUE_TEMPLATE,
    DIFFERENTIATION_CONTEXT,
    DRAFT_VARIANTS,
    ENHANCEMENT_STAGES,
    JUDGE_PROMPT,
    LEARNING_ADDONS,
    PERSPECTIVE_LENSES,
    get_combined_lens_prompt,
    get_draft_stage,
    get_research_stage,
)

load_dotenv()


def _init_keys():
    """Load API keys from st.secrets (Streamlit Cloud) into env vars."""
    try:
        import streamlit as st
        for key in ("ANTHROPIC_API_KEY", "OPENAI_API_KEY"):
            if key not in os.environ and key in st.secrets:
                os.environ[key] = st.secrets[key]
    except Exception:
        pass


def _get_anthropic_client():
    _init_keys()
    return anthropic.Anthropic()


def _get_openai_client():
    _init_keys()
    return openai.OpenAI()


DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514"
DEFAULT_OPENAI_MODEL = "gpt-4o-2024-11-20"
MAX_TOKENS = 16384

# File to store previous speech openings for differentiation
HISTORY_FILE = Path(__file__).parent / "speech_history.json"


def _load_history() -> list[str]:
    if HISTORY_FILE.exists():
        try:
            data = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
            return data.get("openings", [])
        except (json.JSONDecodeError, KeyError):
            return []
    return []


def _save_opening(text: str):
    openings = _load_history()
    # Store first 300 chars as the "opening paragraph"
    opening = text[:300].strip()
    openings.append(opening)
    # Keep last 20 openings max
    openings = openings[-20:]
    HISTORY_FILE.write_text(
        json.dumps({"openings": openings}, indent=2), encoding="utf-8"
    )


def _call_llm(
    provider: str,
    system: str,
    user_content: str,
    temperature: float = 0.7,
    model_override: str | None = None,
) -> str:
    """Unified LLM call for both Anthropic and OpenAI."""
    if provider == "openai":
        model = model_override or DEFAULT_OPENAI_MODEL
        response = _get_openai_client().chat.completions.create(
            model=model,
            max_tokens=MAX_TOKENS,
            temperature=temperature,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_content},
            ],
        )
        return response.choices[0].message.content

    else:  # anthropic
        model = model_override or DEFAULT_ANTHROPIC_MODEL
        message = _get_anthropic_client().messages.create(
            model=model,
            max_tokens=MAX_TOKENS,
            temperature=temperature,
            system=system,
            messages=[{"role": "user", "content": user_content}],
        )
        return message.content[0].text


def _call_llm_safe(provider: str, system: str, user_content: str, **kwargs) -> str:
    """Wrapper with error handling."""
    try:
        return _call_llm(provider, system, user_content, **kwargs)
    except anthropic.RateLimitError:
        raise RuntimeError("Rate limited by Anthropic. Wait a moment and retry.")
    except anthropic.APIConnectionError:
        raise RuntimeError("Cannot reach Anthropic API. Check your network.")
    except anthropic.AuthenticationError:
        raise RuntimeError("Invalid Anthropic API key. Check your .env file.")
    except anthropic.APIError as e:
        raise RuntimeError(f"Anthropic API error: {e.message}")
    except openai.RateLimitError:
        raise RuntimeError("Rate limited by OpenAI. Wait a moment and retry.")
    except openai.APIConnectionError:
        raise RuntimeError("Cannot reach OpenAI API. Check your network.")
    except openai.AuthenticationError:
        raise RuntimeError("Invalid OpenAI API key. Check your .env file.")
    except openai.APIError as e:
        raise RuntimeError(f"OpenAI API error: {e}")


# ──────────────────────────────────────────────
# Stage 0: Research Gathering
# ──────────────────────────────────────────────
def run_research(topic: str, length: str = "10 min") -> str:
    stage = get_research_stage(length)
    user_content = stage["user_template"].format(topic=topic)
    return _call_llm_safe(
        provider=stage["provider"],
        system=stage["system"],
        user_content=user_content,
        temperature=stage["temperature"],
        model_override=stage["model_override"],
    )


# ──────────────────────────────────────────────
# Stage 1: Parallel Drafts
# ──────────────────────────────────────────────
def run_parallel_drafts(topic: str, research: str, length: str = "10 min") -> list[dict]:
    """Generate drafts in parallel. Returns list of {label, text}."""
    # Add differentiation context if we have history
    openings = _load_history()
    diff_prefix = ""
    if openings:
        diff_prefix = DIFFERENTIATION_CONTEXT.format(
            previous_openings="\n---\n".join(openings[-5:])
        )

    stage = get_draft_stage(length)
    base_user = stage["user_template"].format(topic=topic, research=research)
    user_content = diff_prefix + base_user

    num_drafts = len(DRAFT_VARIANTS)
    results = [None] * num_drafts

    def _generate(idx, variant):
        text = _call_llm_safe(
            provider=variant["provider"],
            system=stage["system"],
            user_content=user_content,
            temperature=variant["temperature"],
            model_override=variant["model_override"],
        )
        return idx, variant["label"], text

    with ThreadPoolExecutor(max_workers=num_drafts) as executor:
        futures = [
            executor.submit(_generate, i, v) for i, v in enumerate(DRAFT_VARIANTS)
        ]
        for future in as_completed(futures):
            idx, label, text = future.result()
            results[idx] = {"label": label, "text": text}

    return results


# ──────────────────────────────────────────────
# Judge: Select Best Draft
# ──────────────────────────────────────────────
def run_judge(topic: str, drafts: list[dict]) -> dict:
    """
    Judge drafts (2 or 3). Returns {
        winner_index: int,
        winner_label: str,
        winner_text: str,
        judgment: str,
        borrow_notes: str
    }
    """
    stage = JUDGE_PROMPT

    # Build user content dynamically based on number of drafts
    if len(drafts) == 2:
        user_content = stage["user_template_2"].format(
            topic=topic,
            draft_a=drafts[0]["text"],
            draft_b=drafts[1]["text"],
        )
        letter_map = {"A": 0, "B": 1}
        pattern = r"WINNER:\s*([AB])"
    else:
        user_content = stage["user_template"].format(
            topic=topic,
            draft_a=drafts[0]["text"],
            draft_b=drafts[1]["text"],
            draft_c=drafts[2]["text"],
        )
        letter_map = {"A": 0, "B": 1, "C": 2}
        pattern = r"WINNER:\s*([ABC])"

    judgment = _call_llm_safe(
        provider=stage["provider"],
        system=stage["system"],
        user_content=user_content,
        temperature=stage["temperature"],
        model_override=stage["model_override"],
    )

    # Parse winner from judgment
    winner_letter = "A"  # default fallback
    match = re.search(pattern, judgment, re.IGNORECASE)
    if match:
        winner_letter = match.group(1).upper()

    winner_index = letter_map.get(winner_letter, 0)

    # Extract borrow notes
    borrow_notes = ""
    borrow_match = re.search(
        r"BORROW FROM LOSER[S]?:\s*\n(.*)", judgment, re.DOTALL | re.IGNORECASE
    )
    if borrow_match:
        borrow_notes = borrow_match.group(1).strip()

    return {
        "winner_index": winner_index,
        "winner_label": drafts[winner_index]["label"],
        "winner_text": drafts[winner_index]["text"],
        "judgment": judgment,
        "borrow_notes": borrow_notes,
    }


# ──────────────────────────────────────────────
# Critique (between enhancement stages)
# ──────────────────────────────────────────────
def run_critique(topic: str, text: str, completed_stage: str, next_stage: str) -> str:
    tmpl = CRITIQUE_TEMPLATE
    user_content = tmpl["user_template"].format(
        topic=topic,
        completed_stage=completed_stage,
        next_stage=next_stage,
        text=text,
    )
    return _call_llm_safe(
        provider=tmpl["provider"],
        system=tmpl["system"],
        user_content=user_content,
        temperature=tmpl["temperature"],
        model_override=tmpl["model_override"],
    )


# ──────────────────────────────────────────────
# Enhancement Stages (2-5)
# ──────────────────────────────────────────────
def run_enhancement_stage(
    stage_index: int,
    topic: str,
    research: str,
    critique: str,
    previous_output: str,
) -> str:
    stage = ENHANCEMENT_STAGES[stage_index]
    user_content = stage["user_template"].format(
        topic=topic,
        research=research,
        critique=critique,
        previous_output=previous_output,
    )
    return _call_llm_safe(
        provider=stage["provider"],
        system=stage["system"],
        user_content=user_content,
        temperature=stage["temperature"],
        model_override=stage.get("model_override"),
    )


# ──────────────────────────────────────────────
# Full Pipeline (generator for UI updates)
# ──────────────────────────────────────────────
def run_full_pipeline(topic: str, length: str = "10 min"):
    """
    Generator yielding status updates as tuples:
        (step_name, step_type, data)

    step_type is one of: "research", "drafts", "judge", "critique", "enhancement", "done"
    data contains the relevant output for that step.

    Args:
        topic: The speech topic
        length: Speech length key ("5 min", "10 min", "15 min", "20 min")
    """

    # Step 1: Research
    yield ("Stage 0: Research Gathering", "research", {"status": "running"})
    research = run_research(topic, length)
    yield ("Stage 0: Research Gathering", "research", {"status": "done", "text": research})

    # Step 2: Parallel drafts
    yield ("Stage 1: Parallel Drafts", "drafts", {"status": "running"})
    drafts = run_parallel_drafts(topic, research, length)
    yield ("Stage 1: Parallel Drafts", "drafts", {"status": "done", "drafts": drafts})

    # Step 3: Judge
    yield ("Judge: Select Best Draft", "judge", {"status": "running"})
    judge_result = run_judge(topic, drafts)
    yield ("Judge: Select Best Draft", "judge", {"status": "done", **judge_result})

    current_text = judge_result["winner_text"]

    # Steps 4-7: Enhancement stages with critiques between them
    for i, stage in enumerate(ENHANCEMENT_STAGES):
        # Critique before this stage (except the first enhancement if judge already provided feedback)
        next_stage_name = stage["name"]
        if i == 0:
            prev_stage_name = "Draft Selection (Judge)"
        else:
            prev_stage_name = ENHANCEMENT_STAGES[i - 1]["name"]

        critique_name = f"Critique: {prev_stage_name} → {next_stage_name}"
        yield (critique_name, "critique", {"status": "running"})
        critique = run_critique(topic, current_text, prev_stage_name, next_stage_name)
        yield (critique_name, "critique", {"status": "done", "text": critique})

        # Enhancement stage
        yield (stage["name"], "enhancement", {"status": "running", "stage_index": i})
        current_text = run_enhancement_stage(i, topic, research, critique, current_text)
        yield (stage["name"], "enhancement", {"status": "done", "stage_index": i, "text": current_text})

    # Save opening for future differentiation
    _save_opening(current_text)

    yield ("Complete", "done", {"final_text": current_text})


# ══════════════════════════════════════════════════════════════════════════════
# LENS ANALYSIS (Sovereign Mind / Reflect Mode)
# ══════════════════════════════════════════════════════════════════════════════

def run_lens_analysis(situation: str, selected_lenses: list[tuple[str, str]]) -> str:
    """
    Generate a text-based lens analysis (Quick Insight mode).

    Args:
        situation: The user's situation/dilemma to analyze
        selected_lenses: List of (category_id, lens_id) tuples

    Returns:
        Structured analysis text
    """
    from lenses import (
        LENS_ANALYSIS_SYSTEM,
        LENS_ANALYSIS_USER_TEMPLATE,
        get_lens_prompts,
    )

    lens_prompts = get_lens_prompts(selected_lenses)
    user_content = LENS_ANALYSIS_USER_TEMPLATE.format(
        situation=situation,
        lens_prompts=lens_prompts,
    )

    return _call_llm_safe(
        provider="anthropic",
        system=LENS_ANALYSIS_SYSTEM,
        user_content=user_content,
        temperature=0.7,
        model_override="claude-sonnet-4-20250514",
    )


def run_lens_audio_script(
    situation: str,
    selected_lenses: list[tuple[str, str]],
    minutes: int = 5,
) -> str:
    """
    Generate an audio script for Deep Reflection mode.

    Args:
        situation: The user's situation/dilemma
        selected_lenses: List of (category_id, lens_id) tuples
        minutes: Target audio length in minutes

    Returns:
        Audio script text ready for TTS
    """
    from lenses import (
        LENS_AUDIO_SYSTEM,
        LENS_AUDIO_USER_TEMPLATE,
        get_lens_prompts,
    )

    # Approximately 150 words per minute for thoughtful narration
    word_count = minutes * 150

    lens_prompts = get_lens_prompts(selected_lenses)
    user_content = LENS_AUDIO_USER_TEMPLATE.format(
        situation=situation,
        lens_prompts=lens_prompts,
        word_count=word_count,
        minutes=minutes,
    )

    return _call_llm_safe(
        provider="anthropic",
        system=LENS_AUDIO_SYSTEM,
        user_content=user_content,
        temperature=0.8,
        model_override="claude-sonnet-4-20250514",
    )


# ══════════════════════════════════════════════════════════════════════════════
# LEARNING ADD-ONS (on-demand after episode generation)
# ══════════════════════════════════════════════════════════════════════════════

def generate_addon(addon_key: str, topic: str, transcript: str) -> str:
    """
    Generate a learning add-on (quiz, journal, takeaways).

    Args:
        addon_key: One of "quiz", "journal", "takeaways"
        topic: The episode topic
        transcript: The full episode transcript

    Returns:
        Generated add-on content
    """
    if addon_key not in LEARNING_ADDONS:
        raise ValueError(f"Unknown add-on: {addon_key}")

    addon = LEARNING_ADDONS[addon_key]
    user_content = addon["user_template"].format(topic=topic, transcript=transcript)

    return _call_llm_safe(
        provider=addon.get("provider", "anthropic"),
        system=addon["system"],
        user_content=user_content,
        temperature=addon["temperature"],
        model_override=addon.get("model_override", "claude-sonnet-4-20250514"),
    )


def generate_perspective(lens_key: str, topic: str, transcript: str) -> str:
    """
    Generate a perspective lens analysis.

    Args:
        lens_key: One of the perspective lens keys (stoic, first_principles, etc.)
        topic: The episode topic
        transcript: The full episode transcript

    Returns:
        Generated perspective analysis
    """
    if lens_key not in PERSPECTIVE_LENSES:
        raise ValueError(f"Unknown perspective lens: {lens_key}")

    lens = PERSPECTIVE_LENSES[lens_key]
    user_content = lens["user_template"].format(topic=topic, transcript=transcript)

    return _call_llm_safe(
        provider=lens.get("provider", "anthropic"),
        system=lens["system"],
        user_content=user_content,
        temperature=lens["temperature"],
        model_override=lens.get("model_override", "claude-sonnet-4-20250514"),
    )


def generate_combined_perspectives(lens_keys: list[str], topic: str, transcript: str) -> str:
    """
    Generate a combined analysis from multiple perspective lenses.

    Args:
        lens_keys: List of perspective lens keys to combine
        topic: The episode topic
        transcript: The full episode transcript

    Returns:
        Generated combined perspective analysis
    """
    combined = get_combined_lens_prompt(lens_keys)
    if not combined:
        raise ValueError(f"Invalid lens combination: {lens_keys}")

    user_content = combined["user_template"].format(topic=topic, transcript=transcript)

    return _call_llm_safe(
        provider=combined.get("provider", "anthropic"),
        system=combined["system"],
        user_content=user_content,
        temperature=combined["temperature"],
        model_override=combined.get("model_override", "claude-sonnet-4-20250514"),
    )
