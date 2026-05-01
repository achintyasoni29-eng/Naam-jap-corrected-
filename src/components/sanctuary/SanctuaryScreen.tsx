'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  ChevronDown,
  Sun,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useNaamJapStore,
  ISHTA_DEVATAS,
  type DevataHue,
} from '@/lib/store';
import ScanCounterDialog from '@/components/sanctuary/ScanCounterDialog';
import ProfileDialog from '@/components/sanctuary/ProfileDialog';
import { playChantSound, playMilestoneChime, playMeditationBell, type SoundMode } from '@/lib/sounds';

// ──────────────────────────────────────────────
// Progress SVG path helpers
// ──────────────────────────────────────────────

const SVG_VIEWBOX = { width: 400, height: 100 };
const GOAL_COUNT = 10_000_000;

/**
 * The main wave path – a smooth sine-like curve from left to right.
 * Constructed with cubic Bézier segments for a gentle winding feel.
 */
function buildWavePath(): string {
  return [
    'M 0 50',
    'C 30 30, 70 15, 100 20',
    'C 140 28, 160 75, 200 80',
    'C 240 85, 260 25, 300 20',
    'C 340 15, 370 35, 400 50',
  ].join(' ');
}

const WAVE_PATH = buildWavePath();

/**
 * Approximate a point on the wave path at a given `t` ∈ [0, 1].
 * Uses the same control-point logic as the Bézier segments above,
 * but simplified by sampling evenly along the 4-segment cubic chain.
 */
function samplePath(t: number): { x: number; y: number } {
  const segment = Math.min(3, Math.floor(t * 4));
  const s = (t * 4) - segment;

  const segs: Array<[number, number, number, number, number, number, number, number]> = [
    [0, 50, 30, 30, 70, 15, 100, 20],
    [100, 20, 140, 28, 160, 75, 200, 80],
    [200, 80, 240, 85, 260, 25, 300, 20],
    [300, 20, 340, 15, 370, 35, 400, 50],
  ];

  const [x0, y0, x1, y1, x2, y2, x3, y3] = segs[segment];
  const mt = 1 - s;

  const x = mt * mt * mt * x0 + 3 * mt * mt * s * x1 + 3 * mt * s * s * x2 + s * s * s * x3;
  const y = mt * mt * mt * y0 + 3 * mt * mt * s * y1 + 3 * mt * s * s * y2 + s * s * s * y3;

  return { x, y };
}

/**
 * Build an SVG `strokeDasharray` + `strokeDashoffset` value to fill
 * the path up to `progress` fraction.
 */
const APPROX_PATH_LENGTH = 440;

function getDashProps(progress: number) {
  const filled = progress * APPROX_PATH_LENGTH;
  return {
    strokeDasharray: `${APPROX_PATH_LENGTH}`,
    strokeDashoffset: `${APPROX_PATH_LENGTH - filled}`,
  };
}

// ──────────────────────────────────────────────
// Lotus SVG Component
// ──────────────────────────────────────────────

function LotusSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M50 55 C50 55, 45 30, 50 8 C55 30, 50 55, 50 55Z"
        fill="rgba(242,202,80,0.25)"
        stroke="rgba(242,202,80,0.4)"
        strokeWidth="0.5"
      />
      <path
        d="M50 55 C50 55, 30 35, 22 12 C38 25, 50 55, 50 55Z"
        fill="rgba(242,202,80,0.15)"
        stroke="rgba(242,202,80,0.3)"
        strokeWidth="0.5"
      />
      <path
        d="M50 55 C50 55, 70 35, 78 12 C62 25, 50 55, 50 55Z"
        fill="rgba(242,202,80,0.15)"
        stroke="rgba(242,202,80,0.3)"
        strokeWidth="0.5"
      />
      <path
        d="M50 55 C50 55, 20 40, 6 20 C28 30, 50 55, 50 55Z"
        fill="rgba(242,202,80,0.08)"
        stroke="rgba(242,202,80,0.2)"
        strokeWidth="0.5"
      />
      <path
        d="M50 55 C50 55, 80 40, 94 20 C72 30, 50 55, 50 55Z"
        fill="rgba(242,202,80,0.08)"
        stroke="rgba(242,202,80,0.2)"
        strokeWidth="0.5"
      />
      <ellipse cx="50" cy="52" rx="2" ry="1" fill="rgba(242,202,80,0.35)" />
    </svg>
  );
}

// ──────────────────────────────────────────────
// Main Sanctuary Screen
// ──────────────────────────────────────────────

export default function SanctuaryScreen() {
  const totalCount = useNaamJapStore((s) => s.totalCount);
  const session = useNaamJapStore((s) => s.session);
  const ishtaDevata = useNaamJapStore((s) => s.ishtaDevata);
  const userName = useNaamJapStore((s) => s.userName);
  const incrementCount = useNaamJapStore((s) => s.incrementCount);
  const soundMode = useNaamJapStore((s) => s.soundMode);
  const setIshtaDevata = useNaamJapStore((s) => s.setIshtaDevata);
  const getProgress = useNaamJapStore((s) => s.getProgress);
  const getTodayCount = useNaamJapStore((s) => s.getTodayCount);
  const getTotalDisplay = useNaamJapStore((s) => s.getTotalDisplay);

  const [scanOpen, setScanOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const [ripples, setRipples] = useState<Array<{ id: number }>>([]);
  const rippleIdRef = useRef(0);

  const progress = useMemo(() => getProgress(), [totalCount, getProgress]);
  const todayCount = useMemo(() => getTodayCount(), [session, getTodayCount]);
  const totalDisplay = useMemo(() => getTotalDisplay(), [totalCount, getTotalDisplay]);
  const currentDevata = useMemo(
    () => ISHTA_DEVATAS.find((d) => d.name === ishtaDevata) ?? ISHTA_DEVATAS[0],
    [ishtaDevata]
  );

  const dashProps = useMemo(() => getDashProps(progress), [progress]);
  const orbPos = useMemo(() => samplePath(progress), [progress]);

  // Tap handler
  const handleTap = useCallback(() => {
    incrementCount();

    // Play chant sound
    playChantSound(soundMode as SoundMode, totalCount + 1);

    const id = ++rippleIdRef.current;
    setRipples((prev) => [...prev.slice(-4), { id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 700);
  }, [incrementCount, soundMode, totalCount]);

  // Format for progress display
  const formatProgress = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString('en-IN');
  };

  return (
    <main className="min-h-screen bg-surface-container-lowest flex flex-col relative overflow-hidden">
      {/* ── Subtle background radial glow ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* ══════════════════════════════════════════
          1. HEADER
      ══════════════════════════════════════════ */}
      <header className="relative z-10 glass border-b border-outline-variant/10 pt-12">
        <div className="flex items-center justify-between px-5 pb-3 max-w-lg mx-auto">
          {/* Devata dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 group">
                <span className="font-serif text-base font-semibold text-on-surface group-hover:text-primary transition-colors">
                  {currentDevata.name}
                </span>
                <ChevronDown className="size-3.5 text-on-surface-variant/60 group-hover:text-primary transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="glass-strong border-outline-variant/15 rounded-xl p-1 min-w-[180px]"
            >
              {ISHTA_DEVATAS.map((devata) => (
                <DropdownMenuItem
                  key={devata.name}
                  onClick={() =>
                    setIshtaDevata(devata.name, devata.hue as DevataHue)
                  }
                  className={`rounded-lg px-3 py-2 cursor-pointer ${
                    devata.name === ishtaDevata
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface hover:bg-surface-container-high/40'
                  }`}
                >
                  <span className="mr-2 text-sm">{devata.emoji}</span>
                  <span className="font-serif text-sm font-medium">{devata.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile avatar — shows name initial */}
          <button
            onClick={() => setProfileOpen(true)}
            className="w-8 h-8 rounded-full bg-surface-container-high/60 border border-outline-variant/15 flex items-center justify-center hover:bg-surface-container-highest/60 transition-colors"
            aria-label="Open profile"
          >
            {userName !== 'Devotee' ? (
              <span className="font-serif text-xs font-semibold text-primary">
                {userName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <span className="font-serif text-xs font-semibold text-on-surface-variant/60">
                ?
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          2. JOURNEY PROGRESS SECTION
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-5 pt-6 pb-2 max-w-lg mx-auto w-full">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="uppercase tracking-[0.2em] text-[10px] text-on-surface-variant/60 font-body mb-1">
              {userName !== 'Devotee' ? `${userName}'s Path` : 'Your Path'}
            </p>
            <h1 className="font-serif text-xl font-semibold text-on-surface leading-tight">
              {userName !== 'Devotee' ? `Namaste, ${userName}` : 'Journey to 1 Crore'}
            </h1>
          </div>
          <div className="text-right">
            <p className="font-body text-sm font-medium text-primary">
              {formatProgress(totalCount)}
            </p>
            <p className="font-body text-[11px] text-on-surface-variant/50">
              Goal: 10M
            </p>
          </div>
        </div>

        {/* Curved progress SVG */}
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${SVG_VIEWBOX.width} ${SVG_VIEWBOX.height}`}
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            {/* Unfilled (background) path */}
            <path
              d={WAVE_PATH}
              fill="none"
              stroke="#313442"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Filled (progress) path */}
            <path
              d={WAVE_PATH}
              fill="none"
              stroke="#f2ca50"
              strokeWidth="6"
              strokeLinecap="round"
              {...dashProps}
              style={{
                filter: 'drop-shadow(0 0 4px rgba(242,202,80,0.4))',
              }}
            />
            {/* Glowing orb at current position */}
            <circle
              cx={orbPos.x}
              cy={orbPos.y}
              r="6"
              fill="#f2ca50"
              style={{
                filter:
                  'drop-shadow(0 0 8px rgba(242,202,80,0.6)) drop-shadow(0 0 16px rgba(242,202,80,0.3))',
              }}
            />
            <circle
              cx={orbPos.x}
              cy={orbPos.y}
              r="3"
              fill="#fffbe6"
              opacity="0.9"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. DIGITAL MALA (Core Interaction)
      ══════════════════════════════════════════ */}
      <section className="relative z-10 flex flex-col items-center px-5 pt-6 pb-4 max-w-lg mx-auto w-full">
        {/* Session label + count */}
        <p className="uppercase tracking-[0.2em] text-[10px] text-on-surface-variant/60 font-body mb-2">
          Today&apos;s Session
        </p>
        <motion.p
          key={todayCount}
          className="font-body text-5xl font-light text-on-surface tabular-nums mb-8"
          initial={{ scale: 1.08, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {todayCount.toLocaleString('en-IN')}
        </motion.p>

        {/* Mala button – layered rings */}
        <div className="relative">
          {/* Outermost glow */}
          <div className="absolute inset-[-32px] rounded-full bg-primary/5 blur-3xl animate-mala-glow" />

          {/* Middle ring */}
          <div className="relative w-[256px] h-[256px] rounded-full border border-primary/20 bg-surface-container-high/40 backdrop-blur-md flex items-center justify-center ambient-shadow-lg">
            {/* Inner ring */}
            <div className="w-[216px] h-[216px] rounded-full bg-gradient-to-br from-primary/30 to-primary-container/10 flex items-center justify-center border border-primary/10">
              {/* Core face – tappable */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={handleTap}
                className="relative w-[168px] h-[168px] rounded-full bg-gradient-to-br from-surface-variant to-surface-container-highest flex flex-col items-center justify-center gap-2 cursor-pointer select-none active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest overflow-hidden"
                aria-label="Tap to chant"
              >
                {/* Ripple effects */}
                <AnimatePresence>
                  {ripples.map((ripple) => (
                    <motion.span
                      key={ripple.id}
                      className="absolute inset-0 rounded-full bg-primary/20"
                      initial={{ scale: 0, opacity: 0.6 }}
                      animate={{ scale: 1.8, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  ))}
                </AnimatePresence>

                <Sun className="size-10 text-primary/80 relative z-10" />
                <span className="font-body text-[11px] uppercase tracking-[0.15em] text-on-surface-variant/50 relative z-10">
                  Tap to Chant
                </span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Total count under the mala */}
        <p className="mt-5 text-on-surface-variant/40 font-body text-xs">
          Total: <span className="text-on-surface-variant/60">{totalDisplay}</span>
        </p>
      </section>

      {/* ══════════════════════════════════════════
          4. SCAN PHYSICAL COUNTER
      ══════════════════════════════════════════ */}
      <section className="relative z-10 px-5 pt-2 pb-6 max-w-lg mx-auto w-full">
        <button
          onClick={() => setScanOpen(true)}
          className="w-full glass ghost-border rounded-full py-3 px-4 flex items-center justify-center gap-2 hover:bg-surface-container-high/40 active:scale-[0.97] transition-all cursor-pointer"
        >
          <Camera className="size-4 text-primary" />
          <span className="font-body text-xs font-medium text-on-surface whitespace-nowrap">
            Upload Counter Image
          </span>
        </button>
      </section>

      {/* Spacer to push footer to bottom */}
      <div className="flex-1" />

      {/* ══════════════════════════════════════════
          5. DEVOTION FOOTER
      ══════════════════════════════════════════ */}
      <footer className="relative z-10 pb-16 pt-4 px-5">
        <div className="flex flex-col items-center gap-3">
          {/* Ambient glow behind lotus */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-12 bg-primary/[0.06] rounded-full blur-[24px]" />
            </div>
            <LotusSVG className="w-16 h-auto relative z-10" />
          </div>

         <p className="font-serif italic text-sm text-on-surface-variant/70 text-center leading-relaxed">
            {userName !== 'Devotee'
              ? `\u201CEvery name ${userName} chants counts\u201D`
              : '\u201CEvery single name counts\u201D'}
          </p>
        </div>
      </footer>

      {/* ══════════════════════════════════════════
          DIALOGS
      ══════════════════════════════════════════ */}
      <ScanCounterDialog open={scanOpen} onOpenChange={setScanOpen} />
      
      {/* THE FIX IS HERE: No more automatic 'isFirstTime' trigger */}
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </main>
  );
}
