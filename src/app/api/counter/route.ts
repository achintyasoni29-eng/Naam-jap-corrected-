import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/counter - Add chants
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, count = 1, ishtaDevata } = body;

    if (!userId || count <= 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Upsert user profile
    const user = await db.userProfile.upsert({
      where: { id: userId },
      create: {
        id: userId,
        ishtaDevata: ishtaDevata || 'Sri Ram',
        totalChants: count,
      },
      update: {
        totalChants: { increment: count },
        ishtaDevata: ishtaDevata || undefined,
      },
    });

    // Create/update session for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existingSession = await db.session.findFirst({
      where: {
        userId,
        date: { gte: todayStart },
      },
    });

    if (existingSession) {
      await db.session.update({
        where: { id: existingSession.id },
        data: {
          chantCount: { increment: count },
          duration: existingSession.duration + 1,
        },
      });
    } else {
      await db.session.create({
        data: {
          userId,
          ishtaDevata: ishtaDevata || 'Sri Ram',
          chantCount: count,
          duration: 1,
        },
      });
    }

    // Check milestone unlocks
    const milestones = [
      108, 1008, 5000, 10000, 25000, 50000, 100000,
      250000, 500000, 1000000, 2500000, 5000000, 7500000, 10000000,
    ];

    const newUnlocks: number[] = [];
    for (const threshold of milestones) {
      if (user.totalChants >= threshold) {
        const exists = await db.milestone.findFirst({
          where: { userId, threshold },
        });
        if (!exists) {
          await db.milestone.create({
            data: {
              userId,
              threshold,
              name: getMilestoneName(threshold),
              description: getMilestoneDesc(threshold),
              icon: getMilestoneIcon(threshold),
              unlockedAt: new Date(),
            },
          });
          newUnlocks.push(threshold);
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalChants: user.totalChants,
      newMilestones: newUnlocks,
    });
  } catch (error) {
    console.error('Counter API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/counter - Get user stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const user = await db.userProfile.findUnique({
      where: { id: userId },
      include: { milestones: true },
    });

    if (!user) {
      return NextResponse.json({
        totalChants: 0,
        ishtaDevata: 'Sri Ram',
        milestones: [],
      });
    }

    // Get today's session count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySession = await db.session.findFirst({
      where: { userId, date: { gte: todayStart } },
    });

    return NextResponse.json({
      totalChants: user.totalChants,
      ishtaDevata: user.ishtaDevata,
      unlockedMilestones: user.milestones.map(m => m.threshold),
      todayCount: todaySession?.chantCount || 0,
    });
  } catch (error) {
    console.error('Counter GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getMilestoneName(t: number): string {
  const map: Record<number, string> = {
    108: 'First Circle', 1008: 'Awakening', 5000: 'Whispering Pines',
    10000: 'Gate of Peace', 25000: 'Still Waters', 50000: 'Valley of Stillness',
    100000: 'Mountain of Devotion', 250000: 'Celestial River', 500000: 'Golden Dawn',
    1000000: 'Million Lotus', 2500000: 'Eternal Garden', 5000000: 'Halfway to Infinity',
    7500000: 'Crown of Stars', 10000000: 'One Crore',
  };
  return map[t] || `${t} Chants`;
}

function getMilestoneDesc(t: number): string {
  const map: Record<number, string> = {
    108: 'Your first mala is complete',
    1008: 'The seed of devotion sprouts',
    5000: 'The forest listens to your chant',
    10000: 'A threshold crossed in silence',
    25000: 'Reflection becomes your nature',
    50000: 'The valley echoes your naam',
    100000: 'The summit reveals the cosmos',
    250000: 'Your chants flow like the Ganges',
    500000: 'The first light of true devotion',
    1000000: 'A million petals of pure intention',
    2500000: 'Walking among divine blossoms',
    5000000: 'Five million names merge with the cosmos',
    7500000: 'The universe crowns your persistence',
    10000000: 'The ultimate merger with the divine',
  };
  return map[t] || `You have completed ${t} chants`;
}

function getMilestoneIcon(t: number): string {
  const map: Record<number, string> = {
    108: 'filter_vintage', 1008: 'spa', 5000: 'park',
    10000: 'filter_vintage', 25000: 'waves', 50000: 'wb_twilight',
    100000: 'landscape', 250000: 'water', 500000: 'wb_sunny',
    1000000: 'local_florist', 2500000: 'yard', 5000000: 'stars',
    7500000: 'auto_awesome', 10000000: 'brightness_7',
  };
  return map[t] || 'emoji_events';
}
