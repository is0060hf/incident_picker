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
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing from or to parameter' },
        { status: 400 }
      );
    }

    const api = createDashboardApi(prisma);
    const trends = await api.getTrends(new Date(from), new Date(to));
    return NextResponse.json(trends);
  } catch (error) {
    console.error('Error getting trends:', error);
    return NextResponse.json(
      { error: 'Failed to get trends' },
      { status: 500 }
    );
  }
}
