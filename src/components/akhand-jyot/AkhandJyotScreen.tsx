'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Heart,
  Flame,
  Sparkles,
  Sun,
  Camera,
  Trophy,
  Users,
  MapPin,
} from 'lucide-react';

import { useNaamJapStore, MILESTONES } from '@/lib/store';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface FeedEntry {
  id: string;
  name: string;
  city: string;
  avatar: string;
  message: string;
  icon: 'heart' | 'camera' | 'sparkle' | 'flame';
  iconColor: string;
  isUser: boolean;
  timestamp: number;
  chantCount?: number;
}

/* ------------------------------------------------------------------ */
/*  Motivational Data — Authentic devotional names & cities             */
/* ------------------------------------------------------------------ */
const DEVOTEE_NAMES = [
  'Priya Sharma', 'Rajesh Patel', 'Ananya Singh', 'Vikram Joshi',
  'Meera Iyer', 'Arjun Reddy', 'Lakshmi Nair', 'Deepak Verma',
  'Kavitha Menon', 'Suresh Kumar', 'Padma Devi', 'Ravi Shankar',
  'Aarti Mishra', 'Karthik Rao', 'Sneha Gupta', 'Amit Tiwari',
  'Sunita Bali', 'Nikhil Desai', 'Pooja Thakur', 'Sanjay Mishra',
  'Divya Saxena', 'Manish Agarwal', 'Ritu Pandey', 'Ashwin Rao',
  'Bharathi Raman', 'Chirag Shah', 'Damini Joshi', 'Eshwar Prasad',
  'Gauri Kulkarni', 'Harish Chandra', 'Ishaan Kapoor', 'Jayanti Devi',
  'Kamalakshi Rao', 'Lalitha Naidu', 'Mahesh Babu', 'Nandini Pillai',
  'Om Prakash', 'Pranav Hegde', 'Qureshi Begum', 'Revathi Krishnan',
  'Shashi Bala', 'Tulsi Devi', 'Uma Mahesh', 'Venkat Raman',
  'Wasim Ali', 'Yamini Iyer', 'Zara Sheikh', 'Aditya Narayan',
  'Bhavana Patel', 'Chandrashekhar', 'Durga Prasad', 'Eknath Pawar',
  'Gayatri Joshi', 'Hari Om', 'Inderjeet Kaur', 'Jitendra Sharma',
  'Kalyani Murthy', 'Loknath Mishra', 'Madhavi Rao', 'Niranjan Das',
];

const DEVOTEE_CITIES = [
  'Varanasi', 'Rishikesh', 'Haridwar', 'Mathura', 'Ayodhya',
  'Vrindavan', 'Puri', 'Dwarka', 'Rameshwaram', 'Kanchipuram',
  'Tirupati', 'Amritsar', 'Ajmer', 'Shirdi', 'Bodh Gaya',
  'Nashik', 'Ujjain', 'Gaya', 'Prayagraj', 'Mayapur',
  'Ahmedabad', 'Jaipur', 'Chennai', 'Bangalore', 'Hyderabad',
  'Mumbai', 'Delhi', 'Kolkata', 'Pune', 'Thiruvananthapuram',
  'Guwahati', 'Jodhpur', 'Mysore', 'Ranchi', 'Bhopal',
  'Lucknow', 'Patna', 'Bhubaneswar', 'Chandigarh', 'Dehradun',
];

const DEVOTIONAL_MESSAGES = [
  (name: string, deity: string, count: number) =>
    `${name} chanted ${count.toLocaleString('en-IN')} names of ${deity}`,
  (name: string, deity: string, count: number) =>
    `${name} completed ${count.toLocaleString('en-IN')} jaap of ${deity}`,
  (name: string, deity: string, count: number) =>
    `${name}'s devotion grew by ${count.toLocaleString('en-IN')} chants`,
  (name: string, deity: string, count: number) =>
    `${name} offered ${count.toLocaleString('en-IN')} chants at the lotus feet of ${deity}`,
  (name: string, deity: string, count: number) =>
    `${name} meditated on ${count.toLocaleString('en-IN')} names of ${deity}`,
];

const ISHTA_OPTIONS = [
  'Sri Ram', 'Shiva', 'Radha Krishna', 'Hanuman', 'Durga',
  'Ganesh', 'Lakshmi', 'Saraswati', 'Sai Baba', 'Murugan',
  'Vishnu', 'Shakti', 'Rama', 'Krishna', 'Surya',
];

const MILESTONE_MESSAGES = [
  (name: string, milestone: string) =>
    `${name} unlocked "${milestone}" on their spiritual path`,
  (name: string, milestone: string) =>
    `${name} reached a new milestone: ${milestone}`,
  (name: string, milestone: string) =>
    `Congratulations to ${name} — ${milestone} achieved!`,
];

const AVATARS_BG = [
  'bg-amber-700/60', 'bg-rose-700/60', 'bg-emerald-700/60',
  'bg-violet-700/60', 'bg-cyan-700/60', 'bg-orange-700/60',
  'bg-teal-700/60', 'bg-pink-700/60', 'bg-indigo-700/60',
  'bg-lime-700/60', 'bg-fuchsia-700/60', 'bg-sky-700/60',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let entryCounter = 0;

function generateDevoteeEntry(): FeedEntry {
  entryCounter++;
  const name = pickRandom(DEVOTEE_NAMES);
  const city = pickRandom(DEVOTEE_CITIES);
  const deity = pickRandom(ISHTA_OPTIONS);
  const avatar = pickRandom(AVATARS_BG);
  const count = Math.floor(Math.random() * 500) + 1;
  const msgFn = pickRandom(DEVOTIONAL_MESSAGES);

  // 85% chance of chant entry, 15% chance of milestone
  if (Math.random() < 0.85) {
    return {
      id: `devotee-${entryCounter}-${Date.now()}`,
      name,
      city,
      avatar,
      message: msgFn(name, deity, count),
      icon: Math.random() > 0.5 ? 'heart' : 'flame',
      iconColor: 'bg-primary',
      isUser: false,
      timestamp: Date.now() - Math.floor(Math.random() * 30000),
      chantCount: count,
    };
  } else {
    const milestone = pickRandom(MILESTONES);
    const milestoneMsgFn = pickRandom(MILESTONE_MESSAGES);
    return {
      id: `devotee-milestone-${entryCounter}-${Date.now()}`,
      name,
      city,
      avatar,
      message: milestoneMsgFn(name, milestone.name),
      icon: 'sparkle',
      iconColor: 'bg-primary-container',
      isUser: false,
      timestamp: Date.now() - Math.floor(Math.random() * 30000),
    };
  }
}

// Generate initial batch of "already happened" entries
function generateInitialFeed(count: number): FeedEntry[] {
  const entries: FeedEntry[] = [];
  for (let i = 0; i < count; i++) {
    const entry = generateDevoteeEntry();
    entry.timestamp = Date.now() - Math.floor(Math.random() * 3600000) - (count - i) * 15000;
    entries.push(entry);
  }
  return entries;
}

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */
function FeedIcon({ type }: { type: 'heart' | 'camera' | 'sparkle' | 'flame' }) {
  switch (type) {
    case 'heart':
      return <Heart className="h-3.5 w-3.5" />;
    case 'camera':
      return <Camera className="h-3.5 w-3.5" />;
    case 'sparkle':
      return <Sparkles className="h-3.5 w-3.5" />;
    case 'flame':
      return <Flame className="h-3.5 w-3.5" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Golden Flame SVG                                                    */
/* ------------------------------------------------------------------ */
function GoldenFlame() {
  return (
    <svg
      width="192"
      height="256"
      viewBox="0 0 192 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_0_30px_rgba(242,202,80,0.5)]"
    >
      <defs>
        <filter id="flame-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="inner-core" cx="50%" cy="65%" r="50%">
          <stop offset="0%" stopColor="#FFF7D6" />
          <stop offset="40%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#F2CA50" />
        </radialGradient>
        <linearGradient id="flame-outer" x1="96" y1="0" x2="96" y2="256" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="30%" stopColor="#F2CA50" />
          <stop offset="60%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#FF9500" />
        </linearGradient>
        <linearGradient id="flame-mid" x1="96" y1="20" x2="96" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE88A" />
          <stop offset="50%" stopColor="#F2CA50" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
        <linearGradient id="flame-tip" x1="96" y1="0" x2="96" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF7D6" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
      <ellipse cx="96" cy="200" rx="55" ry="25" fill="#FF9500" opacity="0.15" filter="url(#flame-glow)" />
      <path d="M96 20 C80 40, 40 90, 42 140 C44 175, 55 200, 75 215 C80 210, 85 190, 90 170 C88 140, 92 100, 96 70 C96 100, 100 140, 98 170 C95 190, 98 210, 96 20Z" fill="url(#flame-outer)" opacity="0.6" filter="url(#flame-glow)" />
      <path d="M96 20 C112 40, 152 90, 150 140 C148 175, 137 200, 117 215 C112 210, 107 190, 102 170 C104 140, 100 100, 96 70 C96 100, 92 140, 94 170 C97 190, 94 210, 96 20Z" fill="url(#flame-outer)" opacity="0.6" filter="url(#flame-glow)" />
      <path d="M96 35 C84 55, 56 100, 58 145 C60 175, 68 195, 82 210 C86 200, 90 180, 93 160 C92 130, 95 95, 96 65 C96 95, 97 130, 96 160 C96 180, 97 200, 96 35Z" fill="url(#flame-mid)" opacity="0.8" />
      <path d="M96 35 C108 55, 136 100, 134 145 C132 175, 124 195, 110 210 C106 200, 102 180, 99 160 C100 130, 97 95, 96 65 C96 95, 95 130, 96 160 C96 180, 95 200, 96 35Z" fill="url(#flame-mid)" opacity="0.8" />
      <path d="M96 60 C88 75, 72 110, 74 150 C75 170, 80 190, 88 200 C90 195, 93 180, 95 165 C94 140, 96 110, 96 85 C96 110, 96 140, 95 165 C95 180, 96 195, 96 60Z" fill="url(#flame-tip)" opacity="0.9" />
      <path d="M96 60 C104 75, 120 110, 118 150 C117 170, 112 190, 104 200 C102 195, 99 180, 97 165 C98 140, 96 110, 96 85 C96 110, 96 140, 97 165 C97 180, 96 195, 96 60Z" fill="url(#flame-tip)" opacity="0.9" />
      <path d="M96 80 C92 90, 84 120, 86 155 C87 170, 90 185, 94 195 C95 190, 96 180, 96 168 C96 145, 96 120, 96 100 C96 120, 96 145, 96 168 C96 180, 97 190, 96 80Z" fill="url(#inner-core)" />
      <path d="M96 100 C94 108, 90 130, 92 158 C92 168, 94 178, 96 185 C97 178, 98 168, 97 158 C97 140, 97 115, 96 100Z" fill="#FFFDF0" opacity="0.95" />
      <path d="M96 10 C92 25, 88 50, 90 70 C91 80, 94 88, 96 92 C98 88, 101 80, 100 70 C102 50, 100 25, 96 10Z" fill="#FFF7D6" opacity="0.7" />
      <ellipse cx="96" cy="220" rx="30" ry="8" fill="#FF9500" opacity="0.3" />
      <ellipse cx="96" cy="222" rx="20" ry="5" fill="#D4AF37" opacity="0.4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Animations                                                         */
/* ------------------------------------------------------------------ */
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } },
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AkhandJyotScreen() {
  const userName = useNaamJapStore((s) => s.userName);
  const totalCount = useNaamJapStore((s) => s.totalCount);
  const todayCount = useNaamJapStore((s) => s.getTodayCount());
  const ishtaDevata = useNaamJapStore((s) => s.ishtaDevata);
  const unlockedMilestones = useNaamJapStore((s) => s.unlockedMilestones);

  // State for simulated community feed entries (updated by timer callback)
  const [communityFeed, setCommunityFeed] = useState<FeedEntry[]>(() => generateInitialFeed(12));

  // Compute user milestone entries reactively (no setState needed)
  const userMilestoneEntries = useMemo((): FeedEntry[] => {
    return [...unlockedMilestones]
      .sort((a, b) => b - a)
      .slice(0, 8)
      .map((threshold) => {
        const milestone = MILESTONES.find(m => m.threshold === threshold);
        if (!milestone) return null;
        return {
          id: `user-milestone-${threshold}`,
          name: userName !== 'Devotee' ? userName : 'You',
          city: '',
          avatar: 'bg-primary/40',
          message: `${userName !== 'Devotee' ? userName : 'You'} unlocked "${milestone.name}" — ${milestone.description}`,
          icon: 'sparkle' as const,
          iconColor: 'bg-primary-container',
          isUser: true,
          timestamp: Date.now(),
        };
      })
      .filter((e): e is FeedEntry => e !== null);
  }, [unlockedMilestones, userName]);

  // Merge community feed with user milestones, sorted by time
  const feedEntries = useMemo(
    () => [...userMilestoneEntries, ...communityFeed].sort((a, b) => b.timestamp - a.timestamp).slice(0, 30),
    [userMilestoneEntries, communityFeed],
  );

  // Simulate new devotee entries appearing every 6-14 seconds
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 6000 + Math.random() * 8000;
      return setTimeout(() => {
        setCommunityFeed((prev) => {
          const newEntry = generateDevoteeEntry();
          return [newEntry, ...prev].slice(0, 30);
        });
        timerRef.current = scheduleNext();
      }, delay);
    };

    const timerRef = { current: scheduleNext() };

    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  // Stats
  const totalMilestones = unlockedMilestones.length;
  const progress = Math.min(100, (totalCount / 10_000_000) * 100);
  const nextMilestone = MILESTONES.find(m => totalCount < m.threshold);

  // Display name
  const displayName = userName !== 'Devotee' ? userName : null;

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sticky top-0 z-50 glass px-4 py-3 flex items-center justify-between"
      >
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest/40 transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5 text-on-surface-variant" />
        </button>

        <h1 className="font-serif text-primary text-lg tracking-wide">
          {displayName ? `${displayName}'s Jyot` : 'Akhand Jyot'}
        </h1>

        <button
          className="w-10 h-10 rounded-full bg-surface-container-high/60 border border-outline-variant/15 flex items-center justify-center hover:bg-surface-container-highest/40 transition-colors"
          aria-label="Profile"
        >
          {displayName ? (
            <span className="font-serif text-sm font-semibold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <Sun className="h-5 w-5 text-primary/70" />
          )}
        </button>
      </motion.header>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto custom-scrollbar pb-32">
        {/* FLAME HERO SECTION */}
        <section className="relative flex flex-col items-center pt-10 pb-8 px-4 overflow-hidden">
          {/* Pulsating radial glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[500px] md:h-[500px] rounded-full animate-flame-pulse pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #F2CA50 0%, #D4AF37 40%, transparent 70%)',
              filter: 'blur(60px)',
              opacity: 0.4,
            }}
          />

          {/* Flame container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="relative w-72 h-72 flex items-center justify-center"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(242,202,80,0.06) 0%, rgba(212,175,55,0.12) 50%, rgba(255,149,0,0.04) 100%)',
              }}
            />

            {/* Floating flame */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <GoldenFlame />
            </motion.div>
          </motion.div>

          {/* Personal counter */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="relative z-10 mt-6 flex flex-col items-center"
          >
            <span className="text-on-surface-variant/70 font-body text-xs uppercase tracking-[0.2em] mb-2">
              {displayName ? `${displayName}'s Total Chants` : 'Your Total Chants'}
            </span>

            <motion.span
              key={totalCount}
              initial={{ scale: 1.02 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="font-serif text-5xl md:text-6xl font-bold text-gold-gradient leading-tight"
            >
              {formatNumber(totalCount)}
            </motion.span>

            <span className="text-on-surface-variant/50 text-xs font-body mt-2">
              Journey to 1 Crore — {progress.toFixed(progress < 1 ? 2 : 1)}%
            </span>
          </motion.div>
        </section>

        {/* DEVOTION STATS CARDS */}
        <section className="px-4 mt-2">
          <div className="grid grid-cols-3 gap-3">
            {/* Today's Chants */}
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              className="glass rounded-xl p-3 text-center"
            >
              <Heart className="h-4 w-4 text-primary mx-auto mb-1.5" />
              <p className="font-body text-lg font-semibold text-on-surface tabular-nums">
                {todayCount.toLocaleString('en-IN')}
              </p>
              <p className="font-body text-[10px] text-on-surface-variant/50 mt-0.5">
                Today
              </p>
            </motion.div>

            {/* Milestones */}
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-3 text-center"
            >
              <Trophy className="h-4 w-4 text-primary-container mx-auto mb-1.5" />
              <p className="font-body text-lg font-semibold text-on-surface tabular-nums">
                {totalMilestones}
              </p>
              <p className="font-body text-[10px] text-on-surface-variant/50 mt-0.5">
                Milestones
              </p>
            </motion.div>

            {/* Next Milestone */}
            <motion.div
              variants={cardVariants}
              initial="initial"
              animate="animate"
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-3 text-center"
            >
              <Sparkles className="h-4 w-4 text-secondary mx-auto mb-1.5" />
              <p className="font-body text-lg font-semibold text-on-surface tabular-nums">
                {nextMilestone ? formatNumber(nextMilestone.threshold) : '—'}
              </p>
              <p className="font-body text-[10px] text-on-surface-variant/50 mt-0.5">
                Next Goal
              </p>
            </motion.div>
          </div>
        </section>

        {/* GLOBAL DEVOTION FEED */}
        <section className="px-4 mt-8">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-primary/70" />
              <h2 className="font-serif text-2xl text-on-surface">
                Global Devotion
              </h2>
            </div>
            <p className="text-on-surface-variant/70 text-sm font-body">
              Devotees around the world chanting together
            </p>
          </motion.div>

          {/* Feed cards */}
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            <AnimatePresence mode="popLayout">
              {feedEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  layout
                  className={`group glass rounded-xl px-4 py-3.5 flex items-start gap-3 hover:bg-surface-container-highest/60 transition-colors tactile-press ${
                    entry.isUser ? 'ring-1 ring-primary/20' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full ${entry.avatar} flex items-center justify-center`}>
                    {entry.isUser ? (
                      <span className="font-serif text-sm font-bold text-primary">
                        {entry.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <span className="font-serif text-sm font-bold text-white/90">
                        {entry.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-on-surface text-sm font-body leading-relaxed">
                      {entry.message}
                    </p>
                    {/* City tag for community entries */}
                    {!entry.isUser && entry.city && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-2.5 w-2.5 text-on-surface-variant/30" />
                        <span className="text-[10px] text-on-surface-variant/40 font-body">
                          {entry.city}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="flex-shrink-0 text-on-surface-variant/40 text-[11px] font-body pt-0.5">
                    {timeAgo(entry.timestamp)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* YOUR JOURNEY SECTION */}
        <section className="px-4 mt-10">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mb-6"
          >
            <h2 className="font-serif text-2xl text-on-surface mb-1">
              {displayName ? `${displayName}'s Journey` : 'Your Journey'}
            </h2>
            <p className="text-on-surface-variant/70 text-sm font-body">
              A log of your devotional progress
            </p>
          </motion.div>

          <div className="flex flex-col gap-3">
            {/* Today's session */}
            {todayCount > 0 && (
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                className="glass rounded-xl px-4 py-3.5 flex items-start gap-3 ring-1 ring-primary/20"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="bg-primary text-on-surface">
                    <Heart className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface text-sm font-body leading-relaxed">
                    {displayName
                      ? `${displayName} chanted ${todayCount.toLocaleString('en-IN')} times today in the name of ${ishtaDevata}`
                      : `You chanted ${todayCount.toLocaleString('en-IN')} times today in the name of ${ishtaDevata}`
                    }
                  </p>
                </div>
                <span className="flex-shrink-0 text-on-surface-variant/40 text-[11px] font-body pt-0.5">
                  Today
                </span>
              </motion.div>
            )}

            {/* Lifetime total */}
            {totalCount > 0 && (
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
                className="glass rounded-xl px-4 py-3.5 flex items-start gap-3 ring-1 ring-primary/20"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="bg-primary text-on-surface">
                    <Flame className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface text-sm font-body leading-relaxed">
                    {displayName
                      ? `${displayName}'s lifetime devotion: ${formatNumber(totalCount)} chants towards 1 Crore`
                      : `Your lifetime devotion: ${formatNumber(totalCount)} chants towards 1 Crore`
                    }
                  </p>
                </div>
                <span className="flex-shrink-0 text-on-surface-variant/40 text-[11px] font-body pt-0.5">
                  All time
                </span>
              </motion.div>
            )}

            {/* Recent milestones */}
            {[...unlockedMilestones]
              .sort((a, b) => b - a)
              .slice(0, 3)
              .map((threshold) => {
                const milestone = MILESTONES.find(m => m.threshold === threshold);
                if (!milestone) return null;
                return (
                  <motion.div
                    key={`my-milestone-${threshold}`}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    className="glass rounded-xl px-4 py-3.5 flex items-start gap-3 ring-1 ring-primary/20"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-container/20 flex items-center justify-center">
                      <span className="bg-primary-container text-on-surface">
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-on-surface text-sm font-body leading-relaxed">
                        Unlocked &ldquo;{milestone.name}&rdquo; — {milestone.description}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-on-surface-variant/40 text-[11px] font-body pt-0.5">
                      {formatNumber(threshold)}
                    </span>
                  </motion.div>
                );
              })}

            {/* Empty state */}
            {todayCount === 0 && totalCount === 0 && (
              <motion.div
                variants={cardVariants}
                initial="initial"
                animate="animate"
                className="glass rounded-xl px-4 py-3.5 flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="bg-primary text-on-surface">
                    <Heart className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-on-surface text-sm font-body leading-relaxed">
                    {displayName
                      ? `Welcome, ${displayName}. Begin your chanting journey on the Home screen — your activity will appear here.`
                      : 'Welcome. Begin your chanting journey on the Home screen — your activity will appear here.'
                    }
                  </p>
                </div>
                <span className="flex-shrink-0 text-on-surface-variant/40 text-[11px] font-body pt-0.5">
                  Now
                </span>
              </motion.div>
            )}
          </div>
        </section>

        {/* AESTHETIC SPACER */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-2 mt-10 mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
        </motion.div>
      </main>
    </div>
  );
}
