"""
Video generation using Luma AI Dream Machine.

Pipeline:
1. Segment transcript into shots (~10-15 seconds each)
2. Generate visual prompts for each shot
3. Generate video clips via Luma API
4. Stitch clips together with audio

Docs: https://docs.lumalabs.ai/docs/python-video-generation
"""

import io
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from dotenv import load_dotenv

load_dotenv()


def _get_luma_client():
    """Get Luma AI client with API key from env or Streamlit secrets."""
    try:
        import streamlit as st
        if "LUMA_API_KEY" not in os.environ and "LUMA_API_KEY" in st.secrets:
            os.environ["LUMAAI_API_KEY"] = st.secrets["LUMA_API_KEY"]
    except Exception:
        pass

    from lumaai import LumaAI
    return LumaAI()


def segment_transcript(transcript: str, target_seconds: int = 12) -> list[dict]:
    """
    Split transcript into segments for video shots.

    Each segment is ~12 seconds of narration (~30 words at 150 wpm).

    Returns list of {text, word_count, estimated_seconds}
    """
    # Split by paragraphs first
    paragraphs = [p.strip() for p in transcript.split("\n\n") if p.strip()]

    segments = []
    current_text = ""
    words_per_segment = int(target_seconds * 2.5)  # ~150 wpm = 2.5 words/sec

    for para in paragraphs:
        words = para.split()

        # If paragraph is short, try to combine with current
        if len(current_text.split()) + len(words) <= words_per_segment:
            current_text = f"{current_text} {para}".strip()
        else:
            # Save current segment if it exists
            if current_text:
                word_count = len(current_text.split())
                segments.append({
                    "text": current_text,
                    "word_count": word_count,
                    "estimated_seconds": word_count / 2.5,
                })

            # Handle long paragraphs by splitting on sentences
            if len(words) > words_per_segment:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                current_text = ""
                for sentence in sentences:
                    if len(current_text.split()) + len(sentence.split()) <= words_per_segment:
                        current_text = f"{current_text} {sentence}".strip()
                    else:
                        if current_text:
                            word_count = len(current_text.split())
                            segments.append({
                                "text": current_text,
                                "word_count": word_count,
                                "estimated_seconds": word_count / 2.5,
                            })
                        current_text = sentence
            else:
                current_text = para

    # Don't forget the last segment
    if current_text:
        word_count = len(current_text.split())
        segments.append({
            "text": current_text,
            "word_count": word_count,
            "estimated_seconds": word_count / 2.5,
        })

    return segments


def generate_shot_prompts(
    segments: list[dict],
    topic: str,
    style: str = "documentary"
) -> list[dict]:
    """
    Generate visual prompts for each transcript segment.

    Uses Claude to create cinematic shot descriptions.
    """
    from pipeline import _call_llm_safe

    # Style presets
    style_guides = {
        "documentary": (
            "Cinematic documentary style. Natural lighting. Shallow depth of field. "
            "Mix of wide establishing shots, medium shots, and intimate close-ups. "
            "Subtle camera movement - slow dolly, gentle handheld."
        ),
        "noir": (
            "Film noir style. High contrast black and white. Dramatic shadows. "
            "Low-key lighting. Dutch angles. Moody atmospheric."
        ),
        "futurist": (
            "Sci-fi futurist aesthetic. Neon accents. Clean minimalist spaces. "
            "Holographic elements. Smooth camera glides. Cool blue tones."
        ),
        "nature": (
            "Nature documentary style. Golden hour lighting. Macro details. "
            "Sweeping landscape shots. Time-lapse elements. Organic textures."
        ),
    }

    style_guide = style_guides.get(style, style_guides["documentary"])

    system = (
        "You are a cinematographer creating shot descriptions for an AI video generator. "
        "Each shot must be visually specific, cinematic, and match the narration content. "
        "Describe what is SEEN, not concepts. Be concrete: objects, lighting, camera angle, movement."
    )

    prompts = []
    for i, segment in enumerate(segments):
        user_content = f"""Topic: {topic}

Narration for this shot:
"{segment['text']}"

Style guide: {style_guide}

Shot number: {i + 1} of {len(segments)}

Create a single, specific visual prompt (2-3 sentences) that:
1. Visualizes the key concept from this narration
2. Specifies camera angle/movement
3. Describes lighting and mood
4. Uses concrete visual elements (not abstract concepts)

Format: Just the shot description, no preamble."""

        shot_prompt = _call_llm_safe(
            provider="anthropic",
            system=system,
            user_content=user_content,
            temperature=0.7,
            model_override="claude-sonnet-4-20250514",
        )

        prompts.append({
            **segment,
            "shot_prompt": shot_prompt.strip(),
            "shot_number": i + 1,
        })

    return prompts


def generate_video_clip(
    prompt: str,
    duration: str = "5s",
    resolution: str = "720p",
    model: str = "ray-flash-2",
) -> bytes:
    """
    Generate a single video clip using Luma AI.

    Args:
        prompt: Visual description for the shot
        duration: "5s" or "9s"
        resolution: "540p", "720p", or "1080p"
        model: "ray-flash-2" (fast/cheap) or "ray-2" (quality)

    Returns:
        Video bytes (MP4)
    """
    client = _get_luma_client()

    # Create generation
    generation = client.generations.create(
        prompt=prompt,
        model=model,
        resolution=resolution,
        duration=duration,
    )

    # Poll until complete
    while True:
        generation = client.generations.get(id=generation.id)
        if generation.state == "completed":
            break
        elif generation.state == "failed":
            raise RuntimeError(f"Video generation failed: {generation.failure_reason}")
        time.sleep(2)

    # Download the video
    video_url = generation.assets.video
    response = requests.get(video_url, stream=True)
    response.raise_for_status()

    return response.content


def generate_all_clips(
    shot_prompts: list[dict],
    duration: str = "5s",
    resolution: str = "720p",
    model: str = "ray-flash-2",
    max_parallel: int = 3,
) -> list[bytes]:
    """
    Generate all video clips, with some parallelism.

    Returns list of video bytes in order.
    """
    results = [None] * len(shot_prompts)

    def _generate(idx, shot):
        video = generate_video_clip(
            prompt=shot["shot_prompt"],
            duration=duration,
            resolution=resolution,
            model=model,
        )
        return idx, video

    with ThreadPoolExecutor(max_workers=max_parallel) as executor:
        futures = [
            executor.submit(_generate, i, shot)
            for i, shot in enumerate(shot_prompts)
        ]
        for future in as_completed(futures):
            idx, video = future.result()
            results[idx] = video

    return results


def stitch_video_with_audio(
    video_clips: list[bytes],
    audio_bytes: bytes,
    output_path: str | None = None,
) -> bytes:
    """
    Stitch video clips together and overlay audio.

    Uses FFmpeg via subprocess.

    Args:
        video_clips: List of MP4 bytes in order
        audio_bytes: MP3 audio to overlay
        output_path: Optional path to save (otherwise returns bytes)

    Returns:
        Final MP4 bytes
    """
    import subprocess
    import tempfile
    from pathlib import Path

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        # Write video clips to temp files
        clip_paths = []
        for i, clip in enumerate(video_clips):
            clip_path = tmpdir / f"clip_{i:03d}.mp4"
            clip_path.write_bytes(clip)
            clip_paths.append(clip_path)

        # Write audio
        audio_path = tmpdir / "audio.mp3"
        audio_path.write_bytes(audio_bytes)

        # Create concat file for FFmpeg
        concat_path = tmpdir / "concat.txt"
        with open(concat_path, "w") as f:
            for path in clip_paths:
                f.write(f"file '{path}'\n")

        # Output path
        if output_path:
            final_path = Path(output_path)
        else:
            final_path = tmpdir / "final.mp4"

        # FFmpeg command: concat videos, add audio, trim to audio length
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0", "-i", str(concat_path),
            "-i", str(audio_path),
            "-c:v", "libx264",
            "-c:a", "aac",
            "-shortest",  # Trim to shortest stream (audio)
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-pix_fmt", "yuv420p",
            str(final_path),
        ]

        subprocess.run(cmd, check=True, capture_output=True)

        return final_path.read_bytes()


def generate_video_from_episode(
    topic: str,
    transcript: str,
    audio_bytes: bytes,
    style: str = "documentary",
    resolution: str = "720p",
    model: str = "ray-flash-2",
    on_progress: callable = None,
) -> bytes:
    """
    Full pipeline: transcript + audio -> video.

    Args:
        topic: Episode topic
        transcript: Full episode transcript
        audio_bytes: Episode audio (MP3)
        style: Visual style preset
        resolution: "720p" or "1080p"
        model: "ray-flash-2" (fast) or "ray-2" (quality)
        on_progress: Optional callback(step, total, message)

    Returns:
        Final MP4 bytes
    """
    def _progress(step, total, msg):
        if on_progress:
            on_progress(step, total, msg)

    # Step 1: Segment transcript
    _progress(1, 4, "Segmenting transcript...")
    segments = segment_transcript(transcript, target_seconds=10)

    # Step 2: Generate shot prompts
    _progress(2, 4, f"Creating {len(segments)} shot descriptions...")
    shot_prompts = generate_shot_prompts(segments, topic, style)

    # Step 3: Generate video clips
    _progress(3, 4, f"Generating {len(shot_prompts)} video clips...")
    clips = generate_all_clips(
        shot_prompts,
        duration="5s",
        resolution=resolution,
        model=model,
        max_parallel=2,  # Be nice to the API
    )

    # Step 4: Stitch with audio
    _progress(4, 4, "Stitching video with audio...")
    final_video = stitch_video_with_audio(clips, audio_bytes)

    return final_video


# ════════════════════════════════════════════════════════════════════════════════
# UTILITY: Check if video generation is available
# ════════════════════════════════════════════════════════════════════════════════

def is_video_enabled() -> bool:
    """Check if Luma API key is configured."""
    try:
        import streamlit as st
        if "LUMA_API_KEY" in st.secrets:
            return True
    except Exception:
        pass
    return bool(os.getenv("LUMAAI_API_KEY") or os.getenv("LUMA_API_KEY"))
