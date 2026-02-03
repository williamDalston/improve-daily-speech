"""
Sovereign Mind - A cognitive operating system for self-development.

The full architecture:
1. Lens Layer (Perception) - 7 categories, 34 lenses
2. Practice Modules (Training) - Mental gyms for specific skills
3. Ritual Layer (Structure) - Morning/Midday/Evening practices
4. Memory Vault (Continuity) - Patterns, insights, progress
5. Adaptive Coach (Evolution) - Personalized guidance
"""

# ══════════════════════════════════════════════════════════════════════════════
# 1. THE LENS LAYER - 34 Lenses Across 7 Categories
# ══════════════════════════════════════════════════════════════════════════════

LENS_CATEGORIES = {
    "ontological": {
        "name": "Ontological",
        "icon": "🌌",
        "question": "What is the nature of reality here?",
        "description": "How you perceive existence itself",
    },
    "epistemological": {
        "name": "Epistemological",
        "icon": "🔍",
        "question": "How do I know what I know?",
        "description": "How you validate truth and knowledge",
    },
    "psychological": {
        "name": "Psychological",
        "icon": "🧠",
        "question": "What is my mind doing?",
        "description": "How your internal filters shape perception",
    },
    "ethical": {
        "name": "Ethical",
        "icon": "⚖️",
        "question": "What should I do?",
        "description": "Frameworks for right action",
    },
    "sociological": {
        "name": "Sociological",
        "icon": "👥",
        "question": "What forces shape this?",
        "description": "How society and culture influence reality",
    },
    "temporal": {
        "name": "Temporal",
        "icon": "⏳",
        "question": "Where am I in time?",
        "description": "Past, present, future perspectives",
    },
    "strategic": {
        "name": "Strategic",
        "icon": "🎯",
        "question": "What power do I have?",
        "description": "Agency, leverage, and action",
    },
}

SOVEREIGN_LENSES = {
    # ─────────────────────────────────────────────────────────────
    # ONTOLOGICAL - "What is Reality?"
    # ─────────────────────────────────────────────────────────────
    "material": {
        "category": "ontological",
        "name": "Material",
        "icon": "🔬",
        "description": "Reality is physical, measurable, biological",
        "prompt": (
            "View this through a materialist lens:\n"
            "- What are the physical, measurable aspects?\n"
            "- What biological or neurological factors are at play?\n"
            "- What would a scientist observe and measure?\n"
            "- Strip away abstractions — what's the material reality?"
        ),
    },
    "idealist": {
        "category": "ontological",
        "name": "Idealist",
        "icon": "💭",
        "description": "Reality is mental, consciousness-based",
        "prompt": (
            "View this through an idealist lens:\n"
            "- How does consciousness shape this experience?\n"
            "- What role do mental constructs and beliefs play?\n"
            "- Is the 'reality' here created by perception?\n"
            "- What would change if you changed your mind about it?"
        ),
    },
    "process": {
        "category": "ontological",
        "name": "Process",
        "icon": "🌊",
        "description": "Reality is change, not static objects",
        "prompt": (
            "View this through a process lens:\n"
            "- What is changing, becoming, evolving?\n"
            "- Is this a moment in a larger flow?\n"
            "- What was this before? What will it become?\n"
            "- See the verb, not the noun — what's happening?"
        ),
    },
    "existential": {
        "category": "ontological",
        "name": "Existential",
        "icon": "🚪",
        "description": "Reality is defined by meaning and choice",
        "prompt": (
            "View this through an existential lens:\n"
            "- What meaning are you assigning to this?\n"
            "- What choices exist? What freedoms?\n"
            "- How does this relate to your authentic self?\n"
            "- What responsibility comes with this situation?"
        ),
    },
    "systems_onto": {
        "category": "ontological",
        "name": "Systems",
        "icon": "🕸️",
        "description": "Reality is networks and interdependence",
        "prompt": (
            "View this through a systems ontology lens:\n"
            "- What larger system is this part of?\n"
            "- What connections and dependencies exist?\n"
            "- How do the parts create the whole?\n"
            "- What emerges from the interactions?"
        ),
    },

    # ─────────────────────────────────────────────────────────────
    # EPISTEMOLOGICAL - "How Do I Know?"
    # ─────────────────────────────────────────────────────────────
    "empiricism": {
        "category": "epistemological",
        "name": "Empiricism",
        "icon": "🧪",
        "description": "Knowledge from sensory evidence",
        "prompt": (
            "Apply empiricist thinking:\n"
            "- What evidence can be directly observed?\n"
            "- What experiments could test this?\n"
            "- What data supports or contradicts this?\n"
            "- Separate observation from interpretation."
        ),
    },
    "rationalism": {
        "category": "epistemological",
        "name": "Rationalism",
        "icon": "📐",
        "description": "Knowledge from logic and reason",
        "prompt": (
            "Apply rationalist thinking:\n"
            "- What can be deduced through pure logic?\n"
            "- What are the premises? Are they valid?\n"
            "- What follows necessarily from what we know?\n"
            "- Check for logical fallacies and gaps."
        ),
    },
    "pragmatism": {
        "category": "epistemological",
        "name": "Pragmatism",
        "icon": "🔧",
        "description": "Truth is what works in practice",
        "prompt": (
            "Apply pragmatist thinking:\n"
            "- What actually works in practice?\n"
            "- What are the real-world consequences?\n"
            "- Does this belief produce useful results?\n"
            "- Judge by outcomes, not theories."
        ),
    },
    "constructivism": {
        "category": "epistemological",
        "name": "Constructivism",
        "icon": "🏗️",
        "description": "Knowledge is socially constructed",
        "prompt": (
            "Apply constructivist thinking:\n"
            "- Who constructed this 'knowledge'?\n"
            "- What social context shaped it?\n"
            "- Whose perspective is centered? Whose is missing?\n"
            "- How might different groups see this differently?"
        ),
    },
    "phenomenology": {
        "category": "epistemological",
        "name": "Phenomenology",
        "icon": "👁️",
        "description": "Lived experience as truth",
        "prompt": (
            "Apply phenomenological thinking:\n"
            "- What is the lived experience of this?\n"
            "- Bracket your assumptions — what appears?\n"
            "- How does it feel from the inside?\n"
            "- Honor subjective experience as valid data."
        ),
    },
    "skepticism": {
        "category": "epistemological",
        "name": "Skepticism",
        "icon": "❓",
        "description": "Question all assumptions",
        "prompt": (
            "Apply skeptical thinking:\n"
            "- What am I assuming without evidence?\n"
            "- What would prove this wrong?\n"
            "- Am I being fooled? By whom? How?\n"
            "- What do I really know vs. believe?"
        ),
    },

    # ─────────────────────────────────────────────────────────────
    # PSYCHOLOGICAL - "How Does My Mind Work?"
    # ─────────────────────────────────────────────────────────────
    "cognitive": {
        "category": "psychological",
        "name": "Cognitive (CBT)",
        "icon": "💡",
        "description": "Thoughts → Emotions → Behavior",
        "prompt": (
            "Apply cognitive-behavioral analysis:\n"
            "- What thought triggered this feeling?\n"
            "- Is the thought accurate or distorted?\n"
            "- What cognitive biases might be at play?\n"
            "- What alternative thought would serve better?"
        ),
    },
    "jungian": {
        "category": "psychological",
        "name": "Jungian/Archetypal",
        "icon": "🎭",
        "description": "Shadow, archetypes, symbols",
        "prompt": (
            "Apply Jungian analysis:\n"
            "- What archetype is activated here?\n"
            "- What shadow material might be present?\n"
            "- What symbols or myths does this echo?\n"
            "- What does the unconscious want you to see?"
        ),
    },
    "behavioral": {
        "category": "psychological",
        "name": "Behavioral",
        "icon": "🔄",
        "description": "Stimulus → Response patterns",
        "prompt": (
            "Apply behavioral analysis:\n"
            "- What stimulus triggers this response?\n"
            "- What reinforcement maintains this pattern?\n"
            "- What conditioning shaped this?\n"
            "- What new associations could be formed?"
        ),
    },
    "attachment": {
        "category": "psychological",
        "name": "Attachment",
        "icon": "🔗",
        "description": "Relational templates from early life",
        "prompt": (
            "Apply attachment theory:\n"
            "- What relational pattern is activated?\n"
            "- How does this echo early relationships?\n"
            "- Is this secure, anxious, or avoidant?\n"
            "- What would a secure response look like?"
        ),
    },
    "positive_psych": {
        "category": "psychological",
        "name": "Positive Psychology",
        "icon": "🌟",
        "description": "Strengths, flourishing, meaning",
        "prompt": (
            "Apply positive psychology:\n"
            "- What strengths can be leveraged here?\n"
            "- How does this connect to meaning/purpose?\n"
            "- What would flourishing look like?\n"
            "- Find the growth opportunity in the challenge."
        ),
    },

    # ─────────────────────────────────────────────────────────────
    # ETHICAL - "What Should I Do?"
    # ─────────────────────────────────────────────────────────────
    "utilitarian": {
        "category": "ethical",
        "name": "Utilitarian",
        "icon": "📊",
        "description": "Maximize overall good",
        "prompt": (
            "Apply utilitarian ethics:\n"
            "- What action produces the most good?\n"
            "- Who is affected and how?\n"
            "- Calculate the net benefit vs. harm.\n"
            "- Consider long-term consequences."
        ),
    },
    "deontological": {
        "category": "ethical",
        "name": "Deontological",
        "icon": "📜",
        "description": "Duty, rules, principles",
        "prompt": (
            "Apply deontological ethics:\n"
            "- What duty or principle applies here?\n"
            "- Is this action universalizable?\n"
            "- Are you treating people as ends, not means?\n"
            "- What would the moral law demand?"
        ),
    },
    "virtue": {
        "category": "ethical",
        "name": "Virtue Ethics",
        "icon": "🏛️",
        "description": "Character and habits",
        "prompt": (
            "Apply virtue ethics:\n"
            "- What would a person of good character do?\n"
            "- Which virtues are relevant? (courage, wisdom, justice...)\n"
            "- What habit does this action reinforce?\n"
            "- Who do you become by choosing this?"
        ),
    },
    "care": {
        "category": "ethical",
        "name": "Care Ethics",
        "icon": "💝",
        "description": "Relationships and empathy",
        "prompt": (
            "Apply care ethics:\n"
            "- Who needs care in this situation?\n"
            "- What would compassion require?\n"
            "- How do relationships factor in?\n"
            "- What does the most vulnerable party need?"
        ),
    },
    "stoic_ethics": {
        "category": "ethical",
        "name": "Stoic Ethics",
        "icon": "🏛️",
        "description": "Focus on what you control",
        "prompt": (
            "Apply Stoic ethics:\n"
            "- What is within your control? Outside it?\n"
            "- What would virtue demand here?\n"
            "- How would you advise a friend in this situation?\n"
            "- Accept what you cannot change. Act on what you can."
        ),
    },

    # ─────────────────────────────────────────────────────────────
    # SOCIOLOGICAL - "How Does Society Shape This?"
    # ─────────────────────────────────────────────────────────────
    "structural": {
        "category": "sociological",
        "name": "Structural",
        "icon": "🏢",
        "description": "Institutions, laws, power",
        "prompt": (
            "Apply structural analysis:\n"
            "- What institutions shape this situation?\n"
            "- What power dynamics are at play?\n"
            "- What systemic forces constrain or enable?\n"
            "- Who benefits from the current structure?"
        ),
    },
    "cultural": {
        "category": "sociological",
        "name": "Cultural Relativism",
        "icon": "🌍",
        "description": "Norms depend on culture",
        "prompt": (
            "Apply cultural relativist thinking:\n"
            "- What cultural norms are operating here?\n"
            "- How would other cultures see this?\n"
            "- What assumptions are culturally specific?\n"
            "- Suspend judgment — understand the context."
        ),
    },
    "symbolic": {
        "category": "sociological",
        "name": "Symbolic Interactionism",
        "icon": "🗣️",
        "description": "Meaning through interaction",
        "prompt": (
            "Apply symbolic interactionist thinking:\n"
            "- What meanings are being negotiated?\n"
            "- How do social interactions create reality?\n"
            "- What symbols and labels are in play?\n"
            "- How does identity emerge from interaction?"
        ),
    },
    "economic": {
        "category": "sociological",
        "name": "Economic/Class",
        "icon": "💰",
        "description": "Incentives and resources",
        "prompt": (
            "Apply economic/class analysis:\n"
            "- What are the material interests at stake?\n"
            "- Who has resources? Who lacks them?\n"
            "- What incentives shape behavior?\n"
            "- Follow the money — who benefits?"
        ),
    },

    # ─────────────────────────────────────────────────────────────
    # TEMPORAL - "Where Am I in Time?"
    # ─────────────────────────────────────────────────────────────
    "historical": {
        "category": "temporal",
        "name": "Historical",
        "icon": "📜",
        "description": "Lessons from the past",
        "prompt": (
            "Apply historical perspective:\n"
            "- What led to this moment?\n"
            "- What historical patterns apply?\n"
            "- What can we learn from past examples?\n"
            "- How will history judge this?"
        ),
    },
    "present": {
        "category": "temporal",
        "name": "Present/Mindful",
        "icon": "🧘",
        "description": "Full presence in the now",
        "prompt": (
            "Apply present-moment awareness:\n"
            "- What is actually happening right now?\n"
            "- Set aside past stories and future worries.\n"
            "- What do your senses tell you?\n"
            "- What does this moment require?"
        ),
    },
    "future": {
        "category": "temporal",
        "name": "Future/Strategic",
        "icon": "🔮",
        "description": "Long-term consequences",
        "prompt": (
            "Apply future-oriented thinking:\n"
            "- What are the long-term consequences?\n"
            "- What future are you creating?\n"
            "- What will you wish you had done?\n"
            "- Think 10 years ahead — what matters?"
        ),
    },
    "generational": {
        "category": "temporal",
        "name": "Generational",
        "icon": "👶👴",
        "description": "Multi-generational perspective",
        "prompt": (
            "Apply generational thinking:\n"
            "- What would your ancestors say?\n"
            "- What are you passing to future generations?\n"
            "- How does this serve the long arc of family/humanity?\n"
            "- Think in decades and centuries, not days."
        ),
    },

    # ─────────────────────────────────────────────────────────────
    # STRATEGIC - "What Power Do I Have?"
    # ─────────────────────────────────────────────────────────────
    "locus": {
        "category": "strategic",
        "name": "Locus of Control",
        "icon": "🎛️",
        "description": "Internal vs. external control",
        "prompt": (
            "Apply locus of control analysis:\n"
            "- What can you directly control?\n"
            "- What can you influence but not control?\n"
            "- What is completely outside your control?\n"
            "- Focus energy on what's within your power."
        ),
    },
    "game_theory": {
        "category": "strategic",
        "name": "Game Theory",
        "icon": "♟️",
        "description": "Strategic interaction",
        "prompt": (
            "Apply game theory thinking:\n"
            "- Who are the players? What are their interests?\n"
            "- What are the possible moves?\n"
            "- Is this zero-sum or positive-sum?\n"
            "- What strategy maximizes your position?"
        ),
    },
    "leverage": {
        "category": "strategic",
        "name": "Leverage Points",
        "icon": "⚡",
        "description": "High-impact intervention points",
        "prompt": (
            "Apply leverage thinking:\n"
            "- Where would small effort create big change?\n"
            "- What's the 20% that drives 80% of results?\n"
            "- What constraints could be released?\n"
            "- Find the fulcrum — where is the power?"
        ),
    },
    "opportunity_cost": {
        "category": "strategic",
        "name": "Opportunity Cost",
        "icon": "⚖️",
        "description": "What you give up by choosing",
        "prompt": (
            "Apply opportunity cost thinking:\n"
            "- What are you NOT doing by doing this?\n"
            "- What's the next best alternative?\n"
            "- Is this the highest value use of resources?\n"
            "- Count the hidden costs of every choice."
        ),
    },
    "second_order": {
        "category": "strategic",
        "name": "Second-Order Effects",
        "icon": "🔗",
        "description": "Consequences of consequences",
        "prompt": (
            "Apply second-order thinking:\n"
            "- And then what? What happens after that?\n"
            "- What are the consequences of the consequences?\n"
            "- What feedback loops might this trigger?\n"
            "- Think 3 moves ahead."
        ),
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# 2. PRACTICE MODULES - Mental Gyms
# ══════════════════════════════════════════════════════════════════════════════

PRACTICE_MODULES = {
    "emotional_dojo": {
        "name": "Emotional Mastery Dojo",
        "icon": "🥋",
        "description": "Train your emotional intelligence",
        "exercises": [
            {
                "name": "Emotion Naming",
                "prompt": (
                    "Precisely name what you're feeling. Not just 'bad' — is it:\n"
                    "frustrated, disappointed, anxious, sad, overwhelmed, resentful?\n"
                    "Use the most specific word. Why does that word fit?"
                ),
            },
            {
                "name": "Emotion → Thought → Action Mapping",
                "prompt": (
                    "Trace the chain:\n"
                    "1. What emotion am I feeling?\n"
                    "2. What thought triggered it?\n"
                    "3. What action does it push me toward?\n"
                    "4. Is that action wise?"
                ),
            },
            {
                "name": "Narrative Reframe",
                "prompt": (
                    "Tell the story of this situation three ways:\n"
                    "1. As a victim (this was done TO me)\n"
                    "2. As an agent (I contributed to this)\n"
                    "3. As a learner (this is teaching me...)\n"
                    "Which frame serves you best?"
                ),
            },
        ],
    },
    "cognitive_lab": {
        "name": "Cognitive Clarity Lab",
        "icon": "🔬",
        "description": "Sharpen your thinking",
        "exercises": [
            {
                "name": "Bias Detection",
                "prompt": (
                    "Scan for cognitive biases in your current thinking:\n"
                    "- Confirmation bias (seeking evidence for what I already believe)\n"
                    "- Sunk cost fallacy (continuing because I've invested)\n"
                    "- Availability heuristic (overweighting recent/vivid examples)\n"
                    "- Anchoring (stuck on first number/idea)\n"
                    "Which might be active right now?"
                ),
            },
            {
                "name": "Assumption Audit",
                "prompt": (
                    "List 5 assumptions you're making about this situation.\n"
                    "For each: How confident are you (1-10)?\n"
                    "What would prove it wrong?\n"
                    "Which assumption is most likely to be false?"
                ),
            },
            {
                "name": "Steel Man / Straw Man",
                "prompt": (
                    "Take the opposing view:\n"
                    "1. First, make the WEAKEST version of it (straw man)\n"
                    "2. Now make the STRONGEST version (steel man)\n"
                    "3. Attack your OWN position with the steel man\n"
                    "What do you learn?"
                ),
            },
        ],
    },
    "empathy_gym": {
        "name": "Empathy Perspective Gym",
        "icon": "🤝",
        "description": "Expand your perspective-taking ability",
        "exercises": [
            {
                "name": "Role Swap",
                "prompt": (
                    "Fully inhabit the other person's perspective:\n"
                    "- What do they see that I don't?\n"
                    "- What pressures are they under?\n"
                    "- What do they fear? Hope for?\n"
                    "- How does this situation look from their shoes?"
                ),
            },
            {
                "name": "Argue the Opposite",
                "prompt": (
                    "Make the best possible case AGAINST your current position.\n"
                    "Argue it sincerely, as if you believed it.\n"
                    "What's the strongest point? Does it change anything?"
                ),
            },
            {
                "name": "Cultural Lens Switch",
                "prompt": (
                    "How would someone from a very different culture see this?\n"
                    "Consider: collectivist vs individualist, hierarchical vs egalitarian,\n"
                    "different religious traditions, different historical experiences.\n"
                    "What do they see that you're blind to?"
                ),
            },
        ],
    },
    "resilience_forge": {
        "name": "Stoic Resilience Forge",
        "icon": "🔥",
        "description": "Build mental toughness",
        "exercises": [
            {
                "name": "Control Sort",
                "prompt": (
                    "Divide this situation into three lists:\n"
                    "1. FULLY IN MY CONTROL (thoughts, actions, effort)\n"
                    "2. PARTIALLY IN MY CONTROL (influence, not guarantee)\n"
                    "3. COMPLETELY OUTSIDE MY CONTROL\n"
                    "Release the third. Focus on the first."
                ),
            },
            {
                "name": "Negative Visualization (Premeditatio Malorum)",
                "prompt": (
                    "Imagine the worst case scenario in vivid detail.\n"
                    "What exactly would happen? How would you cope?\n"
                    "What would you still have? What would remain?\n"
                    "Now: Is the worst case survivable? Are you ready for it?"
                ),
            },
            {
                "name": "Amor Fati",
                "prompt": (
                    "What if this difficulty is exactly what you need?\n"
                    "How is this challenge perfectly designed to teach you something?\n"
                    "What strength is being forged? What weakness exposed?\n"
                    "Love your fate — embrace the obstacle as the way."
                ),
            },
        ],
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# 3. RITUAL LAYER - Daily Structure
# ══════════════════════════════════════════════════════════════════════════════

DAILY_RITUALS = {
    "morning": {
        "name": "Morning Intention",
        "icon": "🌅",
        "time": "Morning",
        "duration": "5-10 min",
        "prompts": [
            "What is your primary intention for today?",
            "What lens will you practice seeing through today?",
            "What 3 things MUST happen for today to be a success?",
            "What obstacle might arise? How will you respond?",
        ],
    },
    "midday": {
        "name": "Midday Check-in",
        "icon": "☀️",
        "time": "Midday",
        "duration": "2-3 min",
        "prompts": [
            "How am I feeling right now? (Name it precisely)",
            "Am I on track with my intention?",
            "What needs to shift for the afternoon?",
            "Quick reframe: What story am I telling myself?",
        ],
    },
    "evening": {
        "name": "Evening Reflection",
        "icon": "🌙",
        "time": "Evening",
        "duration": "10-15 min",
        "prompts": [
            "What went well today? What am I grateful for?",
            "What could have gone better? What did I learn?",
            "Did I live according to my values today?",
            "What will I do differently tomorrow?",
        ],
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# 4. INSIGHT PATTERNS - Things to Track
# ══════════════════════════════════════════════════════════════════════════════

INSIGHT_PATTERNS = {
    "triggers": "Recurring situations that provoke strong reactions",
    "distortions": "Cognitive distortions you frequently fall into",
    "strengths": "Perspectives and practices that serve you well",
    "growth_edges": "Areas where you're consistently challenged",
    "values": "Core values that emerge from your reflections",
    "blindspots": "Perspectives you rarely consider",
}


# ══════════════════════════════════════════════════════════════════════════════
# 5. IDENTITY LAYER - "Who Am I Choosing to Become?"
# ══════════════════════════════════════════════════════════════════════════════

IDENTITY_MODULES = {
    "values_hierarchy": {
        "name": "Values Hierarchy",
        "icon": "🧭",
        "description": "Clarify what matters most",
        "exercises": [
            {
                "name": "Values Excavation",
                "prompt": (
                    "Identify your core values through reflection:\n"
                    "1. When have you felt most alive and fulfilled?\n"
                    "2. What angers you most about the world?\n"
                    "3. What would you do if you had unlimited resources?\n"
                    "4. What do you want people to say at your funeral?\n"
                    "From these answers, extract 5-7 core values."
                ),
            },
            {
                "name": "Values Ranking",
                "prompt": (
                    "Rank your values by forcing hard choices:\n"
                    "If you had to choose between [Value A] and [Value B],\n"
                    "which would you sacrifice?\n"
                    "Work through all pairs until you have a hierarchy.\n"
                    "What does this order reveal about who you are?"
                ),
            },
            {
                "name": "Values Audit",
                "prompt": (
                    "Compare your stated values to your actual behavior:\n"
                    "- Look at your calendar: What does your time say you value?\n"
                    "- Look at your bank statement: What does your money say?\n"
                    "- Look at your relationships: Who gets your attention?\n"
                    "Where are the gaps between stated and revealed values?"
                ),
            },
        ],
    },
    "life_archetypes": {
        "name": "Life Archetypes",
        "icon": "🎭",
        "description": "Discover your guiding myths",
        "exercises": [
            {
                "name": "Archetype Identification",
                "prompt": (
                    "Which archetypes resonate with your life story?\n"
                    "- The Hero (overcoming obstacles)\n"
                    "- The Sage (seeking wisdom)\n"
                    "- The Creator (making things)\n"
                    "- The Caregiver (nurturing others)\n"
                    "- The Explorer (seeking freedom)\n"
                    "- The Ruler (seeking control)\n"
                    "- The Magician (transformation)\n"
                    "- The Rebel (breaking rules)\n"
                    "Which 2-3 archetypes feel most like 'you'? Why?"
                ),
            },
            {
                "name": "Shadow Archetype",
                "prompt": (
                    "Every archetype has a shadow side:\n"
                    "- Hero → Tyrant\n"
                    "- Sage → Detached Cynic\n"
                    "- Creator → Perfectionist\n"
                    "- Caregiver → Martyr\n"
                    "Which shadow tendencies do you recognize in yourself?\n"
                    "How do they show up?"
                ),
            },
        ],
    },
    "north_star": {
        "name": "North Star Statement",
        "icon": "⭐",
        "description": "Define your guiding purpose",
        "exercises": [
            {
                "name": "Purpose Distillation",
                "prompt": (
                    "Craft a one-sentence North Star:\n"
                    "I exist to [VERB] [WHAT] for [WHOM] so that [IMPACT].\n\n"
                    "Example: 'I exist to illuminate hidden wisdom for seekers\n"
                    "so that they can navigate life with clarity.'\n\n"
                    "Write 5 versions. Which one makes you feel most alive?"
                ),
            },
            {
                "name": "Obituary Exercise",
                "prompt": (
                    "Write your ideal obituary — 200 words.\n"
                    "Not what you've done, but what you want to have done.\n"
                    "What will you be remembered for?\n"
                    "What impact will you have left?\n"
                    "Now: What must change to make this true?"
                ),
            },
        ],
    },
    "character_development": {
        "name": "Character Development",
        "icon": "🌱",
        "description": "Traits under active cultivation",
        "exercises": [
            {
                "name": "Virtue Selection",
                "prompt": (
                    "Choose 3 virtues to develop this season:\n"
                    "- Courage, Patience, Discipline, Compassion\n"
                    "- Wisdom, Justice, Temperance, Integrity\n"
                    "- Creativity, Humility, Gratitude, Resilience\n\n"
                    "For each: What does it look like in daily action?\n"
                    "What's one thing you'll do this week to practice it?"
                ),
            },
            {
                "name": "Character Gap Analysis",
                "prompt": (
                    "Compare who you are vs. who you want to be:\n"
                    "1. Describe your ideal self in 5 adjectives.\n"
                    "2. Describe your current self honestly in 5 adjectives.\n"
                    "3. What's the biggest gap?\n"
                    "4. What's one small habit that would close it?"
                ),
            },
        ],
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# 6. SOCIAL/RELATIONAL LAYER - "How Do I Exist With Others?"
# ══════════════════════════════════════════════════════════════════════════════

SOCIAL_MODULES = {
    "conflict_resolution": {
        "name": "Conflict Resolution",
        "icon": "🤝",
        "description": "Navigate disagreements skillfully",
        "exercises": [
            {
                "name": "Conflict Mapping",
                "prompt": (
                    "Analyze a current conflict:\n"
                    "1. What does each party want? (surface level)\n"
                    "2. What does each party need? (deeper level)\n"
                    "3. What are the shared interests beneath the positions?\n"
                    "4. What would a 'both win' outcome look like?\n"
                    "5. What am I contributing to the conflict?"
                ),
            },
            {
                "name": "Pre-Mortem on Difficult Conversations",
                "prompt": (
                    "Before a hard conversation:\n"
                    "1. What's my goal? (inform, persuade, understand, repair?)\n"
                    "2. What might go wrong? How will I respond?\n"
                    "3. What's their perspective? What are they afraid of?\n"
                    "4. What's the minimum acceptable outcome?\n"
                    "5. What phrase will I use to de-escalate if needed?"
                ),
            },
        ],
    },
    "communication_style": {
        "name": "Communication Style",
        "icon": "💬",
        "description": "Understand your relational patterns",
        "exercises": [
            {
                "name": "Communication Audit",
                "prompt": (
                    "Reflect on your communication patterns:\n"
                    "- Do you tend to avoid, accommodate, compete, or collaborate?\n"
                    "- Do you listen to understand or to respond?\n"
                    "- Do you express needs directly or hint?\n"
                    "- Do you take responsibility or deflect?\n"
                    "What pattern causes you the most trouble?"
                ),
            },
            {
                "name": "Nonviolent Communication Practice",
                "prompt": (
                    "Reframe a complaint using NVC structure:\n"
                    "1. OBSERVATION: 'When I see/hear [specific behavior]...'\n"
                    "2. FEELING: 'I feel [emotion]...'\n"
                    "3. NEED: 'Because I need [universal need]...'\n"
                    "4. REQUEST: 'Would you be willing to [specific ask]?'\n"
                    "Practice with a real situation."
                ),
            },
        ],
    },
    "boundaries": {
        "name": "Boundary Setting",
        "icon": "🚧",
        "description": "Define and defend your limits",
        "exercises": [
            {
                "name": "Boundary Inventory",
                "prompt": (
                    "Assess your current boundaries:\n"
                    "- Where do you say 'yes' when you mean 'no'?\n"
                    "- Who takes more than they give?\n"
                    "- What requests trigger resentment?\n"
                    "- What would you stop tolerating if you respected yourself more?\n"
                    "Choose one boundary to strengthen this week."
                ),
            },
            {
                "name": "Boundary Script",
                "prompt": (
                    "Write a boundary statement for a specific situation:\n"
                    "'I'm not available for [behavior/request] because [reason].\n"
                    "What I need instead is [alternative].\n"
                    "If this continues, I will [consequence].'\n"
                    "Practice saying it out loud until it feels natural."
                ),
            },
        ],
    },
    "perspective_swap": {
        "name": "Perspective Swap",
        "icon": "🔄",
        "description": "See through others' eyes",
        "exercises": [
            {
                "name": "The Other's Story",
                "prompt": (
                    "Choose someone you're in conflict with.\n"
                    "Write their version of events — as they would tell it.\n"
                    "Include: their fears, their pressures, their good intentions.\n"
                    "What might you be missing from your own perspective?"
                ),
            },
            {
                "name": "Conversation Rehearsal",
                "prompt": (
                    "Mentally rehearse an upcoming difficult conversation:\n"
                    "1. What will you say to open?\n"
                    "2. What objection might they raise? Your response?\n"
                    "3. What's the worst they could say? How will you stay calm?\n"
                    "4. What's your closing? What do you want them to remember?"
                ),
            },
        ],
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# 7. EMBODIMENT LAYER - "How Does the Body Participate?"
# ══════════════════════════════════════════════════════════════════════════════

EMBODIMENT_MODULES = {
    "breath_work": {
        "name": "Breath Regulation",
        "icon": "🌬️",
        "description": "Use breath to shift state",
        "exercises": [
            {
                "name": "Box Breathing (Calm)",
                "prompt": (
                    "For instant calm:\n"
                    "- Inhale for 4 counts\n"
                    "- Hold for 4 counts\n"
                    "- Exhale for 4 counts\n"
                    "- Hold for 4 counts\n"
                    "Repeat 4-8 cycles. Notice the shift in your nervous system."
                ),
            },
            {
                "name": "Physiological Sigh (Quick Reset)",
                "prompt": (
                    "The fastest way to calm down:\n"
                    "- Double inhale through nose (one short, one long)\n"
                    "- Long exhale through mouth\n"
                    "Do this 2-3 times. Your heart rate will drop immediately.\n"
                    "Use before stressful situations."
                ),
            },
            {
                "name": "Energizing Breath",
                "prompt": (
                    "For alertness and energy:\n"
                    "- 30 deep breaths (inhale fully, exhale quickly)\n"
                    "- Hold after exhale as long as comfortable\n"
                    "- Deep breath in, hold 15 seconds\n"
                    "Notice the tingling, the energy. Use before important tasks."
                ),
            },
        ],
    },
    "somatic_awareness": {
        "name": "Somatic Awareness",
        "icon": "🧘",
        "description": "Listen to body wisdom",
        "exercises": [
            {
                "name": "Body Scan",
                "prompt": (
                    "Scan from head to toe:\n"
                    "- Where do you feel tension?\n"
                    "- Where do you feel ease?\n"
                    "- Is there pain, numbness, warmth, cold?\n"
                    "- What emotions seem stored in specific areas?\n"
                    "Don't fix anything. Just notice."
                ),
            },
            {
                "name": "Emotion Location",
                "prompt": (
                    "When you feel a strong emotion:\n"
                    "- Where in your body do you feel it?\n"
                    "- What's its size, shape, color, texture?\n"
                    "- If it could speak, what would it say?\n"
                    "- What does it need?\n"
                    "The body often knows before the mind."
                ),
            },
        ],
    },
    "stress_release": {
        "name": "Stress Release",
        "icon": "💆",
        "description": "Discharge accumulated tension",
        "exercises": [
            {
                "name": "Shake It Off",
                "prompt": (
                    "Animals shake after stress. So should we.\n"
                    "- Stand and shake your whole body for 2-3 minutes\n"
                    "- Let it be messy, weird, uncoordinated\n"
                    "- Make sounds if you want\n"
                    "Then stand still. Notice the aliveness."
                ),
            },
            {
                "name": "Progressive Muscle Relaxation",
                "prompt": (
                    "Tense and release each muscle group:\n"
                    "- Feet: squeeze 5 sec, release\n"
                    "- Calves, thighs, glutes, abs, chest\n"
                    "- Hands, arms, shoulders, face\n"
                    "Hold tension, then let it go completely.\n"
                    "Notice the difference between tension and relaxation."
                ),
            },
        ],
    },
    "energy_state": {
        "name": "Energy State Management",
        "icon": "⚡",
        "description": "Optimize your physical capacity",
        "exercises": [
            {
                "name": "Energy Audit",
                "prompt": (
                    "Track your energy for one day:\n"
                    "- When are you sharpest? (morning, afternoon, evening)\n"
                    "- What activities drain you? Energize you?\n"
                    "- What's your sleep like? Food? Movement?\n"
                    "Design tomorrow to match your energy patterns."
                ),
            },
            {
                "name": "State Shift Protocol",
                "prompt": (
                    "When you need to shift from low to high energy:\n"
                    "1. Move: 20 jumping jacks or a quick walk\n"
                    "2. Cold water on face/wrists\n"
                    "3. Upbeat music for 2 minutes\n"
                    "4. Power pose: hands on hips, chest open, 2 min\n"
                    "Stack these for maximum effect."
                ),
            },
        ],
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# 8. ENVIRONMENT LAYER - "What Surrounds Me Shapes Me"
# ══════════════════════════════════════════════════════════════════════════════

ENVIRONMENT_MODULES = {
    "digital_hygiene": {
        "name": "Digital Hygiene",
        "icon": "📱",
        "description": "Reclaim attention from technology",
        "exercises": [
            {
                "name": "Digital Audit",
                "prompt": (
                    "Assess your digital environment:\n"
                    "- Screen time: How much? On what?\n"
                    "- Notifications: Which ones interrupt deep work?\n"
                    "- Social media: Does it energize or drain you?\n"
                    "- First/last thing you look at: Phone or not?\n"
                    "Identify the one change that would reclaim the most attention."
                ),
            },
            {
                "name": "Friction Design",
                "prompt": (
                    "Add friction to bad habits, remove from good:\n"
                    "- Move distracting apps off home screen\n"
                    "- Use grayscale mode\n"
                    "- Charge phone outside bedroom\n"
                    "- Block sites during work hours\n"
                    "Make the right thing easy, the wrong thing hard."
                ),
            },
        ],
    },
    "workspace_optimization": {
        "name": "Workspace Optimization",
        "icon": "🏠",
        "description": "Design your environment for focus",
        "exercises": [
            {
                "name": "Workspace Audit",
                "prompt": (
                    "Look at your workspace with fresh eyes:\n"
                    "- What's distracting? What pulls your eye?\n"
                    "- What tools are missing? What's unnecessary?\n"
                    "- How's the lighting? Noise? Temperature?\n"
                    "- Does this space say 'focus' or 'chaos'?\n"
                    "List 3 changes you could make today."
                ),
            },
            {
                "name": "Context Switching Setup",
                "prompt": (
                    "Create distinct modes in your environment:\n"
                    "- Deep work: specific playlist, specific spot, phone away\n"
                    "- Creative work: different lighting, different posture\n"
                    "- Rest: no screens, different room if possible\n"
                    "Teach your brain: 'this context = this mode.'"
                ),
            },
        ],
    },
    "trigger_identification": {
        "name": "Trigger Identification",
        "icon": "🔍",
        "description": "Find hidden behavioral cues",
        "exercises": [
            {
                "name": "Habit Loop Mapping",
                "prompt": (
                    "For a habit you want to change:\n"
                    "1. CUE: What triggers it? (time, place, emotion, people, action)\n"
                    "2. ROUTINE: What's the behavior itself?\n"
                    "3. REWARD: What do you actually get from it?\n"
                    "Now: Can you keep the cue and reward but change the routine?"
                ),
            },
            {
                "name": "Environmental Trigger Scan",
                "prompt": (
                    "Walk through your day and note:\n"
                    "- What in your environment triggers stress?\n"
                    "- What triggers procrastination?\n"
                    "- What triggers unhealthy choices?\n"
                    "For each trigger: Can you remove it, hide it, or replace it?"
                ),
            },
        ],
    },
    "environment_reset": {
        "name": "Environment Reset",
        "icon": "🔄",
        "description": "Regular environmental maintenance",
        "exercises": [
            {
                "name": "Weekly Reset Ritual",
                "prompt": (
                    "Once per week:\n"
                    "- Clear all surfaces\n"
                    "- Delete unused apps\n"
                    "- Unsubscribe from 3 emails\n"
                    "- Review and close browser tabs\n"
                    "- Prepare next week's environment\n"
                    "Entropy is constant. Reset is intentional."
                ),
            },
            {
                "name": "Fresh Start Protocol",
                "prompt": (
                    "When you need a mental reset:\n"
                    "- Clean one room or zone completely\n"
                    "- Rearrange furniture if possible\n"
                    "- Add one beautiful or meaningful object\n"
                    "- Remove one thing that doesn't serve you\n"
                    "External order creates internal order."
                ),
            },
        ],
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# 9. MEANING/TRANSCENDENCE LAYER - "What Is Larger Than Me?"
# ══════════════════════════════════════════════════════════════════════════════

MEANING_MODULES = {
    "awe_practice": {
        "name": "Awe Practice",
        "icon": "✨",
        "description": "Cultivate wonder and perspective",
        "exercises": [
            {
                "name": "Awe Walk",
                "prompt": (
                    "Take a 15-minute walk with one goal: notice what's awesome.\n"
                    "- The scale of the sky\n"
                    "- The complexity of a single leaf\n"
                    "- The engineering of a building\n"
                    "- The mystery of other minds walking past you\n"
                    "Let yourself be small in the presence of vastness."
                ),
            },
            {
                "name": "Cosmic Perspective",
                "prompt": (
                    "Zoom out:\n"
                    "- You are on a rock spinning in space.\n"
                    "- The light you see from stars left before humans existed.\n"
                    "- Your atoms were forged in dying stars.\n"
                    "- Billions of years led to this moment.\n"
                    "How does your current problem look from this view?"
                ),
            },
        ],
    },
    "mortality_reflection": {
        "name": "Mortality Reflection",
        "icon": "💀",
        "description": "Use death as an advisor",
        "exercises": [
            {
                "name": "Memento Mori",
                "prompt": (
                    "You will die. So will everyone you love.\n"
                    "- What would you regret not doing?\n"
                    "- What would you regret not saying?\n"
                    "- What are you postponing that matters?\n"
                    "Let this awareness clarify, not terrify."
                ),
            },
            {
                "name": "The Rocking Chair Test",
                "prompt": (
                    "Imagine yourself at 90, looking back:\n"
                    "- What will you be grateful you did?\n"
                    "- What will you wish you'd worried less about?\n"
                    "- What relationships will have mattered most?\n"
                    "- What will you wish you'd started today?\n"
                    "Live now as future-you would advise."
                ),
            },
        ],
    },
    "gratitude_beyond_self": {
        "name": "Gratitude Beyond Self",
        "icon": "🙏",
        "description": "Expand beyond personal thankfulness",
        "exercises": [
            {
                "name": "Invisible Hands",
                "prompt": (
                    "Trace the web of people behind one object:\n"
                    "Your coffee: the farmer, picker, shipper, roaster, barista...\n"
                    "Your shirt: the cotton grower, weaver, dyer, sewer, seller...\n"
                    "You are supported by thousands you'll never meet.\n"
                    "What does this interdependence mean for how you live?"
                ),
            },
            {
                "name": "Ancestor Acknowledgment",
                "prompt": (
                    "You exist because of an unbroken chain of survival:\n"
                    "- Every ancestor survived long enough to reproduce.\n"
                    "- They faced plagues, wars, famines — and made it.\n"
                    "- Their struggles are encoded in you.\n"
                    "What do you owe them? What will you pass forward?"
                ),
            },
        ],
    },
    "legacy_thinking": {
        "name": "Legacy Thinking",
        "icon": "🌳",
        "description": "Think beyond your lifetime",
        "exercises": [
            {
                "name": "The Seventh Generation",
                "prompt": (
                    "Indigenous wisdom: Consider the impact 7 generations out.\n"
                    "- What are you building that will outlast you?\n"
                    "- What values are you transmitting?\n"
                    "- What would your great-great-great-grandchildren thank you for?\n"
                    "Think in centuries, not quarters."
                ),
            },
            {
                "name": "Letter to the Future",
                "prompt": (
                    "Write a letter to someone who will live 100 years from now:\n"
                    "- What do you hope they've inherited from your time?\n"
                    "- What do you hope they've left behind?\n"
                    "- What wisdom would you pass to them?\n"
                    "Let this shape what you do today."
                ),
            },
        ],
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def get_lenses_by_category(category_id: str) -> list[dict]:
    """Get all lenses in a category."""
    return [
        {"id": k, **v}
        for k, v in SOVEREIGN_LENSES.items()
        if v["category"] == category_id
    ]


def get_all_lens_categories() -> list[dict]:
    """Get all lens categories with their lenses."""
    return [
        {
            "id": cat_id,
            **cat,
            "lenses": get_lenses_by_category(cat_id),
        }
        for cat_id, cat in LENS_CATEGORIES.items()
    ]


def build_multi_lens_prompt(lens_ids: list[str], situation: str) -> tuple[str, str]:
    """Build a combined prompt for multiple lenses.

    Returns (system_prompt, user_prompt)
    """
    lenses = [SOVEREIGN_LENSES[lid] for lid in lens_ids if lid in SOVEREIGN_LENSES]
    if not lenses:
        return "", ""

    lens_descriptions = "\n\n".join(
        f"## {lens['icon']} {lens['name']}\n{lens['prompt']}"
        for lens in lenses
    )

    system = (
        "You are a wise philosophical counselor trained in multiple analytical frameworks. "
        "You help people see their situations from different angles, revealing insights "
        "that emerge when multiple perspectives are applied simultaneously. "
        "You are warm but intellectually rigorous, grounded but imaginative."
    )

    user = (
        f"My situation:\n{situation}\n\n"
        f"---\n\n"
        f"Apply these {len(lenses)} analytical lenses to help me see this more clearly:\n\n"
        f"{lens_descriptions}\n\n"
        f"---\n\n"
        f"For each lens, show me what it reveals. "
        f"Then synthesize: What emerges when these perspectives combine?"
    )

    return system, user


def build_exercise_prompt(module_id: str, exercise_idx: int, context: str) -> tuple[str, str]:
    """Build a prompt for a practice exercise.

    Returns (system_prompt, user_prompt)
    """
    if module_id not in PRACTICE_MODULES:
        return "", ""

    module = PRACTICE_MODULES[module_id]
    if exercise_idx >= len(module["exercises"]):
        return "", ""

    exercise = module["exercises"][exercise_idx]

    system = (
        f"You are a skilled coach for the {module['name']}. "
        "You guide people through exercises designed to strengthen their mental capabilities. "
        "You are supportive but challenging, encouraging honest self-reflection."
    )

    user = (
        f"My current situation/context:\n{context}\n\n"
        f"---\n\n"
        f"Guide me through this exercise:\n\n"
        f"**{exercise['name']}**\n\n"
        f"{exercise['prompt']}\n\n"
        f"Help me work through this step by step."
    )

    return system, user


def build_ritual_prompt(ritual_id: str) -> tuple[str, str]:
    """Build a prompt for a daily ritual.

    Returns (system_prompt, user_prompt)
    """
    if ritual_id not in DAILY_RITUALS:
        return "", ""

    ritual = DAILY_RITUALS[ritual_id]
    prompts_text = "\n".join(f"- {p}" for p in ritual["prompts"])

    system = (
        f"You are a thoughtful guide for the {ritual['name']} ritual. "
        "You help people start/check/end their day with intentionality. "
        "You ask probing questions and help them see clearly."
    )

    user = (
        f"I'm doing my {ritual['name']} ({ritual['time']}).\n\n"
        f"Guide me through these reflection prompts:\n\n"
        f"{prompts_text}\n\n"
        f"Help me think through each one."
    )

    return system, user


def build_identity_prompt(module_id: str, exercise_idx: int, context: str) -> tuple[str, str]:
    """Build a prompt for an identity exercise.

    Returns (system_prompt, user_prompt)
    """
    if module_id not in IDENTITY_MODULES:
        return "", ""

    module = IDENTITY_MODULES[module_id]
    if exercise_idx >= len(module["exercises"]):
        return "", ""

    exercise = module["exercises"][exercise_idx]

    system = (
        f"You are a skilled identity coach guiding someone through {module['name']}. "
        "You help people discover who they are and who they want to become. "
        "You ask deep questions, reflect back patterns, and help crystallize identity."
    )

    user = (
        f"My current context:\n{context}\n\n"
        f"---\n\n"
        f"Guide me through this identity exercise:\n\n"
        f"**{exercise['name']}**\n\n"
        f"{exercise['prompt']}\n\n"
        f"Help me work through this thoughtfully."
    )

    return system, user


def build_social_prompt(module_id: str, exercise_idx: int, context: str) -> tuple[str, str]:
    """Build a prompt for a social/relational exercise.

    Returns (system_prompt, user_prompt)
    """
    if module_id not in SOCIAL_MODULES:
        return "", ""

    module = SOCIAL_MODULES[module_id]
    if exercise_idx >= len(module["exercises"]):
        return "", ""

    exercise = module["exercises"][exercise_idx]

    system = (
        f"You are a skilled relationship coach specializing in {module['name']}. "
        "You help people navigate interpersonal dynamics with wisdom and skill. "
        "You balance honesty with compassion, boundaries with connection."
    )

    user = (
        f"My current situation:\n{context}\n\n"
        f"---\n\n"
        f"Guide me through this relational exercise:\n\n"
        f"**{exercise['name']}**\n\n"
        f"{exercise['prompt']}\n\n"
        f"Help me work through this step by step."
    )

    return system, user


def build_embodiment_prompt(module_id: str, exercise_idx: int, context: str) -> tuple[str, str]:
    """Build a prompt for an embodiment exercise.

    Returns (system_prompt, user_prompt)
    """
    if module_id not in EMBODIMENT_MODULES:
        return "", ""

    module = EMBODIMENT_MODULES[module_id]
    if exercise_idx >= len(module["exercises"]):
        return "", ""

    exercise = module["exercises"][exercise_idx]

    system = (
        f"You are a somatic coach specializing in {module['name']}. "
        "You help people connect with their body wisdom and use physical practices "
        "to shift mental and emotional states. You guide with warmth and precision."
    )

    user = (
        f"My current state:\n{context}\n\n"
        f"---\n\n"
        f"Guide me through this embodiment practice:\n\n"
        f"**{exercise['name']}**\n\n"
        f"{exercise['prompt']}\n\n"
        f"Walk me through this practice."
    )

    return system, user


def build_environment_prompt(module_id: str, exercise_idx: int, context: str) -> tuple[str, str]:
    """Build a prompt for an environment exercise.

    Returns (system_prompt, user_prompt)
    """
    if module_id not in ENVIRONMENT_MODULES:
        return "", ""

    module = ENVIRONMENT_MODULES[module_id]
    if exercise_idx >= len(module["exercises"]):
        return "", ""

    exercise = module["exercises"][exercise_idx]

    system = (
        f"You are an environment design coach specializing in {module['name']}. "
        "You help people shape their surroundings to support their goals and wellbeing. "
        "You provide practical, actionable guidance for environmental optimization."
    )

    user = (
        f"My current situation:\n{context}\n\n"
        f"---\n\n"
        f"Guide me through this environment exercise:\n\n"
        f"**{exercise['name']}**\n\n"
        f"{exercise['prompt']}\n\n"
        f"Help me work through this practically."
    )

    return system, user


def build_meaning_prompt(module_id: str, exercise_idx: int, context: str) -> tuple[str, str]:
    """Build a prompt for a meaning/transcendence exercise.

    Returns (system_prompt, user_prompt)
    """
    if module_id not in MEANING_MODULES:
        return "", ""

    module = MEANING_MODULES[module_id]
    if exercise_idx >= len(module["exercises"]):
        return "", ""

    exercise = module["exercises"][exercise_idx]

    system = (
        f"You are a philosophical guide specializing in {module['name']}. "
        "You help people connect with what's larger than themselves — meaning, legacy, "
        "transcendence. You balance depth with accessibility, gravity with warmth."
    )

    user = (
        f"My current reflection:\n{context}\n\n"
        f"---\n\n"
        f"Guide me through this meaning exercise:\n\n"
        f"**{exercise['name']}**\n\n"
        f"{exercise['prompt']}\n\n"
        f"Help me explore this deeply."
    )

    return system, user
