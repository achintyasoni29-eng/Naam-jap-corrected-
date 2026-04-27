import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/feed - Get devotion feed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const feed = await db.devotionFeed.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ feed });
  } catch (error) {
    console.error('Feed GET error:', error);
    return NextResponse.json({ feed: [] });
  }
}

// POST /api/feed - Add devotion feed item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, city, userName, avatarUrl, chantCount } = body;

    if (!type || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const feedItem = await db.devotionFeed.create({
      data: {
        type,
        message,
        city,
        userName,
        avatarUrl,
        chantCount,
      },
    });

    return NextResponse.json({ success: true, item: feedItem });
  } catch (error) {
    console.error('Feed POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
