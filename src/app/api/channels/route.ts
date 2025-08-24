import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createChannelsApi } from '@/lib/api/channelsApi';

const api = createChannelsApi(prisma);

export async function GET() {
  try {
    const channels = await api.listChannels();
    return NextResponse.json(channels);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const channel = await api.createChannel(body);
    return NextResponse.json(channel, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Channel with this Slack ID already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    );
  }
}
