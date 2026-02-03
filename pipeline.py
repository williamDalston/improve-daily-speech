"""
Core pipeline engine.

Flow:
  1. Stage 0: Research gathering (Anthropic)
  2. Stage 1: 3 parallel drafts (Opus, Sonnet, GPT-4o)
  3. Judge: Pick best draft + note strengths from losers
  4. Stages 2-5: Enhancement with critique between each stage
  5. Save opening paragraph for future differentiation

Each enhancement stage receives: topic, research brief, critique feedback, previous output.
Critiques alternate between OpenAI and Anthropic for varied perspective.
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
    """Generate 3 drafts in parallel. Returns list of {label, text}."""
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

    results = [None, None, None]

    def _generate(idx, variant):
        text = _call_llm_safe(
            provider=variant["provider"],
            system=stage["system"],
            user_content=user_content,
            temperature=variant["temperature"],
            model_override=variant["model_override"],
        )
        return idx, variant["label"], text

    with ThreadPoolExecutor(max_workers=3) as executor:
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
    Judge 3 drafts. Returns {
        winner_index: int,
        winner_label: str,
        winner_text: str,
        judgment: str,
        borrow_notes: str
    }
    """
    stage = JUDGE_PROMPT
    user_content = stage["user_template"].format(
        topic=topic,
        draft_a=drafts[0]["text"],
        draft_b=drafts[1]["text"],
        draft_c=drafts[2]["text"],
    )

    judgment = _call_llm_safe(
        provider=stage["provider"],
        system=stage["system"],
        user_content=user_content,
        temperature=stage["temperature"],
        model_override=stage["model_override"],
    )

    # Parse winner from judgment
    winner_letter = "A"  # default fallback
    match = re.search(r"WINNER:\s*([ABC])", judgment, re.IGNORECASE)
    if match:
        winner_letter = match.group(1).upper()

    winner_index = {"A": 0, "B": 1, "C": 2}.get(winner_letter, 0)

    # Extract borrow notes
    borrow_notes = ""
    borrow_match = re.search(
        r"BORROW FROM LOSERS:\s*\n(.*)", judgment, re.DOTALL | re.IGNORECASE
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
