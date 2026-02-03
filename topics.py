"""
Topic suggestions for MindCast.

Loads curated topics from topics.txt and provides helpers for:
- Random topic selection ("Surprise me")
- Topic suggestions by category
- Featured/highlighted topics
"""

import random
from pathlib import Path

# Load topics from file
_TOPICS_FILE = Path(__file__).parent / "topics.txt"
_ALL_TOPICS: list[str] = []

def _load_topics():
    """Load topics from file, filtering out headers and empty lines."""
    global _ALL_TOPICS
    if _ALL_TOPICS:
        return _ALL_TOPICS

    try:
        with open(_TOPICS_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # Filter: skip first line ("Video List"), empty lines, and lines that look like headers
        topics = []
        for line in lines[1:]:  # Skip "Video List" header
            line = line.strip()
            if not line:
                continue
            # Skip lines that are clearly category headers (very short or generic)
            if line in {"Natural Sciences", "Social Sciences", "Humanities", "Formal Sciences",
                       "Applied Sciences", "Business and Management", "Other Fields and Interdisciplinary Studies"}:
                continue
            topics.append(line)

        _ALL_TOPICS = topics
    except Exception:
        _ALL_TOPICS = []

    return _ALL_TOPICS


def get_random_topic() -> str:
    """Get a random topic from the list."""
    topics = _load_topics()
    if not topics:
        return "The science of memory"
    return random.choice(topics)


def get_random_topics(n: int = 5) -> list[str]:
    """Get n random unique topics."""
    topics = _load_topics()
    if not topics:
        return ["The science of memory", "Quantum mechanics", "Stoic philosophy"]
    return random.sample(topics, min(n, len(topics)))


# Curated "featured" topics - intellectually stimulating, broad appeal
FEATURED_TOPICS = [
    "How does memory work and how can I improve mine?",
    "The science of habit formation",
    "Quantum mechanics for curious minds",
    "The history of consciousness research",
    "Game theory and strategic thinking",
    "The neuroscience of decision making",
    "Stoic philosophy for modern life",
    "The psychology of persuasion",
    "Evolution of human language",
    "The mathematics of infinity",
    "How emotions shape our reality",
    "The physics of time",
    "Behavioral economics and irrational choices",
    "The microbiome and mental health",
    "Philosophy of mind and free will",
]


def get_featured_topics(n: int = 3) -> list[str]:
    """Get n featured topics (curated for quality)."""
    return random.sample(FEATURED_TOPICS, min(n, len(FEATURED_TOPICS)))


# Topic categories for browsing
TOPIC_CATEGORIES = {
    "science": {
        "name": "Science",
        "icon": "🔬",
        "keywords": ["Physics", "Chemistry", "Biology", "Neuroscience", "Astronomy", "Ecology"],
    },
    "mind": {
        "name": "Mind & Psychology",
        "icon": "🧠",
        "keywords": ["Psychology", "Cognitive", "Neuroscience", "Consciousness", "Memory", "Emotions"],
    },
    "philosophy": {
        "name": "Philosophy",
        "icon": "💭",
        "keywords": ["Philosophy", "Ethics", "Metaphysics", "Epistemology", "Logic", "Aesthetics"],
    },
    "history": {
        "name": "History & Culture",
        "icon": "📜",
        "keywords": ["History", "Anthropology", "Archaeology", "Cultural", "Civilization"],
    },
    "business": {
        "name": "Business & Economics",
        "icon": "📈",
        "keywords": ["Economics", "Finance", "Marketing", "Management", "Entrepreneurship"],
    },
    "technology": {
        "name": "Technology",
        "icon": "💻",
        "keywords": ["Computer", "AI", "Machine Learning", "Cybersecurity", "Software", "Data"],
    },
}


def get_topics_by_category(category_id: str, n: int = 5) -> list[str]:
    """Get random topics matching a category's keywords."""
    topics = _load_topics()
    if not topics or category_id not in TOPIC_CATEGORIES:
        return []

    keywords = TOPIC_CATEGORIES[category_id]["keywords"]
    matching = [t for t in topics if any(kw.lower() in t.lower() for kw in keywords)]

    if not matching:
        return []
    return random.sample(matching, min(n, len(matching)))
