import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createIncidentsApi } from '@/lib/api/incidentsApi';
import { withErrorHandling, AuthenticationError, ValidationError } from '@/lib/errors';
import { validationSchemas, parseArrayParam } from '@/lib/validation';

// リクエストパラメータのスキーマ
const listIncidentsSchema = z.object({
  page: validationSchemas.page,
  limit: validationSchemas.limit,
  q: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  urgency: z.array(validationSchemas.urgency).optional(),
  impact: z.array(validationSchemas.impact).optional(),
  type: validationSchemas.incidentTypeOptional,
  status: z.array(validationSchemas.status).optional(),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  // 認証チェック
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new AuthenticationError();
  }

  // パラメータの取得とバリデーション
  const { searchParams } = new URL(request.url);
  
  const params = {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
    q: searchParams.get('q') || undefined,
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
    urgency: parseArrayParam(searchParams.get('urgency')),
    impact: parseArrayParam(searchParams.get('impact')),
    type: searchParams.get('type') || undefined,
    status: parseArrayParam(searchParams.get('status')),
  };

  // バリデーション
  const validationResult = listIncidentsSchema.safeParse(params);
  if (!validationResult.success) {
    throw new ValidationError('Invalid parameters', validationResult.error.flatten());
  }

  // API呼び出し
  const api = createIncidentsApi(prisma);
  const result = await api.listIncidents({
    ...validationResult.data,
    from: validationResult.data.from ? new Date(validationResult.data.from) : undefined,
    to: validationResult.data.to ? new Date(validationResult.data.to) : undefined,
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
