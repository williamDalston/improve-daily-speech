"""
All prompt stages for the speech generation pipeline.

Pipeline flow:
  Stage 0: Research Gathering (collect facts, studies, figures)
  Stage 1: Initial Script (3 parallel drafts via different providers/temps)
  Judge:   Select best draft
  Stage 2: Artistic & Rhetorical Enhancement
  Critique 2→3: Evaluate before academic pass
  Stage 3: Academic Depth
  Critique 3→4: Evaluate before humanization
  Stage 4: Humanization
  Critique 4→5: Evaluate before final polish
  Stage 5: Final Polish

Every stage after Stage 0 receives the original topic + research brief for context.
"""

# Speech length presets
SPEECH_LENGTHS = {
    "5 min": {"minutes": 5, "words_min": 750, "words_max": 900},
    "10 min": {"minutes": 10, "words_min": 1500, "words_max": 1800},
    "15 min": {"minutes": 15, "words_min": 2250, "words_max": 2700},
    "20 min": {"minutes": 20, "words_min": 3000, "words_max": 3600},
}


def get_research_stage(length_key: str = "10 min") -> dict:
    """Get research stage config with dynamic length."""
    length = SPEECH_LENGTHS[length_key]
    return {
        "name": "Stage 0: Research Gathering",
        "description": "Collects key facts, studies, figures, debates, and historical milestones on the topic",
        "system": (
            "You are a meticulous research assistant with expertise across all academic disciplines. "
            "You produce structured research briefs that give a writer everything they need to create "
            "authoritative, specific, and deeply grounded content."
        ),
        "user_template": (
            f"I need to write a {length['minutes']}-minute expert-level speech on the topic: '{{topic}}'\n\n"
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
        "model_override": "claude-opus-4-0-20250514",
    }


def get_draft_stage(length_key: str = "10 min") -> dict:
    """Get draft stage config with dynamic length."""
    length = SPEECH_LENGTHS[length_key]
    return {
        "name": "Stage 1: Initial Script",
        "description": f"Creates the foundational speech script (~{length['words_min']}-{length['words_max']} words)",
        "system": (
            "You are a world-class speechwriter and intellectual communicator. "
            "You write with the depth of a top-tier academic and the warmth of an intimate conversation. "
            "Your scripts sound like a brilliantly informed expert speaking directly to one person, not delivering a speech."
        ),
        "user_template": (
            "Topic: '{topic}'\n\n"
            "Research brief to draw from (use specific details from this):\n{research}\n\n"
            "---\n\n"
            "Objective:\n\n"
            "Create an eloquent, intellectually sophisticated, and deeply engaging script on the topic of '{topic}'. "
            "The outcome should be varied and different from any other scripts we've made together. "
            "Don't use obvious patterns that an LLM would use, but keep it as if an analysis of the text would confirm it as human written. "
            "Use different vocabulary that previous scripts, nouns and verb choices, etc. "
            "The script should not only inform but also captivate, inspire, and challenge viewers, leaving them with a lasting intellectual and emotional impact. "
            "It should reflect the gravitas of a top-tier academic lecture while utilizing storytelling and cinematic techniques to foster connection and curiosity. "
            f"The goal is to invite viewers on a {length['minutes']}-minute journey of discovery, guided by profound insights and surprising revelations. "
            "Do not speak with fluff; it should use rhetoric with substance, and details about the central chain of insights and studies or breakthrough observations, and the way practitioners think in the field. "
            "Do not use headers. I want you give it all to me in a form that I can read it right away. "
            "It shouldn't sound like a speech, but like a very-well informed expert is having an intimate talk with the hearer.\n\n"
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
            "Provide a brief, exciting overview of what the video will cover without revealing all the details.\n"
            "Foreshadow major revelations to build anticipation.\n"
            "Example: \"By the end of this video, you'll perceive {topic} through an entirely new perspective.\"\n"
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
            "Remember to sound intimate throughout and not like someone removed, giving a speech. "
            "If you think your output is good, try to make it even more dense with the field's insights, and advances in concepts, "
            "and connect the dots fluidly, and only then give it to me."
        ),
        "temperature": 0.9,
        "provider": "anthropic",
        "model_override": "claude-opus-4-0-20250514",
    }


# --- Draft variants for parallel generation (all use best models) ---
DRAFT_VARIANTS = [
    {
        "label": "Draft A (Claude Opus, high creativity)",
        "provider": "anthropic",
        "model_override": "claude-opus-4-0-20250514",
        "temperature": 0.95,
    },
    {
        "label": "Draft B (Claude Opus, balanced)",
        "provider": "anthropic",
        "model_override": "claude-opus-4-0-20250514",
        "temperature": 0.7,
    },
    {
        "label": "Draft C (GPT-4o, different perspective)",
        "provider": "openai",
        "model_override": "gpt-4o-2024-11-20",
        "temperature": 0.85,
    },
]

# --- Judge: Select best draft (Opus for best judgment) ---
JUDGE_PROMPT = {
    "name": "Judge: Select Best Draft",
    "description": "Evaluates 3 parallel drafts and selects the strongest one",
    "system": (
        "You are a world-class editor and literary critic. You evaluate writing with ruthless precision, "
        "scoring on originality, intellectual depth, emotional resonance, specificity of evidence, "
        "and how human/natural the voice sounds. You do NOT write — you only judge."
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
    "model_override": "claude-opus-4-0-20250514",
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

# --- Enhancement stages (all use Opus for highest quality) ---
ENHANCEMENT_STAGES = [
    {
        "name": "Stage 2: Artistic & Rhetorical Enhancement",
        "description": "Enhances with artistic flair, rhetorical devices, and deeper insights",
        "system": (
            "You are a master literary artist, rhetoric specialist, and intellectual enhancer. "
            "You elevate writing by weaving in rhetorical devices, vivid imagery, and profound depth "
            "while preserving every piece of existing content."
        ),
        "user_template": (
            "Topic: '{topic}'\n"
            "Research brief for reference:\n{research}\n\n"
            "Critique from editorial review (address these issues):\n{critique}\n\n"
            "---\n\n"
            "Without losing any of the content already included, please enhance the following output using this advice:\n\n"
            "{previous_output}\n\n"
            "First I want you to enhance the intellectual stimulation of it, by adding some extra hyper-expert insight. "
            "Add some historical elements, describing insights accumulated. Then:\n\n"
            "If something is implied, there is no need to write it out.\n\n"
            "As you write, if appropriate, shift at some point out of and in an artful way the perspectives on the topic.\n\n"
            "Vary sentence length: Use a mix of short, medium, and long sentences to create a natural rhythm and maintain "
            "the reader's interest. Short sentences can provide emphasis, while longer sentences can convey complex ideas or descriptions.\n\n"
            "Use strong, specific verbs: Choose precise and evocative verbs to convey action and emotion. "
            "Strong verbs can bring your writing to life and reduce the need for adverbs.\n\n"
            "Parallel structure: Employ parallelism to create a sense of balance and harmony in your sentences. "
            "This involves using similar grammatical structures for related ideas or items in a list.\n\n"
            "Active voice: Write in the active voice whenever possible, as it makes your sentences more direct and engaging. "
            "The active voice clearly identifies the subject and the action they are performing.\n\n"
            "Sensory details: Include sensory details to create vivid, immersive descriptions that engage the reader's senses. "
            "This can help make your sentences more evocative and memorable.\n\n"
            "Avoid clichés and overused phrases: Strive for originality in your phrasing and avoid relying on clichés or "
            "overused expressions. This can make your writing feel fresh and distinctive.\n\n"
            "Concision: Eliminate unnecessary words and phrases, focusing on clarity and precision. "
            "Aim to convey your meaning in as few words as possible without sacrificing clarity or style.\n\n"
            "Varied sentence structure: Experiment with different sentence structures, such as compound, complex, or "
            "compound-complex sentences. This can create variety and keep your paragraphs from feeling monotonous.\n\n"
            "Balance and contrast: Create balance and contrast within sentences and paragraphs by juxtaposing opposing ideas "
            "or contrasting descriptions. This can add depth and interest to your writing.\n\n"
            "Transition words and phrases: Use transition words and phrases to connect ideas and guide the reader through your "
            "paragraphs. This helps maintain a logical flow and coherence in your writing.\n\n"
            "Read your work aloud: Read your sentences and paragraphs aloud to assess their rhythm, flow, and overall sound. "
            "This can help you identify areas that need improvement and fine-tune your writing style.\n\n"
            "Show, don't tell: Use specific actions, events, and imagery to convey emotions, thoughts, and character development "
            "rather than simply stating them.\n\n"
            "Use concrete images: Focus on writing sentences that are associated with a concrete image to keep the reader's attention.\n\n"
            "Balance rhetorical techniques so it moves forward in an enchanting way, but not so sporadically, but in tasteful moments.\n\n"
            "Focus on script development: the writing should have a unique personality, backstory, goals, and characteristics "
            "that the reader can relate to and engage with.\n\n"
            "Incorporate undertones: When appropriate to create an emotional connection and add depth to the narrative.\n\n"
            "Answer open questions: Ensure that all questions raised in the story are somewhat answered, guided, or resolved by the end, "
            "to provide the reader with a sense of closure and satisfaction.\n\n"
            "Maintain the detailed structure to help guide the writing process and maintain consistency throughout the script.\n\n"
            "Use conflict and tension: Introduce conflicts and tension, both internal and external, to keep the reader engaged "
            "and invested in the story.\n\n"
            "Incorporate subplots: Weave in subplots to add dimension to the story and further develop the characters.\n\n"
            "Revise and refine: Continuously revise and refine the writing, taking into account feedback and suggestions for "
            "improvement to create a polished final product.\n\n"
            "Also, keep in mind these rhetorical devices:\n\n"
            "Alliteration, Polyptoton, Antithesis, Merism, Blazon, Synaesthesia, Aposiopesis, Hyperbaton, "
            "Anadiplosis, Periodic Sentence, Hypotaxis & Parataxis, Diacope, Rhetorical Question, Hendiadys, "
            "Epistrophe, Tricolon, Epizeuxis, Syllepsis, Isocolon, Enallage, Zeugma, Paradox, Chiasmus, "
            "Assonance, Catachresis, Litotes, Metonymy & Synecdoche, Transferred Epithets, Pleonasm, "
            "Epanalepsis, Personification, Hyperbole, Adynaton, Prolepsis, Congeries, Scesis Onomaton, Anaphora.\n\n"
            "Use these tastefully throughout — not all at once, but woven in at natural moments.\n\n"
            "The writing and ideas should be extremely deep, profound, and beautiful. "
            "It should likewise take the hearer on a transformation through himself, potentially helping gain enlightenment. "
            "Revise your outline at least 20 times to improve it, so that it becomes the best script ever written. "
            "For all this, please make sure there is a deep review of principles, insights, advances, etc."
        ),
        "temperature": 0.7,
        "provider": "anthropic",
        "model_override": "claude-opus-4-0-20250514",
    },
    {
        "name": "Stage 3: Academic Depth",
        "description": "Weaves in theoretical frameworks, experiments, and key discoveries",
        "system": (
            "You are an academic researcher and intellectual synthesizer with deep expertise across multiple disciplines. "
            "You enrich narratives with rigorous academic content while maintaining readability and engagement."
        ),
        "user_template": (
            "Topic: '{topic}'\n"
            "Research brief for reference:\n{research}\n\n"
            "Critique from editorial review (address these issues):\n{critique}\n\n"
            "---\n\n"
            "Without losing anything written, expand the following script by weaving in important theoretical frameworks, "
            "experimental breakthroughs, and key discoveries that have shaped the field discussed in this text. "
            "Be detailed in describing how processes play out practically. "
            "Dive into the intellectual traditions that ground the field and highlight the academic debates and controversies "
            "that have defined its evolution. Include specific experiments or studies that have pushed the boundaries of knowledge, "
            "referencing key findings and their implications. Explore the implications of these insights on both the theoretical "
            "and practical levels, providing a broad understanding of how the field has evolved over time. "
            "Ensure that the achievements are seamlessly integrated to add width, depth, and breadth, enriching the narrative "
            "with a balance of historical context, cutting-edge advancements, and open questions. "
            "The goal is to present the field in a way that emphasizes the interplay between theory and experimentation, "
            "illustrating the dynamic progress made, a recent advance if applicable, and the challenges that lie ahead.\n\n"
            "Here is the script:\n\n"
            "{previous_output}"
        ),
        "temperature": 0.5,
        "provider": "anthropic",
        "model_override": "claude-opus-4-0-20250514",
    },
    {
        "name": "Stage 4: Humanization",
        "description": "Adds natural rhythm, imperfections, subtext, and human voice",
        "system": (
            "You are an expert editor specializing in making polished text feel authentically human. "
            "You add warmth, spontaneity, and natural speech patterns while preserving intellectual depth."
        ),
        "user_template": (
            "Topic: '{topic}'\n"
            "Research brief for reference (ensure facts remain accurate):\n{research}\n\n"
            "Critique from editorial review (address these issues):\n{critique}\n\n"
            "---\n\n"
            "Please take the following text and apply these strategies to give me the final most polished version:\n\n"
            "Refining Text to Evoke a Human Touch\n\n"
            "Sentence Structure and Length:\n"
            "Break rhythm by varying sentence length intentionally. Use short, punchy sentences for emphasis, "
            "longer flowing sentences for complex ideas. Mix in fragments that reflect natural thought.\n\n"
            "Subtle Shifts in Thought:\n"
            "Introduce digressions or non-linear thinking. Use abrupt tone shifts, personal reflections, or subtle "
            "humor to disrupt the narrative.\n\n"
            "Embrace Imperfection & Complexity in Grammar:\n"
            "Include sentence fragments, casual colloquialisms, and moments of less-than-perfect grammar as stylistic choices.\n\n"
            "Implicitness and Subtext:\n"
            "Allow the reader to infer meaning. Use imagery and metaphor. Let connections emerge organically.\n\n"
            "Unpredictable Emotional Fluctuations:\n"
            "Inject sudden emotional depth — sarcasm, frustration, enthusiasm, vulnerability.\n\n"
            "Fewer Transitions:\n"
            "Reduce obvious transition phrases. Let ideas flow organically.\n\n"
            "Original Phrasing:\n"
            "Craft unique expressions. Avoid clichés. Insert personal voice and unconventional metaphors.\n\n"
            "Personal & Historical References:\n"
            "Bring in obscure historical references that reveal deeper connection to the subject.\n\n"
            "Unpredictable Argumentation:\n"
            "Break the mold. Leave certain conclusions open-ended. Present surprising perspectives.\n\n"
            "Tone Shifts & Contradictions:\n"
            "Shift tone — analytical to poetic, formal to casual, confident to skeptical.\n\n"
            "Creative Word Choice:\n"
            "Use words that evoke distinct imagery. Regional or historical terms. Let diction reflect a unique voice.\n\n"
            "Additional: Introduce subtle humor or irony. Challenge the reader with open-ended questions. "
            "Keep all depth and complexity. Do not lose formal depth. Do not remove any content.\n\n"
            "Here is the text:\n\n"
            "{previous_output}"
        ),
        "temperature": 0.8,
        "provider": "anthropic",
        "model_override": "claude-opus-4-0-20250514",
    },
    {
        "name": "Stage 5: Final Polish",
        "description": "Line-by-line refinement, restoring scientific rigor with human tone",
        "system": (
            "You are a meticulous final-pass editor. You go line by line, ensuring every word earns its place. "
            "You maintain scientific accuracy and human authenticity in equal measure."
        ),
        "user_template": (
            "Topic: '{topic}'\n"
            "Research brief (verify all facts against this):\n{research}\n\n"
            "Critique from editorial review (final check — address any remaining issues):\n{critique}\n\n"
            "---\n\n"
            "Take the following text and subtly edit it with additions or word or sentence structure changes after internally "
            "going through it line by line, to make sure everything is perfectly and carefully chosen for effect. "
            "Maintain a stronger presence of scientific theories, discoveries, and debates, keeping a casual rigor in the text. "
            "Do not remove any content.\n\n"
            "Restore all key theories, breakthroughs, and discoveries while keeping the new human tone intact.\n\n"
            "Here is the text:\n\n"
            "{previous_output}"
        ),
        "temperature": 0.3,
        "provider": "anthropic",
        "model_override": "claude-opus-4-0-20250514",
    },
]

# --- Previous speeches memory (stores opening paragraphs for differentiation) ---
DIFFERENTIATION_CONTEXT = (
    "IMPORTANT: Here are opening paragraphs from previous speeches we've generated. "
    "Your script MUST use a completely different opening technique, different vocabulary patterns, "
    "and a different structural approach than these:\n\n{previous_openings}\n\n---\n\n"
)

# Legacy exports for backwards compatibility
RESEARCH_STAGE = get_research_stage("10 min")
DRAFT_STAGE = get_draft_stage("10 min")
