"""
MindCast content generation pipeline.

Pipeline flow (optimized for quality):
  Stage 0: Research Gathering (collect facts, studies, figures)
  Stage 1: Initial Script (2 parallel drafts - Sonnet + GPT-4o)
  Judge:   Select best draft

  Enhancement loop (4 stages, each with critique before):
    Stage 2: Deep Enhancement (artistic + academic depth)
    Stage 3: De-AI & Voice Authenticity (strip LLM patterns, inject personality)
    Stage 4: Oral Delivery Optimization (breath, rhythm, mouth-feel)
    Stage 5: Final Polish (line-by-line refinement)

Every stage after Stage 0 receives the original topic + research brief for context.
"""

# Episode length presets
EPISODE_LENGTHS = {
    "5 min": {"minutes": 5, "words_min": 750, "words_max": 900},
    "10 min": {"minutes": 10, "words_min": 1500, "words_max": 1800},
    "15 min": {"minutes": 15, "words_min": 2250, "words_max": 2700},
    "20 min": {"minutes": 20, "words_min": 3000, "words_max": 3600},
}


def get_research_stage(length_key: str = "10 min") -> dict:
    """Get research stage config with dynamic length."""
    length = EPISODE_LENGTHS[length_key]
    return {
        "name": "Stage 0: Research Gathering",
        "description": "Collects key facts, studies, figures, debates, and historical milestones on the topic",
        "system": (
            "You are a meticulous research assistant with expertise across all academic disciplines. "
            "You produce structured research briefs that give a writer everything they need to create "
            "authoritative, specific, and deeply grounded documentary content."
        ),
        "user_template": (
            f"I need to write a {length['minutes']}-minute documentary-style audio episode on the topic: '{{topic}}'\n\n"
            "Please produce a comprehensive research brief covering:\n\n"
            "1. **Key Historical Milestones**: The 5-10 most important moments, discoveries, or turning points in this field. "
            "Include dates, names, and what specifically happened.\n\n"
            "2. **Foundational Theories & Frameworks**: The major theoretical models that ground the field. "
            "Who developed them, when, and what do they explain?\n\n"
            "3. **Landmark Studies & Experiments**: Specific experiments or studies that changed understanding. "
            "Include methodology, key findings, and sample sizes where relevant.\n\n"
            "4. **Surprising Statistics & Counterintuitive Facts**: Data points that would shock or intrigue a general audience.\n\n"
            "5. **Key Figures & Their Contributions**: The people behind the breakthroughs — not just names, but what they specifically did and said.\n\n"
            "6. **Current Debates & Open Questions**: Where does the field disagree? What remains unresolved?\n\n"
            "7. **Recent Advances (last 5 years)**: The cutting edge — what's new and exciting?\n\n"
            "8. **Cross-Disciplinary Connections**: How does this topic connect to other fields in unexpected ways?\n\n"
            "9. **Memorable Quotes**: Powerful quotes from practitioners or thinkers in the field.\n\n"
            "10. **Common Misconceptions**: What does the public get wrong about this topic?\n\n"
            "Be specific. Use names, dates, numbers. No vague generalities. "
            "Format as organized bullet points under each heading."
        ),
        "temperature": 0.4,
        "provider": "anthropic",
        "model_override": "claude-sonnet-4-20250514",
    }


def get_draft_stage(length_key: str = "10 min") -> dict:
    """Get draft stage config with dynamic length."""
    length = EPISODE_LENGTHS[length_key]
    return {
        "name": "Stage 1: Initial Script",
        "description": f"Creates the foundational episode script (~{length['words_min']}-{length['words_max']} words)",
        "system": (
            "You are a world-class documentary scriptwriter for audio content. "
            "Your goal is to make advanced knowledge accessible, memorable, and intellectually stimulating. "
            "Write like the narrator of the best BBC or PBS documentaries - authoritative yet warm, "
            "making complex ideas feel fascinating and approachable. Your scripts make knowledge stick."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Research brief to draw from (use specific details from this):\n{research}\n\n"
            "---\n\n"
            "Objective:\n\n"
            "Create an eloquent, intellectually sophisticated, and deeply engaging documentary script on the topic of '{topic}'. "
            "The outcome should be varied and different from any other scripts we've made together. "
            "Don't use obvious patterns that an LLM would use, but keep it as if an analysis of the text would confirm it as human written. "
            "Use different vocabulary than previous scripts, nouns and verb choices, etc. "
            "The script should not only inform but also captivate, inspire, and challenge listeners, leaving them with lasting intellectual growth. "
            "It should feel like the best documentary narration - authoritative yet inviting, making the listener feel they're discovering profound truths. "
            f"The goal is to take listeners on a {length['minutes']}-minute journey of discovery, guided by profound insights and surprising revelations that stick with them. "
            "Do not speak with fluff; it should use rhetoric with substance, and details about the central chain of insights and studies or breakthrough observations, and the way practitioners think in the field. "
            "Do not use headers. I want you give it all to me in a form that can be read aloud immediately. "
            "It should sound like a world-class documentary narrator sharing fascinating knowledge in an intimate, engaging way.\n\n"
            "Instructions:\n\n"
            "Introduction: Ignite Curiosity\n\n"
            "Compelling Hook: Begin with one of the following techniques to immediately draw viewers in:\n"
            "Provocative Quote: Present a powerful, relevant quote tied to a modern issue or perspective, making it feel both timeless and current.\n"
            "Existential Question: Pose a deeply thought-provoking question that challenges viewers' core beliefs and provokes introspection.\n"
            "Counterintuitive Statistic: Share a surprising, lesser-known fact or statistic that subverts expectations and piques curiosity.\n"
            "Personal Narrative: Offer a brief but compelling story that relates the topic to the viewer's own life or experiences.\n"
            "Viewer Connection:\n"
            "Address the audience directly, acknowledging their curiosity and existing knowledge.\n"
            "Use inclusive language like \"Let's delve into...\" to create a sense of camaraderie.\n"
            "Hint at deeper insights to come, promising a transformative experience.\n"
            "Roadmap with Intrigue:\n"
            "Provide a brief, exciting overview of what the episode will cover without revealing all the details.\n"
            "Foreshadow major revelations to build anticipation.\n"
            "Example: \"By the end of this episode, you'll perceive {topic} through an entirely new perspective.\"\n"
            "Challenging Popular Perceptions: Deepen the Inquiry\n\n"
            "Deconstructing Common Narratives:\n"
            "Introduce common beliefs or assumptions about {topic}, acknowledging their historical or cultural roots.\n"
            "Respectfully and rigorously dismantle misconceptions, presenting clear, evidence-based clarifications.\n"
            "Emphasize that revising one's understanding is a sign of intellectual growth.\n"
            "Rhetorical Engagement:\n"
            "Pose open-ended questions that encourage viewers to reflect critically.\n"
            "Use strategic pauses to give viewers time to ponder before unveiling deeper insights.\n"
            "Example: \"Why do we hold onto the belief that [common misconception]? Let's examine the evidence.\"\n"
            "Deep Exploration: Balance Rigor and Accessibility\n\n"
            "Thematic Coherence:\n"
            "Establish a central thesis or guiding question that anchors the exploration.\n"
            "Revisit this theme throughout to maintain focus and build intellectual momentum.\n"
            "Sophisticated Yet Clear Communication:\n"
            "Break down complex concepts using relatable metaphors and analogies.\n"
            "Introduce technical terms with clear explanations and context.\n"
            "Use vivid language to help viewers visualize abstract ideas.\n"
            "Interdisciplinary Synthesis:\n"
            "Highlight connections between '{topic}' and other fields or areas of life.\n"
            "Show unexpected links between seemingly disparate disciplines.\n"
            "Example: \"This concept in '{topic}' mirrors patterns we see in economics and even music.\"\n"
            "Cutting-Edge & Open Questions:\n"
            "Present the latest research and developments with enthusiasm.\n"
            "Frame unanswered questions as opportunities for further exploration.\n"
            "Encourage viewers to think critically about ongoing debates.\n"
            "Astounding Insights: Inspire Awe\n\n"
            "Revelations with Impact:\n"
            "Speak about the historical origins and move forward with the intellectual or professional insights. "
            "Gradually build up to key insights, creating a sense of discovery.\n"
            "Reveal impactful information strategically for maximum effect.\n"
            "Humanizing Complex Ideas:\n"
            "Share stories about the people behind major breakthroughs.\n"
            "Connect historical journeys to the viewer's own learning process.\n"
            "Vivid Conceptualization:\n"
            "Use descriptive, sensory language to bring abstract concepts to life.\n"
            "Employ thought experiments to help viewers \"experience\" complex ideas.\n"
            "Develop metaphors that evolve and deepen as the video progresses.\n"
            "Sustained Engagement: Craft a Captivating Journey\n\n"
            "Narrative Arc:\n"
            "Structure the content like a story, with each revelation leading to new questions.\n"
            "Create intellectual tension and release to keep viewers hooked.\n"
            "Use cliffhangers to maintain interest.\n"
            "Active Participation:\n"
            "Pose challenges or thought experiments directly to the viewer.\n"
            "Encourage them to apply new knowledge to real-world situations.\n"
            "Include moments for self-reflection.\n"
            "Example: \"How might this new understanding change your approach to [everyday activity]?\"\n"
            "Emotional & Intellectual Resonance:\n"
            "Tap into the awe-inspiring nature of the topic.\n"
            "Acknowledge the emotional impact of paradigm shifts.\n"
            "Create moments of intellectual satisfaction as complex ideas come together.\n"
            "Conclusion: Leave a Lasting Impression\n\n"
            "Synthesis of Ideas:\n"
            "Briefly recap the main points and tie them together thoughtfully.\n"
            "Revisit the opening theme, highlighting the intellectual journey undertaken.\n"
            "The Road Ahead:\n"
            "Pose a final question that encourages further thought.\n"
            "Suggest potential future developments or areas for exploration.\n"
            "Community Engagement:\n"
            "Invite viewers to discuss the topic in the comments.\n"
            "Suggest a specific question or topic for them to consider.\n"
            "Inspirational Close:\n"
            "Connect the intellectual journey to personal growth and societal progress.\n"
            "End with a call to action, encouraging continued curiosity and learning.\n"
            "Additional Techniques for Maximum Impact\n\n"
            "Cinematic Language:\n"
            "Use visual descriptors to create vivid mental scenes.\n"
            "Craft metaphors and analogies that evolve as the narrative progresses.\n"
            "Example: \"Imagine zooming into the very fabric of reality...\"\n"
            "Varied Cognitive Pacing:\n"
            "Alternate between fast-paced information and slower, reflective moments.\n"
            "Use linguistic devices like alliteration or repetition for emphasis.\n"
            "Vary sentence length to maintain a dynamic rhythm.\n"
            "Intellectual Plot Twists:\n"
            "Introduce unexpected perspectives or contradictions.\n"
            "Create cognitive dissonance, then resolve it for intellectual satisfaction.\n"
            "Futuristic Speculation:\n"
            "Encourage viewers to imagine potential future scenarios related to {topic}.\n"
            "Frame these speculations as part of an ongoing, exciting intellectual journey.\n"
            "Meta-Commentary on Learning:\n"
            "Reflect on the learning process itself.\n"
            "Validate the challenge of grappling with complex ideas, fostering a growth mindset.\n"
            "Guidelines for Length and Timing\n\n"
            "Target Duration:\n"
            f"Aim for a script that fits within a {length['minutes']}-minute video format "
            f"(approximately {length['words_min']} to {length['words_max']} words).\n"
            "Adjust the depth and detail to suit this timeframe without sacrificing clarity or engagement.\n"
            "Concise Thoroughness:\n"
            "Ensure each section is thorough yet concise.\n"
            "Maintain a logical progression without unnecessary digressions.\n"
            "Final Notes:\n\n"
            "Tone and Style:\n"
            "Maintain an authoritative yet inviting tone.\n"
            "Balance intellectual rigor with emotional resonance.\n"
            "Avoid jargon unless it's clearly explained and adds value.\n"
            "Audience Engagement:\n"
            "Connect with the audience throughout.\n"
            "Encourage active thinking and personal connection to the material.\n"
            "Foster a sense of shared exploration and discovery. "
            "Remember to sound like an engaging documentary narrator - authoritative but warm, making the listener feel they're learning something profound. "
            "If you think your output is good, try to make it even more dense with the field's insights, and advances in concepts, "
            "and connect the dots fluidly, ensuring knowledge sticks with the listener, and only then give it to me."
        ),
        "temperature": 0.9,
        "provider": "anthropic",
        "model_override": "claude-sonnet-4-20250514",
    }


# --- Draft variants for parallel generation (2 drafts for speed) ---
DRAFT_VARIANTS = [
    {
        "label": "Draft A (Claude Sonnet, balanced)",
        "provider": "anthropic",
        "model_override": "claude-sonnet-4-20250514",
        "temperature": 0.8,
    },
    {
        "label": "Draft B (GPT-4o, different perspective)",
        "provider": "openai",
        "model_override": "gpt-4o-2024-11-20",
        "temperature": 0.85,
    },
]

# --- Judge: Select best draft ---
JUDGE_PROMPT = {
    "name": "Judge: Select Best Draft",
    "description": "Evaluates parallel drafts and selects the strongest one",
    "system": (
        "You are a world-class editor and literary critic. You evaluate writing with ruthless precision, "
        "scoring on originality, intellectual depth, emotional resonance, specificity of evidence, "
        "and how human/natural the voice sounds. You do NOT write — you only judge."
    ),
    "user_template_2": (
        "Topic: '{topic}'\n\n"
        "Below are two draft scripts on the same topic. Evaluate each on these criteria (1-10 scale):\n"
        "1. **Originality** — Does it avoid cliché LLM patterns? Does it feel fresh?\n"
        "2. **Intellectual Depth** — Does it use specific studies, names, dates, frameworks?\n"
        "3. **Emotional Resonance** — Does it create genuine feeling, not manufactured sentiment?\n"
        "4. **Voice & Authenticity** — Does it sound like a real expert talking, not a polished essay?\n"
        "5. **Structure & Flow** — Does the narrative build compellingly?\n\n"
        "---\n\n"
        "DRAFT A:\n{draft_a}\n\n"
        "---\n\n"
        "DRAFT B:\n{draft_b}\n\n"
        "---\n\n"
        "Score each draft on all 5 criteria. Then declare WINNER: A or B.\n"
        "Finally, list 2-3 specific strengths from the losing draft that should be incorporated into the winner.\n\n"
        "Format your response EXACTLY like this:\n"
        "SCORES:\n"
        "Draft A: Originality X, Depth X, Emotion X, Voice X, Structure X = Total XX\n"
        "Draft B: Originality X, Depth X, Emotion X, Voice X, Structure X = Total XX\n\n"
        "WINNER: [A/B]\n\n"
        "BORROW FROM LOSER:\n"
        "- [specific element to incorporate]\n"
        "- [specific element to incorporate]"
    ),
    "user_template": (
        "Topic: '{topic}'\n\n"
        "Below are three draft scripts on the same topic. Evaluate each on these criteria (1-10 scale):\n"
        "1. **Originality** — Does it avoid cliché LLM patterns? Does it feel fresh?\n"
        "2. **Intellectual Depth** — Does it use specific studies, names, dates, frameworks?\n"
        "3. **Emotional Resonance** — Does it create genuine feeling, not manufactured sentiment?\n"
        "4. **Voice & Authenticity** — Does it sound like a real expert talking, not a polished essay?\n"
        "5. **Structure & Flow** — Does the narrative build compellingly?\n\n"
        "---\n\n"
        "DRAFT A:\n{draft_a}\n\n"
        "---\n\n"
        "DRAFT B:\n{draft_b}\n\n"
        "---\n\n"
        "DRAFT C:\n{draft_c}\n\n"
        "---\n\n"
        "Score each draft on all 5 criteria. Then declare WINNER: A, B, or C.\n"
        "Finally, list 3-5 specific strengths from the losing drafts that should be incorporated into the winner.\n\n"
        "Format your response EXACTLY like this:\n"
        "SCORES:\n"
        "Draft A: Originality X, Depth X, Emotion X, Voice X, Structure X = Total XX\n"
        "Draft B: Originality X, Depth X, Emotion X, Voice X, Structure X = Total XX\n"
        "Draft C: Originality X, Depth X, Emotion X, Voice X, Structure X = Total XX\n\n"
        "WINNER: [A/B/C]\n\n"
        "BORROW FROM LOSERS:\n"
        "- [specific element to incorporate]\n"
        "- [specific element to incorporate]\n"
        "- [specific element to incorporate]"
    ),
    "temperature": 0.2,
    "provider": "anthropic",
    "model_override": "claude-sonnet-4-20250514",
}

# --- Critique prompt template (GPT-4o for varied perspective) ---
CRITIQUE_TEMPLATE = {
    "system": (
        "You are a brutally honest editorial critic. You identify weaknesses, missed opportunities, "
        "and areas that feel artificial or underdeveloped. You are specific — you quote exact phrases "
        "that need work and explain exactly why."
    ),
    "user_template": (
        "Topic: '{topic}'\n\n"
        "The following script has just been through '{completed_stage}' and is about to enter '{next_stage}'.\n\n"
        "Script:\n{text}\n\n"
        "Provide a focused critique (max 300 words) covering:\n"
        "1. What are the 3 weakest passages? Quote them exactly.\n"
        "2. Where does it still sound like an LLM wrote it?\n"
        "3. What specific facts, studies, or details are missing or vague?\n"
        "4. What emotional moments fall flat?\n"
        "5. One structural suggestion.\n\n"
        "Be blunt. Be specific. No praise — only actionable feedback."
    ),
    "temperature": 0.3,
    "provider": "openai",
    "model_override": "gpt-4o-2024-11-20",
}

# --- Enhancement stages (4 stages for maximum quality) ---
ENHANCEMENT_STAGES = [
    {
        "name": "Stage 2: Deep Enhancement",
        "description": "Combines artistic enhancement with academic depth and rhetorical mastery",
        "system": (
            "You are a master literary artist, rhetoric specialist, academic synthesizer, and intellectual enhancer. "
            "You elevate writing by weaving in rhetorical devices, vivid imagery, theoretical frameworks, "
            "key discoveries, and profound depth while preserving every piece of existing content."
        ),
        "user_template": (
            "Topic: '{topic}'\n"
            "Research brief for reference:\n{research}\n\n"
            "Critique from editorial review (address these issues):\n{critique}\n\n"
            "---\n\n"
            "Without losing any content, enhance the following script in these ways:\n\n"
            "{previous_output}\n\n"
            "**INTELLECTUAL DEPTH:**\n"
            "- Add hyper-expert insights and historical elements describing accumulated knowledge\n"
            "- Weave in theoretical frameworks, experimental breakthroughs, and key discoveries\n"
            "- Include specific experiments/studies with key findings and implications\n"
            "- Highlight academic debates and controversies that defined the field's evolution\n"
            "- Balance historical context with cutting-edge advancements and open questions\n\n"
            "**ARTISTIC ENHANCEMENT:**\n"
            "- Vary sentence length: short for emphasis, longer for complex ideas\n"
            "- Use strong, specific verbs and parallel structure\n"
            "- Include sensory details and concrete imagery\n"
            "- Avoid clichés; craft original phrasing\n"
            "- Create balance and contrast by juxtaposing opposing ideas\n"
            "- Show, don't tell — use actions and imagery to convey meaning\n\n"
            "**RHETORICAL DEVICES** (use tastefully at natural moments):\n"
            "Antithesis, Tricolon, Anaphora, Chiasmus, Rhetorical Questions, Metaphor, "
            "Alliteration, Paradox, Epistrophe, Hyperbole, Litotes, Personification.\n\n"
            "The writing should be deep, profound, and take the listener on a transformative journey. "
            "Ensure all facts remain grounded in the research brief."
        ),
        "temperature": 0.7,
        "provider": "anthropic",
        "model_override": "claude-sonnet-4-20250514",
    },
    {
        "name": "Stage 3: De-AI & Voice Authenticity",
        "description": "Strips LLM patterns and injects genuine, idiosyncratic voice",
        "system": (
            "You are an expert at detecting and eliminating AI-generated writing patterns. "
            "You have an uncanny ability to spot the telltale signs of LLM output and replace them with "
            "genuinely human, idiosyncratic expression. You make writing sound like it came from a specific, "
            "opinionated person — not a helpful assistant."
        ),
        "user_template": (
            "Topic: '{topic}'\n"
            "Research brief:\n{research}\n\n"
            "Critique:\n{critique}\n\n"
            "---\n\n"
            "The following script needs to be DE-ROBOTIZED. Find and fix ALL instances of:\n\n"
            "{previous_output}\n\n"
            "**LLM PATTERNS TO ELIMINATE:**\n"
            "- Generic openings: 'In today's world...', 'Have you ever wondered...', 'Let's dive in...'\n"
            "- Overused intensifiers: 'crucial', 'vital', 'essential', 'fascinating', 'remarkable'\n"
            "- Hedging phrases: 'It's worth noting', 'Interestingly enough', 'One might argue'\n"
            "- Smooth transitions: 'Moreover', 'Furthermore', 'Additionally', 'That being said'\n"
            "- Empty validation: 'This is important because...', 'What makes this significant is...'\n"
            "- Perfect parallel structure everywhere (real humans are messier)\n"
            "- Overly balanced 'on one hand / on the other hand' constructions\n"
            "- Concluding with neat summaries or calls to action\n\n"
            "**INJECT AUTHENTIC VOICE:**\n"
            "- Add unexpected word choices that a specific person might use\n"
            "- Include mild opinions, preferences, or gentle skepticism\n"
            "- Let some sentences trail off or pivot mid-thought\n"
            "- Use contractions naturally ('it's', 'don't', 'can't')\n"
            "- Add the occasional 'actually', 'honestly', 'look', 'here's the thing'\n"
            "- Reference personal experience or curiosity ('I always found it strange that...')\n"
            "- Be willing to say 'I don't know' or 'this is still debated'\n\n"
            "The result should pass the 'would a real person say this?' test. "
            "Every sentence should sound like it came from someone with actual opinions and personality."
        ),
        "temperature": 0.8,
        "provider": "anthropic",
        "model_override": "claude-sonnet-4-20250514",
    },
    {
        "name": "Stage 4: Oral Delivery Optimization",
        "description": "Optimizes specifically for spoken delivery - breath, rhythm, and mouth-feel",
        "system": (
            "You are a voice-over director and speech coach who optimizes written text for audio delivery. "
            "You understand that spoken prose is fundamentally different from written prose — it must flow "
            "naturally when read aloud, with room to breathe, natural emphasis points, and no tongue-twisters. "
            "You make text a pleasure to listen to."
        ),
        "user_template": (
            "Topic: '{topic}'\n"
            "Research brief:\n{research}\n\n"
            "Critique:\n{critique}\n\n"
            "---\n\n"
            "Optimize this script specifically for AUDIO DELIVERY:\n\n"
            "{previous_output}\n\n"
            "**BREATH & RHYTHM:**\n"
            "- Break sentences that are too long for a single breath (max ~25 words)\n"
            "- Add natural pause points with punctuation (commas, em-dashes, periods)\n"
            "- Vary sentence length to create rhythm: short punchy lines, then longer flowing ones\n"
            "- Ensure complex ideas have breathing room — don't stack dense concepts\n\n"
            "**MOUTH-FEEL & FLOW:**\n"
            "- Eliminate tongue-twisters and awkward consonant clusters\n"
            "- Avoid words that are hard to pronounce or sound similar (homophones in sequence)\n"
            "- Check for unintentional rhymes or repetitive sounds\n"
            "- Make sure emphasis falls on important words, not throwaway ones\n\n"
            "**LISTENER ENGAGEMENT:**\n"
            "- Add micro-hooks every 30-60 seconds (questions, surprising facts, 'here's the thing')\n"
            "- Create 'wait for it' moments where you build anticipation before a reveal\n"
            "- Use direct address ('you', 'your', 'imagine') to maintain connection\n"
            "- Ensure the opening 30 seconds are absolutely gripping\n\n"
            "**AUDIO-SPECIFIC:**\n"
            "- Numbers should be easy to say and hear (not '47.3%' but 'nearly half')\n"
            "- Spell out abbreviations that sound awkward when spoken\n"
            "- Avoid parenthetical asides that work in writing but confuse listeners\n\n"
            "Read the entire script aloud in your mind. Fix anything that doesn't flow naturally."
        ),
        "temperature": 0.5,
        "provider": "anthropic",
        "model_override": "claude-sonnet-4-20250514",
    },
    {
        "name": "Stage 5: Final Polish",
        "description": "Final line-by-line refinement ensuring every word earns its place",
        "system": (
            "You are a meticulous final-pass editor. You go line by line with surgical precision, "
            "ensuring every single word earns its place. You cut ruthlessly, tighten relentlessly, "
            "and polish until the text gleams. You are the last line of defense before publication."
        ),
        "user_template": (
            "Topic: '{topic}'\n"
            "Research brief (verify facts):\n{research}\n\n"
            "Critique (final check):\n{critique}\n\n"
            "---\n\n"
            "FINAL PASS. Go line by line through this script:\n\n"
            "{previous_output}\n\n"
            "**TIGHTEN:**\n"
            "- Cut any word that doesn't add meaning\n"
            "- Replace weak verbs with strong, specific ones\n"
            "- Eliminate redundancy ('absolutely essential' → 'essential')\n"
            "- Remove filler ('really', 'very', 'quite', 'just', 'actually' unless purposeful)\n\n"
            "**VERIFY:**\n"
            "- Every fact, name, date, and number must be accurate per the research brief\n"
            "- Remove or qualify anything that sounds made up or too good to be true\n"
            "- Ensure claims are appropriately hedged ('often' vs 'always')\n\n"
            "**FINAL CHECK:**\n"
            "- Opening must hook immediately — no throat-clearing\n"
            "- Ending must resonate — no weak fade-outs or cliché conclusions\n"
            "- Overall arc should feel complete and satisfying\n"
            "- The piece should leave the listener changed in some small way\n\n"
            "Do NOT add content. Only refine what exists. Make every word count."
        ),
        "temperature": 0.3,
        "provider": "anthropic",
        "model_override": "claude-sonnet-4-20250514",
    },
]

# --- Previous episodes memory (stores opening paragraphs for differentiation) ---
DIFFERENTIATION_CONTEXT = (
    "IMPORTANT: Here are opening paragraphs from previous episodes we've generated. "
    "Your script MUST use a completely different opening technique, different vocabulary patterns, "
    "and a different structural approach than these:\n\n{previous_openings}\n\n---\n\n"
)

# --- Learning Add-ons (generated on-demand after episode completion) ---

LEARNING_ADDONS = {
    "quiz": {
        "name": "Comprehension Quiz",
        "icon": "📝",
        "description": "Test your understanding with 5 questions",
        "system": (
            "You are an educational assessment specialist who creates engaging, thought-provoking quiz questions. "
            "You design questions that test genuine understanding, not just recall — focusing on application, "
            "analysis, and synthesis of ideas. Your quizzes make learning stick."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Episode transcript:\n{transcript}\n\n"
            "---\n\n"
            "Create a 5-question quiz based on this episode. Include:\n\n"
            "1. **Recall Question** - Tests basic understanding of a key concept\n"
            "2. **Application Question** - Asks how to apply a concept to a real scenario\n"
            "3. **Analysis Question** - Requires comparing, contrasting, or evaluating ideas\n"
            "4. **Synthesis Question** - Connects multiple concepts from the episode\n"
            "5. **Extension Question** - Challenges the listener to think beyond what was covered\n\n"
            "For each question:\n"
            "- Write the question clearly\n"
            "- Provide 4 multiple-choice options (A, B, C, D)\n"
            "- Mark the correct answer\n"
            "- Add a brief explanation of why it's correct\n\n"
            "Format each question like:\n"
            "**Q1: [Question text]**\n"
            "A) Option\n"
            "B) Option\n"
            "C) Option\n"
            "D) Option\n"
            "✓ Correct: [Letter]\n"
            "💡 [Brief explanation]\n"
        ),
        "temperature": 0.5,
        "provider": "anthropic",
        "model_override": "claude-sonnet-4-20250514",
    },
    "journal": {
        "name": "Journal Prompts",
        "icon": "✍️",
        "description": "Reflection questions for deeper processing",
        "system": (
            "You are a reflective learning coach who designs journal prompts that foster deep personal processing. "
            "Your prompts help people connect new knowledge to their own experiences, values, and goals. "
            "You create space for genuine introspection, not surface-level reflection."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Episode transcript:\n{transcript}\n\n"
            "---\n\n"
            "Create 3 journal prompts that help the listener deeply process this episode:\n\n"
            "**Prompt 1: Personal Connection**\n"
            "Help them connect the content to their own life, experiences, or beliefs.\n\n"
            "**Prompt 2: Challenge & Growth**\n"
            "Encourage them to examine where this knowledge challenges their current thinking or behavior.\n\n"
            "**Prompt 3: Future Application**\n"
            "Guide them to consider how they might apply these insights going forward.\n\n"
            "Each prompt should:\n"
            "- Be specific to the episode content (not generic)\n"
            "- Invite genuine reflection, not just summary\n"
            "- Be open-ended enough for varied responses\n"
            "- Include a brief 'why this matters' context\n\n"
            "Format:\n"
            "**1. [Prompt title]**\n"
            "[The journal prompt question]\n"
            "_Why this matters: [Brief context]_\n"
        ),
        "temperature": 0.6,
        "provider": "anthropic",
        "model_override": "claude-sonnet-4-20250514",
    },
    "takeaways": {
        "name": "Key Takeaways",
        "icon": "💡",
        "description": "Quick-reference summary of main points",
        "system": (
            "You are a learning synthesizer who distills complex content into memorable, actionable takeaways. "
            "You identify the essential insights that someone should remember weeks later, "
            "and you phrase them in ways that stick."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Episode transcript:\n{transcript}\n\n"
            "---\n\n"
            "Create a Key Takeaways summary for quick reference and review:\n\n"
            "**🎯 The Big Idea** (1 sentence)\n"
            "What's the single most important insight from this episode?\n\n"
            "**📌 Key Points** (5-7 bullets)\n"
            "The essential concepts someone should remember. Each should be:\n"
            "- Concrete and specific (not vague)\n"
            "- Self-contained (makes sense without context)\n"
            "- Memorable (phrased to stick)\n\n"
            "**🔗 Connections** (2-3 bullets)\n"
            "How this topic connects to broader themes or other fields.\n\n"
            "**⚡ Quick Facts** (3-4 bullets)\n"
            "Surprising statistics, dates, or facts worth remembering.\n\n"
            "**❓ Open Questions** (1-2 bullets)\n"
            "What remains debated or unknown in this field?\n\n"
            "Keep it scannable. This is a reference document, not prose."
        ),
        "temperature": 0.4,
        "provider": "anthropic",
        "model_override": "claude-sonnet-4-20250514",
    },
}

# --- Perspective Lenses (apply different thinking frameworks to the content) ---

PERSPECTIVE_LENSES = {
    "stoic": {
        "name": "Stoic Lens",
        "icon": "🏛️",
        "description": "What would Marcus Aurelius say?",
        "system": (
            "You are a Stoic philosopher who applies the wisdom of Marcus Aurelius, Seneca, and Epictetus "
            "to modern knowledge. You find the Stoic angles in any topic — what's within our control, "
            "what teaches virtue, and how to maintain equanimity in the face of new understanding."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Episode transcript:\n{transcript}\n\n"
            "---\n\n"
            "Apply Stoic philosophy to this content:\n\n"
            "**🏛️ The Stoic Take**\n"
            "What would a Stoic make of this knowledge? How does it relate to virtue, wisdom, or the good life?\n\n"
            "**⚖️ Control vs. No Control**\n"
            "What aspects of this topic are within our control? What must we accept?\n\n"
            "**📜 Relevant Stoic Wisdom**\n"
            "Include 2-3 quotes from Marcus Aurelius, Seneca, or Epictetus that illuminate this topic.\n\n"
            "**🎯 Practical Stoic Application**\n"
            "How might someone apply Stoic principles to this knowledge in daily life?\n\n"
            "Write in an accessible but philosophically grounded way."
        ),
        "temperature": 0.6,
    },
    "first_principles": {
        "name": "First Principles",
        "icon": "🔬",
        "description": "Break it down to fundamentals",
        "system": (
            "You are a first-principles thinker in the tradition of Aristotle, Descartes, and Elon Musk. "
            "You strip away assumptions to reveal the foundational truths. You ask 'why?' until you hit bedrock, "
            "then build understanding from there."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Episode transcript:\n{transcript}\n\n"
            "---\n\n"
            "Apply first-principles thinking:\n\n"
            "**🔬 Foundational Truths**\n"
            "What are the fundamental, undeniable facts at the base of this topic? Strip away all assumptions.\n\n"
            "**❓ The 'Why' Chain**\n"
            "Take a key claim from the episode and ask 'why?' 5 times to reach bedrock truth.\n\n"
            "**🏗️ Building Up**\n"
            "Starting from first principles, what conclusions can we reach? Do they match conventional wisdom?\n\n"
            "**💡 Hidden Assumptions**\n"
            "What assumptions does conventional thinking about this topic rely on? Which are questionable?\n\n"
            "Be rigorous but accessible. Show the reasoning chain."
        ),
        "temperature": 0.5,
    },
    "systems": {
        "name": "Systems Thinking",
        "icon": "🔄",
        "description": "See the interconnections and feedback loops",
        "system": (
            "You are a systems thinker who sees the world as interconnected wholes, not isolated parts. "
            "You identify feedback loops, emergent properties, leverage points, and unintended consequences. "
            "You think like Donella Meadows and understand that behavior emerges from structure."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Episode transcript:\n{transcript}\n\n"
            "---\n\n"
            "Apply systems thinking:\n\n"
            "**🔄 Key Feedback Loops**\n"
            "What reinforcing or balancing loops exist in this system? How do they shape outcomes?\n\n"
            "**🌐 Interconnections**\n"
            "How does this topic connect to other systems? What are the non-obvious relationships?\n\n"
            "**⚡ Leverage Points**\n"
            "Where could small interventions create large changes? What are the high-impact places to act?\n\n"
            "**🎭 Emergent Properties**\n"
            "What behaviors or outcomes emerge from the system that aren't obvious from individual parts?\n\n"
            "**⚠️ Unintended Consequences**\n"
            "What might go wrong if we intervene without understanding the full system?\n\n"
            "Draw connections and help readers see the bigger picture."
        ),
        "temperature": 0.6,
    },
    "contrarian": {
        "name": "Contrarian View",
        "icon": "🔀",
        "description": "Challenge the conventional wisdom",
        "system": (
            "You are an intellectual contrarian who stress-tests ideas by arguing the opposite. "
            "You're not a troll — you're a rigorous thinker who knows that good ideas survive scrutiny "
            "and that groupthink is dangerous. You play devil's advocate with intellectual honesty."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Episode transcript:\n{transcript}\n\n"
            "---\n\n"
            "Challenge the conventional wisdom:\n\n"
            "**🔀 The Contrarian Take**\n"
            "What's the strongest argument against the mainstream view on this topic?\n\n"
            "**🎯 Weak Points**\n"
            "Where is the conventional wisdom most vulnerable to criticism? What evidence is it ignoring?\n\n"
            "**🗣️ Dissenting Voices**\n"
            "Who are the credible experts or thinkers who disagree? What do they say?\n\n"
            "**⚖️ Steelmanning Both Sides**\n"
            "Present the strongest version of both the mainstream and contrarian views.\n\n"
            "**💭 What If They're Right?**\n"
            "If the contrarian view is correct, what would that mean? What should we do differently?\n\n"
            "Be intellectually honest. Challenge ideas, not people."
        ),
        "temperature": 0.7,
    },
    "practical": {
        "name": "Practical Application",
        "icon": "🛠️",
        "description": "Turn knowledge into action",
        "system": (
            "You are a practical implementer who bridges the gap between knowing and doing. "
            "You translate abstract knowledge into concrete actions, habits, and decisions. "
            "You think like a coach: what would you actually do differently starting tomorrow?"
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Episode transcript:\n{transcript}\n\n"
            "---\n\n"
            "Turn this knowledge into action:\n\n"
            "**🛠️ Immediate Actions** (This Week)\n"
            "3-5 specific things someone could do in the next 7 days to apply this knowledge.\n\n"
            "**🔄 Habits to Build**\n"
            "What ongoing practices would help someone embody this knowledge?\n\n"
            "**📋 Decision Framework**\n"
            "How should this knowledge change the way someone makes decisions in relevant situations?\n\n"
            "**🚫 Common Mistakes**\n"
            "What do people often get wrong when trying to apply this? How to avoid it?\n\n"
            "**📈 Progress Markers**\n"
            "How would someone know if they're successfully applying this knowledge?\n\n"
            "Be specific and actionable. No vague advice."
        ),
        "temperature": 0.5,
    },
    "historical": {
        "name": "Historical Context",
        "icon": "📜",
        "description": "See through the lens of history",
        "system": (
            "You are a historian who contextualizes present knowledge within the sweep of human history. "
            "You see patterns across time, understand how ideas evolve, and know that the present is always "
            "a conversation with the past. You think like Will Durant or Barbara Tuchman."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Episode transcript:\n{transcript}\n\n"
            "---\n\n"
            "Place this topic in historical context:\n\n"
            "**📜 Historical Arc**\n"
            "How has human understanding of this topic evolved? What were the major turning points?\n\n"
            "**🔄 Patterns & Parallels**\n"
            "What historical patterns or parallels illuminate this topic? Has humanity faced similar questions before?\n\n"
            "**👤 Key Figures**\n"
            "Who were the pivotal people in shaping our understanding? What were their stories?\n\n"
            "**💡 Ideas That Changed**\n"
            "What did people used to believe about this that now seems obviously wrong? What might we be wrong about?\n\n"
            "**🔮 Learning from History**\n"
            "What lessons from history should inform how we think about this today?\n\n"
            "Connect past and present meaningfully."
        ),
        "temperature": 0.6,
    },
    "future": {
        "name": "Future Implications",
        "icon": "🔮",
        "description": "What does this mean for tomorrow?",
        "system": (
            "You are a futurist who extrapolates present knowledge into possible futures. "
            "You think in scenarios, not predictions. You consider how technology, society, and human nature "
            "might interact to create different outcomes. You're rigorous about uncertainty."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Episode transcript:\n{transcript}\n\n"
            "---\n\n"
            "Explore future implications:\n\n"
            "**🔮 Emerging Trends**\n"
            "What current developments suggest where this field is heading?\n\n"
            "**🌍 Three Scenarios** (10-20 years out)\n"
            "- **Optimistic**: If things go well, what could this knowledge enable?\n"
            "- **Pessimistic**: What could go wrong? What are the risks?\n"
            "- **Surprising**: What unexpected direction might this take?\n\n"
            "**🎯 What to Watch**\n"
            "What signals or developments would indicate which scenario is unfolding?\n\n"
            "**🤔 Questions for the Future**\n"
            "What questions will future generations have to answer about this topic?\n\n"
            "**💡 How to Prepare**\n"
            "Given uncertainty, what's the wise way to position ourselves?\n\n"
            "Be imaginative but grounded. Explore possibilities, not fantasies."
        ),
        "temperature": 0.7,
    },
}


def get_addon_prompt(addon_key: str) -> dict | None:
    """Get a learning add-on prompt by key."""
    return LEARNING_ADDONS.get(addon_key)


def get_lens_prompt(lens_key: str) -> dict | None:
    """Get a perspective lens prompt by key."""
    return PERSPECTIVE_LENSES.get(lens_key)


def get_combined_lens_prompt(lens_keys: list[str]) -> dict | None:
    """Create a combined prompt for multiple perspective lenses."""
    if not lens_keys:
        return None

    lenses = [PERSPECTIVE_LENSES[k] for k in lens_keys if k in PERSPECTIVE_LENSES]
    if not lenses:
        return None

    lens_names = " + ".join(lens["name"] for lens in lenses)
    lens_icons = " ".join(lens["icon"] for lens in lenses)

    combined_instructions = "\n\n---\n\n".join(
        f"## {lens['icon']} {lens['name']}\n\n" +
        lens["user_template"].split("---\n\n")[1]  # Get just the instruction part
        for lens in lenses
    )

    return {
        "name": f"Combined Analysis: {lens_names}",
        "icon": lens_icons,
        "description": f"Multi-lens analysis: {lens_names}",
        "system": (
            "You are a multi-disciplinary thinker who can apply multiple analytical frameworks simultaneously. "
            "You weave together different perspectives into a coherent, integrated analysis that is greater "
            "than the sum of its parts. You find the connections between different ways of seeing."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Episode transcript:\n{transcript}\n\n"
            "---\n\n"
            f"Apply these {len(lenses)} analytical lenses to this content. "
            "Weave them together where they connect, but give each its own section:\n\n"
            f"{combined_instructions}\n\n"
            "---\n\n"
            "**🔗 Synthesis: Where the Lenses Converge**\n"
            "What insights emerge from looking at this topic through multiple frameworks simultaneously?"
        ),
        "temperature": 0.65,
        "provider": "anthropic",
        "model_override": "claude-sonnet-4-20250514",
    }


# Legacy exports for backwards compatibility
RESEARCH_STAGE = get_research_stage("10 min")
DRAFT_STAGE = get_draft_stage("10 min")
