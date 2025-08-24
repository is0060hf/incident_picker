import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSlackClient } from '@/lib/slack/slackClient';
import { createSlackFetchApi } from '@/lib/api/slackFetchApi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, startDate, endDate } = body;

    // Validate input
    if (!channelId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get Slack token from environment
    const slackToken = process.env.SLACK_BOT_TOKEN;
    if (!slackToken) {
      return NextResponse.json(
        { error: 'Slack bot token not configured' },
        { status: 500 }
      );
    }

    // Create API instances
    const slackClient = createSlackClient(slackToken);
    const fetchApi = createSlackFetchApi(prisma, slackClient);

    // Fetch messages
    const result = await fetchApi.fetchChannelMessages({
      channelId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Slack fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
