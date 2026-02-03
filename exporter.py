"""
Export functions for .txt and .docx download.
"""

import io
from docx import Document
from docx.shared import Pt


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
