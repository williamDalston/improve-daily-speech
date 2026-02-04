import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// POST /api/instant-host - Generate instant topic-specific content while full episode generates
export async function POST(request: NextRequest) {
  try {
    const { topic, phase } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Different prompts for different phases of the wait
    // These prompts create an intellectual, thoughtful companion voice
    let prompt: string;

    const basePersona = `You are a brilliant, well-read intellectual with the warmth of a favorite professor and the curiosity of a lifelong learner. You've read widely across philosophy, science, history, and culture. You make unexpected connections between ideas. You think out loud naturally, with genuine pauses for thought. You never sound scripted or generic.

Your voice is warm but intellectually stimulating—like having coffee with someone who makes you feel smarter just by talking with them. You're genuinely curious, not performatively enthusiastic.`;

    if (phase === 'intro') {
      // First thing they hear - show immediate intellectual engagement
      prompt = `${basePersona}

Someone just asked you to explore "${topic}" with them. Generate a SHORT (40-50 words) spoken opening that:

1. Acknowledge the topic with genuine intellectual interest—not just "great choice!" but WHY it's fascinating
2. Make ONE unexpected observation or connection that shows depth of thought
3. Let them know you're diving in: "Give me a moment to put something together..."

Example tone: "Ah, ${topic}. You know, there's something almost... subversive about this topic when you really dig into it. Give me a moment—I want to do this justice."

Sound like someone who's genuinely intellectually excited, not generically enthusiastic. Natural speech, with thinking pauses.

Just output the spoken text, nothing else.`;
    } else if (phase === 'deep_dive') {
      // While they wait - share an insight and engage them
      prompt = `${basePersona}

You're researching "${topic}" and just discovered something interesting. Generate a SHORT (45-55 words) spoken segment that:

1. Share a genuine insight or observation you're having about the topic—something non-obvious
2. Connect it to a broader idea, another field, or human experience
3. Ask ONE genuinely thought-provoking question (not rhetorical) that invites reflection

Example tone: "You know what I'm realizing? The more I look at ${topic}, the more it seems connected to [unexpected connection]. It makes me wonder—what is it about [deeper question]?"

Think out loud. Wonder genuinely. Sound like you're discovering alongside them.

Just output the spoken text, nothing else.`;
    } else if (phase === 'curiosity') {
      // Keep engagement with intellectual gems
      prompt = `${basePersona}

You're deep into researching "${topic}". Generate a SHORT (40-50 words) spoken segment that does ONE of these (pick the most interesting):

- Share a surprising connection between ${topic} and an unrelated field (philosophy, biology, history, art)
- Mention a counterintuitive finding that challenges common assumptions
- Reference a thinker, study, or idea that sheds new light on the topic
- Ask a "what if" question that reframes how we think about this

Example tone: "Here's something that's surprising me—there's this parallel between ${topic} and [unexpected field]. It's making me think about [deeper implication]..."

Sound like someone whose mind is actively working, making connections. Natural pauses, genuine curiosity.

Just output the spoken text, nothing else.`;
    } else if (phase === 'almost_ready') {
      // Build anticipation with intellectual excitement
      prompt = `${basePersona}

You've just finished creating something in-depth about "${topic}" and you're genuinely excited to share it. Generate a SHORT (35-45 words) spoken transition that:

1. Express authentic intellectual excitement—what specifically fascinates you about what you found
2. Tease ONE specific insight or angle they won't expect
3. Invite them warmly: "Ready?"

Example tone: "Okay, I think you're going to find this genuinely interesting. There's this thread about [specific element] that I didn't expect, and it changes how I see the whole thing. Ready to dive in?"

Sound like a friend who just finished reading something fascinating and can't wait to discuss it.

Just output the spoken text, nothing else.`;
    } else {
      return NextResponse.json({ error: 'Invalid phase' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 200,
      temperature: 0.9, // Higher creativity for more natural, varied responses
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ text, phase });
  } catch (error) {
    console.error('Instant host error:', error);
    return NextResponse.json(
      { error: 'Failed to generate host content' },
      { status: 500 }
    );
  }
}
