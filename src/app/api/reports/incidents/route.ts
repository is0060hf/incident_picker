import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createReportApi } from '@/lib/api/reportApi';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const filters: any = {};

    // URLパラメータからフィルターを構築
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

    const api = createReportApi(prisma);
    const result = await api.generateIncidentReport(
      Object.keys(filters).length > 0 ? filters : undefined
    );

    // CSVをダウンロード可能な形式で返す
    return new NextResponse(result.csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating incident report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
