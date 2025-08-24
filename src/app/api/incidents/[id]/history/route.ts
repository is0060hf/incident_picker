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
    const history = await api.getIncidentHistory(params.id);
    
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error getting incident history:', error);
    return NextResponse.json(
      { error: 'Failed to get incident history' },
      { status: 500 }
    );
  }
}
