import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createRulesApi } from '@/lib/api/rulesApi';

const api = createRulesApi(prisma);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enabled = searchParams.get('enabled');
    
    const options = enabled !== null ? {
      enabled: enabled === 'true'
    } : undefined;

    const rules = await api.listUrgencyRules(options);
    return NextResponse.json(rules);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch urgency rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rule = await api.createUrgencyRule(body);
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create urgency rule' },
      { status: 500 }
    );
  }
}
