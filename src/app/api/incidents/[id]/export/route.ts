import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createIncidentDetailApi } from '@/lib/api/incidentDetailApi';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const api = createIncidentDetailApi(prisma);
    const exportData = await api.exportIncidentData(params.id);
    
    if (!exportData) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Content-Dispositionヘッダーを設定してダウンロード可能にする
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set(
      'Content-Disposition',
      `attachment; filename="incident-${params.id}-${new Date().toISOString()}.json"`
    );

    return new NextResponse(JSON.stringify(exportData, null, 2), { headers });
  } catch (error) {
    console.error('Error exporting incident:', error);
    return NextResponse.json(
      { error: 'Failed to export incident' },
      { status: 500 }
    );
  }
}
