import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAuditApi } from '@/lib/api/auditApi';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const filters: any = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const userId = searchParams.get('userId');
    if (userId) {
      filters.userId = userId;
    }

    const action = searchParams.get('action');
    if (action) {
      filters.action = action.split(',');
    }

    const targetType = searchParams.get('targetType');
    if (targetType) {
      filters.targetType = targetType;
    }

    const targetId = searchParams.get('targetId');
    if (targetId) {
      filters.targetId = targetId;
    }

    const from = searchParams.get('from');
    if (from) {
      filters.from = new Date(from);
    }

    const to = searchParams.get('to');
    if (to) {
      filters.to = new Date(to);
    }

    const api = createAuditApi(prisma);
    const result = await api.getAuditLogs(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
