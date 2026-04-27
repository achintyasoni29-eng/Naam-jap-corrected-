import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/global-counter - Get global chant count
export async function GET() {
  try {
    let counter = await db.globalCounter.findFirst();

    if (!counter) {
      counter = await db.globalCounter.create({
        data: { totalChants: 1_200_000_000 },
      });
    }

    return NextResponse.json({
      totalChants: counter.totalChants,
    });
  } catch (error) {
    console.error('Global counter error:', error);
    return NextResponse.json({ totalChants: 1_200_000_000 });
  }
}

// POST /api/global-counter - Increment global count
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { count = 1 } = body;

    let counter = await db.globalCounter.findFirst();
    if (!counter) {
      counter = await db.globalCounter.create({
        data: { totalChants: count },
      });
    } else {
      counter = await db.globalCounter.update({
        where: { id: counter.id },
        data: { totalChants: { increment: count } },
      });
    }

    return NextResponse.json({ totalChants: counter.totalChants });
  } catch (error) {
    console.error('Global counter POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
