import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createDashboardApi } from '@/lib/api/dashboardApi';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const api = createDashboardApi(prisma);
    const stats = await api.getChannelStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting channel stats:', error);
    return NextResponse.json(
      { error: 'Failed to get channel stats' },
      { status: 500 }
    );
  }
}
