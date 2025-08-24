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
    const filters: any = {};

    const from = searchParams.get('from');
    if (from) {
      filters.from = new Date(from);
    }

    const to = searchParams.get('to');
    if (to) {
      filters.to = new Date(to);
    }

    const api = createAuditApi(prisma);
    const result = await api.getUserActivity(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}
