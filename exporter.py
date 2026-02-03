"""
Export functions for .txt, .docx, and audio (OpenAI TTS).
"""

import io

import openai
from docx import Document
from docx.shared import Pt
from dotenv import load_dotenv

load_dotenv()

_openai_client = openai.OpenAI()


def export_txt(text: str) -> str:
    return text


def export_docx(text: str, title: str) -> bytes:
    doc = Document()
    doc.add_heading(title, level=1)

    paragraphs = text.split("\n\n")
    for para_text in paragraphs:
        stripped = para_text.strip()
        if stripped:
            p = doc.add_paragraph(stripped)
            for run in p.runs:
                run.font.size = Pt(12)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()


def generate_audio(text: str, voice: str = "onyx") -> bytes:
    """
    Generate speech audio from text using OpenAI TTS.

    OpenAI TTS has a 4096 character limit per request, so we split
    long texts into chunks and concatenate the audio.

    Voices: alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer
    'onyx' is a deep, authoritative male voice — good for speeches.

    Returns MP3 bytes.
    """
    # Split text into chunks under 4096 chars, breaking at paragraph boundaries
    chunks = _split_for_tts(text, max_chars=4000)
    audio_parts = []

    for chunk in chunks:
        response = _openai_client.audio.speech.create(
            model="tts-1-hd",
            voice=voice,
            input=chunk,
            response_format="mp3",
        )
        audio_parts.append(response.content)

    # Concatenate MP3 chunks (MP3 is concatenation-safe)
    return b"".join(audio_parts)


def _split_for_tts(text: str, max_chars: int = 4000) -> list[str]:
    """Split text into chunks at paragraph boundaries, staying under max_chars."""
    paragraphs = text.split("\n\n")
    chunks = []
    current = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        # If a single paragraph exceeds max, split at sentence boundaries
        if len(para) > max_chars:
            if current:
                chunks.append(current.strip())
                current = ""
            sentences = _split_sentences(para)
            for sentence in sentences:
                if len(current) + len(sentence) + 1 > max_chars:
                    if current:
                        chunks.append(current.strip())
                    current = sentence
                else:
                    current = current + " " + sentence if current else sentence
        elif len(current) + len(para) + 2 > max_chars:
            chunks.append(current.strip())
            current = para
        else:
            current = current + "\n\n" + para if current else para

    if current.strip():
        chunks.append(current.strip())

    return chunks


def _split_sentences(text: str) -> list[str]:
    """Rough sentence splitting on . ! ?"""
    import re
    parts = re.split(r'(?<=[.!?])\s+', text)
    return [p for p in parts if p.strip()]
