"""
Sovereign Mind Lens Engine.

Lenses are ways of seeing - different cognitive frameworks for analyzing
situations, decisions, and experiences. Each lens reveals different truths.

Categories:
- Psychological: How the mind interprets
- Ethical: What should I do
- Strategic: What power do I have
- Temporal: Where am I in time
- Epistemological: How do I know
- Sociological: How does society shape this
"""

# ════════════════════════════════════════════════════════════════════════════
# LENS DEFINITIONS
# ════════════════════════════════════════════════════════════════════════════

LENS_CATEGORIES = {
    "psychological": {
        "name": "Psychological",
        "description": "How the mind interprets this experience",
        "icon": "🧠",
        "lenses": {
            "cognitive": {
                "name": "Cognitive (CBT)",
                "description": "Thoughts → Emotions → Behavior patterns",
                "prompt": (
                    "Analyze through a Cognitive Behavioral lens:\n"
                    "- What automatic thoughts might be triggered?\n"
                    "- What cognitive distortions could be at play (catastrophizing, black-and-white thinking, mind-reading, etc.)?\n"
                    "- How do these thoughts connect to emotions and potential behaviors?\n"
                    "- What would a more balanced perspective look like?"
                ),
            },
            "attachment": {
                "name": "Attachment",
                "description": "Relational patterns and emotional templates",
                "prompt": (
                    "Analyze through an Attachment Theory lens:\n"
                    "- What attachment patterns might be activated (secure, anxious, avoidant)?\n"
                    "- How might early relational templates be shaping the response?\n"
                    "- What needs for connection, safety, or autonomy are present?\n"
                    "- How might this situation trigger core relational fears or desires?"
                ),
            },
            "jungian": {
                "name": "Jungian / Archetypal",
                "description": "Shadow, persona, and deeper symbolic meaning",
                "prompt": (
                    "Analyze through a Jungian lens:\n"
                    "- What archetypes might be constellated (hero, shadow, trickster, wise elder)?\n"
                    "- Is there shadow material being projected or avoided?\n"
                    "- What is the persona protecting, and what lies beneath?\n"
                    "- What deeper symbolic or mythic patterns does this situation echo?"
                ),
            },
            "positive": {
                "name": "Positive Psychology",
                "description": "Strengths, growth, and flourishing",
                "prompt": (
                    "Analyze through a Positive Psychology lens:\n"
                    "- What character strengths could be applied here?\n"
                    "- Where are the opportunities for growth and meaning?\n"
                    "- What would 'flourishing' look like in this situation?\n"
                    "- How can this challenge become a catalyst for development?"
                ),
            },
        },
    },
    "ethical": {
        "name": "Ethical",
        "description": "What is the right action",
        "icon": "⚖️",
        "lenses": {
            "utilitarian": {
                "name": "Utilitarian",
                "description": "Maximize overall good and minimize harm",
                "prompt": (
                    "Analyze through a Utilitarian lens:\n"
                    "- What are all the potential consequences of each option?\n"
                    "- Who is affected and how significantly?\n"
                    "- Which choice produces the greatest good for the greatest number?\n"
                    "- What are the short-term vs long-term utility calculations?"
                ),
            },
            "deontological": {
                "name": "Deontological",
                "description": "Duty, rules, and moral obligations",
                "prompt": (
                    "Analyze through a Deontological (Kantian) lens:\n"
                    "- What duties or obligations are at stake?\n"
                    "- Could the principle behind this action be universalized?\n"
                    "- Are people being treated as ends in themselves, or merely as means?\n"
                    "- What rules or commitments should not be violated regardless of outcome?"
                ),
            },
            "virtue": {
                "name": "Virtue Ethics",
                "description": "Character, habits, and the good life",
                "prompt": (
                    "Analyze through a Virtue Ethics lens:\n"
                    "- What would a person of excellent character do here?\n"
                    "- Which virtues are called for (courage, temperance, justice, wisdom, compassion)?\n"
                    "- What kind of person does each choice make you become?\n"
                    "- How does this fit into a life well-lived?"
                ),
            },
            "care": {
                "name": "Care Ethics",
                "description": "Relationships, empathy, and responsibility to others",
                "prompt": (
                    "Analyze through a Care Ethics lens:\n"
                    "- What relationships are involved and how might they be affected?\n"
                    "- What does genuine care and attention to context reveal?\n"
                    "- Who is vulnerable and what are our responsibilities to them?\n"
                    "- How can connection and empathy guide the response?"
                ),
            },
            "stoic": {
                "name": "Stoic Ethics",
                "description": "Focus on what you control, accept what you cannot",
                "prompt": (
                    "Analyze through a Stoic lens:\n"
                    "- What aspects are within your control vs outside your control?\n"
                    "- What would it mean to focus only on your own choices and character?\n"
                    "- How might this situation be an opportunity for virtue?\n"
                    "- What would radical acceptance look like here?"
                ),
            },
        },
    },
    "strategic": {
        "name": "Strategic",
        "description": "What power and leverage do I have",
        "icon": "🎯",
        "lenses": {
            "leverage": {
                "name": "Leverage Points",
                "description": "Where small actions create large effects",
                "prompt": (
                    "Analyze through a Systems Leverage lens:\n"
                    "- Where are the high-leverage intervention points?\n"
                    "- What small changes could cascade into larger shifts?\n"
                    "- What feedback loops are at play (reinforcing or balancing)?\n"
                    "- Where is effort being wasted on low-leverage activities?"
                ),
            },
            "game_theory": {
                "name": "Game Theory",
                "description": "Strategic interaction and incentives",
                "prompt": (
                    "Analyze through a Game Theory lens:\n"
                    "- Who are the players and what are their incentives?\n"
                    "- Is this a zero-sum, positive-sum, or negative-sum game?\n"
                    "- What are the Nash equilibria and dominant strategies?\n"
                    "- How might cooperation or defection play out over repeated interactions?"
                ),
            },
            "opportunity_cost": {
                "name": "Opportunity Cost",
                "description": "What you give up by choosing this path",
                "prompt": (
                    "Analyze through an Opportunity Cost lens:\n"
                    "- What alternatives are being foregone with each choice?\n"
                    "- What is the true cost when you account for what's sacrificed?\n"
                    "- Are there hidden costs or benefits not immediately visible?\n"
                    "- What would future-you wish present-you had considered?"
                ),
            },
            "second_order": {
                "name": "Second-Order Effects",
                "description": "Consequences of consequences",
                "prompt": (
                    "Analyze through a Second-Order Effects lens:\n"
                    "- What are the immediate first-order effects of each option?\n"
                    "- What second and third-order effects might ripple out?\n"
                    "- What unintended consequences are possible?\n"
                    "- How might the system adapt or respond over time?"
                ),
            },
        },
    },
    "temporal": {
        "name": "Temporal",
        "description": "Where am I in time",
        "icon": "⏳",
        "lenses": {
            "present": {
                "name": "Present / Mindfulness",
                "description": "What is actually happening right now",
                "prompt": (
                    "Analyze through a Present-Moment lens:\n"
                    "- What is actually happening right now, stripped of story?\n"
                    "- What sensations, emotions, and thoughts are present?\n"
                    "- How much of the distress comes from past or future rather than now?\n"
                    "- What does this moment actually require?"
                ),
            },
            "historical": {
                "name": "Historical / Past",
                "description": "How did we get here",
                "prompt": (
                    "Analyze through a Historical lens:\n"
                    "- What events and decisions led to this moment?\n"
                    "- What patterns from the past are repeating?\n"
                    "- What lessons from previous similar situations apply?\n"
                    "- How does understanding the history change the interpretation?"
                ),
            },
            "future": {
                "name": "Future / Strategic Foresight",
                "description": "Where could this lead",
                "prompt": (
                    "Analyze through a Future-Oriented lens:\n"
                    "- What are the possible futures this could lead to?\n"
                    "- What would your future self wish you had done?\n"
                    "- What are the best-case, worst-case, and most-likely scenarios?\n"
                    "- How does this decision compound over time?"
                ),
            },
            "generational": {
                "name": "Generational / Long-Arc",
                "description": "The bigger picture across generations",
                "prompt": (
                    "Analyze through a Generational lens:\n"
                    "- How does this fit into patterns across generations?\n"
                    "- What legacy does this choice create or continue?\n"
                    "- What would matter about this in 10, 50, 100 years?\n"
                    "- How might future generations view this moment?"
                ),
            },
        },
    },
    "epistemological": {
        "name": "Epistemological",
        "description": "How do I know what I think I know",
        "icon": "🔍",
        "lenses": {
            "empirical": {
                "name": "Empirical",
                "description": "What does the evidence actually show",
                "prompt": (
                    "Analyze through an Empirical lens:\n"
                    "- What actual evidence exists for the beliefs involved?\n"
                    "- What would count as proof or disproof?\n"
                    "- Where are assumptions being treated as facts?\n"
                    "- What experiment or observation could test these beliefs?"
                ),
            },
            "skeptical": {
                "name": "Skeptical",
                "description": "Question all assumptions",
                "prompt": (
                    "Analyze through a Skeptical lens:\n"
                    "- What assumptions are being taken for granted?\n"
                    "- What if the opposite were true?\n"
                    "- Where might self-deception or wishful thinking be operating?\n"
                    "- What would a devil's advocate say?"
                ),
            },
            "constructivist": {
                "name": "Constructivist",
                "description": "How is this reality being constructed",
                "prompt": (
                    "Analyze through a Constructivist lens:\n"
                    "- How is this 'reality' being socially constructed?\n"
                    "- What narratives and frames are shaping perception?\n"
                    "- Who benefits from this particular construction of events?\n"
                    "- What alternative constructions are equally valid?"
                ),
            },
        },
    },
    "sociological": {
        "name": "Sociological",
        "description": "What social forces are at play",
        "icon": "👥",
        "lenses": {
            "structural": {
                "name": "Structural / Institutional",
                "description": "Systems, power, and institutions",
                "prompt": (
                    "Analyze through a Structural lens:\n"
                    "- What institutions and systems are shaping this situation?\n"
                    "- Where does power lie and how is it distributed?\n"
                    "- What structural constraints limit the options?\n"
                    "- How do formal and informal rules influence behavior?"
                ),
            },
            "cultural": {
                "name": "Cultural",
                "description": "Norms, values, and shared meanings",
                "prompt": (
                    "Analyze through a Cultural lens:\n"
                    "- What cultural norms and expectations are operating?\n"
                    "- How do shared values shape what's considered acceptable?\n"
                    "- What would this look like in a different cultural context?\n"
                    "- What unspoken cultural scripts are being followed?"
                ),
            },
            "economic": {
                "name": "Economic / Class",
                "description": "Resources, incentives, and material conditions",
                "prompt": (
                    "Analyze through an Economic lens:\n"
                    "- What material and economic factors are at play?\n"
                    "- How do resources and class position shape the options?\n"
                    "- What incentives are driving behavior?\n"
                    "- Who gains and who loses materially?"
                ),
            },
        },
    },
}


# ════════════════════════════════════════════════════════════════════════════
# ANALYSIS PROMPTS
# ════════════════════════════════════════════════════════════════════════════

LENS_ANALYSIS_SYSTEM = """You are a wise, thoughtful guide helping someone understand their situation through different philosophical and psychological lenses.

Your role is to:
- Provide genuine insight, not generic advice
- Be specific to their actual situation
- Reveal what each lens uniquely illuminates
- Speak warmly but directly, like a trusted mentor
- Avoid jargon unless it adds clarity
- Make abstract frameworks concrete and applicable

You are helping them SEE differently, not just THINK differently. Each lens should feel like putting on new glasses and suddenly noticing what was invisible before."""

LENS_ANALYSIS_USER_TEMPLATE = """The person is reflecting on this situation:

"{situation}"

Analyze this through the following lens(es):

{lens_prompts}

For each lens, provide:
1. What this lens reveals about the situation
2. Questions it raises
3. Potential insights or reframes

Keep each lens analysis focused (2-3 paragraphs). Be specific to their situation, not generic.

After analyzing through each lens, provide a brief SYNTHESIS that integrates the key insights into a coherent understanding and suggests a path forward."""

LENS_AUDIO_SYSTEM = """You are creating a reflective audio piece - like a wise friend helping someone think through a situation.

Your voice should be:
- Warm and conversational, not clinical
- Thoughtful, with natural pauses for the listener to absorb
- Personal - speak directly to "you"
- Gently challenging where appropriate
- Ultimately supportive and clarifying

This is inner work, not external learning. The tone should feel like a late-night conversation with someone who truly sees you.

Structure:
1. Brief acknowledgment of the situation
2. Walk through each lens naturally (not as labeled sections)
3. Weave insights together
4. End with clarity and a sense of possibility"""

LENS_AUDIO_USER_TEMPLATE = """Create a reflective audio script for someone thinking through this situation:

"{situation}"

Guide them through these perspectives:

{lens_prompts}

The script should be {word_count} words for approximately {minutes} minutes of audio.

Write it as a flowing narrative, not separate sections. Let the lenses inform the reflection naturally without explicitly naming them. The goal is insight and clarity, not philosophy lecture.

End with a synthesis that leaves them with both understanding and a sense of what to do next."""


# ════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ════════════════════════════════════════════════════════════════════════════

def get_all_categories() -> list[dict]:
    """Return list of category info for UI display."""
    return [
        {
            "id": cat_id,
            "name": cat["name"],
            "description": cat["description"],
            "icon": cat["icon"],
            "lens_count": len(cat["lenses"]),
        }
        for cat_id, cat in LENS_CATEGORIES.items()
    ]


def get_lenses_for_category(category_id: str) -> list[dict]:
    """Return list of lenses in a category for UI display."""
    if category_id not in LENS_CATEGORIES:
        return []

    category = LENS_CATEGORIES[category_id]
    return [
        {
            "id": lens_id,
            "name": lens["name"],
            "description": lens["description"],
            "category_id": category_id,
            "category_name": category["name"],
        }
        for lens_id, lens in category["lenses"].items()
    ]


def get_lens_prompts(selected_lenses: list[tuple[str, str]]) -> str:
    """
    Build combined lens prompts for analysis.

    Args:
        selected_lenses: List of (category_id, lens_id) tuples

    Returns:
        Combined prompt string for all selected lenses
    """
    prompts = []
    for cat_id, lens_id in selected_lenses:
        if cat_id in LENS_CATEGORIES and lens_id in LENS_CATEGORIES[cat_id]["lenses"]:
            lens = LENS_CATEGORIES[cat_id]["lenses"][lens_id]
            prompts.append(f"### {lens['name']}\n{lens['prompt']}")

    return "\n\n".join(prompts)


def get_lens_display_name(category_id: str, lens_id: str) -> str:
    """Get human-readable name for a lens."""
    if category_id in LENS_CATEGORIES and lens_id in LENS_CATEGORIES[category_id]["lenses"]:
        cat = LENS_CATEGORIES[category_id]
        lens = cat["lenses"][lens_id]
        return f"{cat['icon']} {lens['name']}"
    return "Unknown Lens"


# Suggested helper examples for the UI
SITUATION_EXAMPLES = [
    "Choosing between two job offers",
    "Conflict with a close friend",
    "Feeling stuck in my career",
    "A relationship that's become difficult",
    "A decision I keep avoiding",
    "Something I regret doing",
    "Uncertainty about a major life change",
]

# Default lens recommendation if user doesn't choose
DEFAULT_LENSES = [
    ("psychological", "cognitive"),
    ("strategic", "opportunity_cost"),
    ("ethical", "virtue"),
]
