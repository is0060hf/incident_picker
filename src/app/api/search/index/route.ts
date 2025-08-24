import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createSearchApi } from '@/lib/api/searchApi';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messageId } = body;

    const api = createSearchApi(prisma);
    const result = await api.updateSearchIndex(messageId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating search index:', error);
    return NextResponse.json(
      { error: 'Failed to update search index' },
      { status: 500 }
    );
  }
}
