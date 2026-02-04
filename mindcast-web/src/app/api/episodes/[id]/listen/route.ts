import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { markListened } from '@/lib/spaced-repetition';

// POST /api/episodes/[id]/listen - Mark episode as listened
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await markListened(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark listened error:', error);
    return NextResponse.json(
      { error: 'Failed to mark as listened' },
      { status: 500 }
    );
  }
}
