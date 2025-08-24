import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createChannelsApi } from '@/lib/api/channelsApi';

const api = createChannelsApi(prisma);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const channel = await api.updateChannel(params.id, body);
    return NextResponse.json(channel);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await api.deleteChannel(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    );
  }
}
