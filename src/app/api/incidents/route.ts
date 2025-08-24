import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createIncidentsApi } from '@/lib/api/incidentsApi';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const api = createIncidentsApi(prisma);

    const params = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      q: searchParams.get('q') || undefined,
      from: searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined,
      to: searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined,
      urgency: searchParams.getAll('urgency').filter(v => ['high', 'medium', 'low'].includes(v)) as any,
      impact: searchParams.getAll('impact').filter(v => ['high', 'medium', 'low'].includes(v)) as any,
      type: searchParams.get('type') as '障害' | '不具合' | undefined,
      status: searchParams.getAll('status').filter(v => ['open', 'in_progress', 'resolved', 'closed'].includes(v)) as any,
    };

    // 空配列の場合はundefinedに
    if (params.urgency?.length === 0) params.urgency = undefined;
    if (params.impact?.length === 0) params.impact = undefined;
    if (params.status?.length === 0) params.status = undefined;

    const result = await api.listIncidents(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing incidents:', error);
    return NextResponse.json(
      { error: 'Failed to list incidents' },
      { status: 500 }
    );
  }
}
