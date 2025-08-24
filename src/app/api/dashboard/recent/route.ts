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
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const api = createDashboardApi(prisma);
    const recent = await api.getRecentIncidents(limit);
    return NextResponse.json(recent);
  } catch (error) {
    console.error('Error getting recent incidents:', error);
    return NextResponse.json(
      { error: 'Failed to get recent incidents' },
      { status: 500 }
    );
  }
}
