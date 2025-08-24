import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createRulesApi } from '@/lib/api/rulesApi';

const api = createRulesApi(prisma);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const rule = await api.updateUrgencyRule(params.id, body);
    return NextResponse.json(rule);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Urgency rule not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update urgency rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await api.deleteUrgencyRule(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Urgency rule not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete urgency rule' },
      { status: 500 }
    );
  }
}
