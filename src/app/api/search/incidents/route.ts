import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createSearchApi } from '@/lib/api/searchApi';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const filters: any = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // フィルターパラメータの取得
    const urgency = searchParams.get('urgency');
    if (urgency) {
      filters.urgency = urgency.split(',');
    }

    const impact = searchParams.get('impact');
    if (impact) {
      filters.impact = impact.split(',');
    }

    const type = searchParams.get('type');
    if (type) {
      filters.type = type;
    }

    const status = searchParams.get('status');
    if (status) {
      filters.status = status.split(',');
    }

    const from = searchParams.get('from');
    if (from) {
      filters.from = new Date(from);
    }

    const to = searchParams.get('to');
    if (to) {
      filters.to = new Date(to);
    }

    const channelId = searchParams.get('channelId');
    if (channelId) {
      filters.channelId = channelId;
    }

    const includeThreads = searchParams.get('includeThreads');
    if (includeThreads === 'true') {
      filters.includeThreads = true;
    }

    const api = createSearchApi(prisma);
    const result = await api.searchIncidents(query, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to search incidents' },
      { status: 500 }
    );
  }
}
