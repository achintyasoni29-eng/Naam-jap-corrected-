'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  useNaamJapStore,
  MILESTONES,
} from '@/lib/store';
import {
  Flower2,
  Leaf,
  TreePine,
  Waves,
  Mountain,
  Droplets,
  Sun,
  Star,
  Sparkles,
  MountainSnow,
  ChevronUp,
  User,
} from 'lucide-react';
import ProfileDialog from '@/components/sanctuary/ProfileDialog';

/* ─── Icon Mapping ─── */
type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

const milestoneIcons: Record<string, IconComponent> = {
  filter_vintage: Flower2,
  spa: Leaf,
  park: TreePine,
  waves: Waves,
  wb_twilight: MountainSnow,
  landscape: Mountain,
  water: Droplets,
  wb_sunny: Sun,
  local_florist: Flower2,
  yard: TreePine,
  stars: Star,
  auto_awesome: Sparkles,
  brightness_7: Sun,
};

/* ─── Milestone Positions on SVG (viewBox 0 0 400 600) ─── */
interface Point {
  x: number;
  y: number;
}

const MILESTONE_POSITIONS: Point[] = [
  { x: 60, y: 540 },   // 108 – First Circle
  { x: 125, y: 485 },  // 1,008 – Awakening
  { x: 175, y: 435 },  // 5,000 – Whispering Pines
  { x: 105, y: 385 },  // 10,000 – Gate of Peace
  { x: 55, y: 335 },   // 25,000 – Still Waters
  { x: 130, y: 285 },  // 50,000 – Valley of Stillness
  { x: 180, y: 240 },  // 100,000 – Mountain of Devotion
  { x: 110, y: 195 },  // 250,000 – Celestial River
  { x: 70, y: 150 },   // 500,000 – Golden Dawn
  { x: 140, y: 110 },  // 1,000,000 – Million Lotus
  { x: 178, y: 82 },   // 2,500,000 – Eternal Garden
  { x: 198, y: 58 },   // 5,000,000 – Halfway to Infinity
  { x: 205, y: 42 },   // 7,500,000 – Crown of Stars
  { x: 208, y: 26 },   // 10,000,000 – Celestial Completion
];

/* ─── Catmull-Rom → Cubic Bézier path generator ─── */
function smoothPath(points: Point[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x},${p2.y}`;
  }
  return d;
}

/* ─── Number formatter ─── */
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

/* ═══════════════════════════════════════════════════
   PilgrimageScreen
   ═══════════════════════════════════════════════════ */
export default function PilgrimageScreen() {
  const totalCount = useNaamJapStore((s) => s.totalCount);
  const unlockedMilestones = useNaamJapStore((s) => s.unlockedMilestones);
  const getNextMilestone = useNaamJapStore((s) => s.getNextMilestone);
  const setCurrentTab = useNaamJapStore((s) => s.setCurrentTab);

  // Added state for the Profile Dialog
  const [showProfile, setShowProfile] = useState(false);

  const nextMilestone = getNextMilestone();

  /* ── Overall progress (0→1) across entire journey ── */
  const overallProgress = useMemo(
    () => Math.min(1, totalCount / MILESTONES[MILESTONES.length - 1].threshold),
    [totalCount],
  );

  /* ── Progress toward next milestone ── */
  const nextProgress = useMemo(() => {
    if (!nextMilestone) return 1;
    const idx = MILESTONES.findIndex((m) => m.threshold === nextMilestone.threshold);
    const prevThreshold = idx > 0 ? MILESTONES[idx - 1].threshold : 0;
    return Math.min(1, (totalCount - prevThreshold) / (nextMilestone.threshold - prevThreshold));
  }, [totalCount, nextMilestone]);

  /* ── Current position on SVG path ── */
  const currentPos = useMemo<Point>(() => {
    let prevThreshold = 0;
    let prevIdx = -1;
    let nextIdx = 0;
    for (let i = 0; i < MILESTONES.length; i++) {
      if (totalCount < MILESTONES[i].threshold) {
        nextIdx = i;
        break;
      }
      prevThreshold = MILESTONES[i].threshold;
      prevIdx = i;
      nextIdx = i + 1;
    }
    if (nextIdx >= MILESTONES.length) return MILESTONE_POSITIONS[MILESTONE_POSITIONS.length - 1];
    const frac = (totalCount - prevThreshold) / (MILESTONES[nextIdx].threshold - prevThreshold);
    const prev: Point = prevIdx >= 0 ? MILESTONE_POSITIONS[prevIdx] : { x: 40, y: 570 };
    const next: Point = MILESTONE_POSITIONS[nextIdx];
    return {
      x: prev.x + (next.x - prev.x) * frac,
      y: prev.y + (next.y - prev.y) * frac,
    };
  }, [totalCount]);

  /* ── SVG path string ── */
  const svgPath = useMemo(() => smoothPath(MILESTONE_POSITIONS), []);

  /* ── Unlocked milestones list ── */
  const unlockedList = useMemo(
    () => MILESTONES.filter((m) => unlockedMilestones.includes(m.threshold)),
    [unlockedMilestones],
  );

  /* ── Gradient stop for bright→dim transition ── */
  const gradientStop = useMemo(() => Math.round(overallProgress * 100), [overallProgress]);

  return (
    // FIXED: Increased bottom padding (pb-40) so Sacred Footsteps clears the nav bar
    <div className="min-h-screen bg-surface-container-lowest pb-40">
      
      {/* ─── Header ─── */}
      {/* FIXED: Added pt-12 to push content down below the Android status bar/notch */}
      <header className="glass sticky top-0 z-50 px-5 pt-12 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChevronUp className="w-5 h-5 text-primary" />
          <h1 className="font-serif text-primary text-xl font-bold tracking-wide">Naam Jap</h1>
        </div>
        
        {/* FIXED: Changed to a <button> and wired up onClick to show Profile Dialog */}
        <button 
          onClick={() => setShowProfile(true)}
          className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center ghost-border active:scale-95 transition-transform"
        >
          <User className="w-4 h-4 text-on-surface-variant" />
        </button>
      </header>

      <main className="px-4 space-y-6 mt-4">
        {/* ─── Interactive SVG Journey Map ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={0}
          variants={fadeUp}
          className="relative h-[450px] rounded-2xl overflow-hidden ghost-border ambient-shadow"
        >
          {/* Dark gradient base */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-container to-surface-container-low" />

          {/* Starry dot pattern overlay – 20 % opacity */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.2,
              backgroundImage: 'radial-gradient(circle, #d4af37 0.5px, transparent 0.5px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* "Current Ascent" label */}
          <div className="absolute top-4 right-4 z-10">
            <span className="text-[10px] font-body uppercase tracking-widest text-on-surface-variant select-none">
              Current Ascent
            </span>
          </div>

          {/* SVG Canvas */}
          <svg
            viewBox="0 0 400 600"
            className="relative h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Path gradient – bright gold up to progress, dim beyond */}
              <linearGradient id="trailGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#f2ca50" stopOpacity="0.9" />
                <stop offset={`${gradientStop}%`} stopColor="#f2ca50" stopOpacity="0.7" />
                <stop offset={`${Math.min(gradientStop + 3, 100)}%`} stopColor="#4d4635" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4d4635" stopOpacity="0.25" />
              </linearGradient>

              {/* Glow for unlocked nodes */}
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f2ca50" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f2ca50" stopOpacity="0" />
              </radialGradient>

              {/* Current position orb glow */}
              <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffe088" stopOpacity="0.85" />
                <stop offset="40%" stopColor="#f2ca50" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f2ca50" stopOpacity="0" />
              </radialGradient>

              {/* Soft blur filter */}
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Dim base path ── */}
            <path
              d={svgPath}
              fill="none"
              stroke="#4d4635"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.35"
            />

            {/* ── Bright progress path ── */}
            <path
              d={svgPath}
              fill="none"
              stroke="url(#trailGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* ── Milestone Nodes ── */}
            {MILESTONES.map((milestone, idx) => {
              const pos = MILESTONE_POSITIONS[idx];
              const isUnlocked = unlockedMilestones.includes(milestone.threshold);

              if (isUnlocked) {
                return (
                  <g key={milestone.threshold}>
                    {/* Outer glow ring */}
                    <circle cx={pos.x} cy={pos.y} r="14" fill="url(#nodeGlow)" />
                    {/* Inner bright dot */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="5"
                      fill="#f2ca50"
                      filter="url(#softGlow)"
                    />
                    {/* Label */}
                    <text
                      x={pos.x}
                      y={pos.y + 22}
                      textAnchor="middle"
                      fill="#d4af37"
                      fontSize="8"
                      fontFamily="Manrope, sans-serif"
                      fontWeight="500"
                    >
                      {fmt(milestone.threshold)}
                    </text>
                  </g>
                );
              }

              return (
                <g key={milestone.threshold} opacity="0.55">
                  {/* Dim dot */}
                  <circle cx={pos.x} cy={pos.y} r="3.5" fill="#4d4635" />
                  {/* Dim label */}
                  <text
                    x={pos.x}
                    y={pos.y + 18}
                    textAnchor="middle"
                    fill="#4d4635"
                    fontSize="7"
                    fontFamily="Manrope, sans-serif"
                  >
                    {fmt(milestone.threshold)}
                  </text>
                </g>
              );
            })}

            {/* ── Current Position Pulsating Orb ── */}
            <g
              className="animate-flame-pulse"
              style={{ transformOrigin: `${currentPos.x}px ${currentPos.y}px` }}
            >
              {/* Outer aura */}
              <circle cx={currentPos.x} cy={currentPos.y} r="22" fill="url(#orbGlow)" />
              {/* Mid glow */}
              <circle
                cx={currentPos.x}
                cy={currentPos.y}
                r="9"
                fill="#f2ca50"
                filter="url(#softGlow)"
              />
              {/* Bright core */}
              <circle cx={currentPos.x} cy={currentPos.y} r="4" fill="#fff8e1" />
            </g>
          </svg>
        </motion.div>

        {/* ─── Current Milestone Card ─── */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
          className="glass rounded-2xl p-5 ghost-border ambient-shadow"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-body uppercase tracking-widest text-on-surface-variant">
              Next Milestone
            </span>
            {nextMilestone && (
              <span className="text-primary text-sm font-semibold font-body">
                {nextMilestone.name}
              </span>
            )}
          </div>

          {nextMilestone ? (
            <>
              <p className="text-on-surface-variant text-xs font-body mb-4 leading-relaxed">
                {nextMilestone.description}
              </p>

              {/* Progress bar */}
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full gold-gradient rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${nextProgress * 100}%` }}
                  transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 }}
                />
              </div>

              <div className="flex items-center justify-between mb-5">
                <span className="text-xs text-on-surface-variant font-body">
                  {fmt(totalCount)}&nbsp;/&nbsp;{fmt(nextMilestone.threshold)}
                </span>
                <span className="text-xs text-primary font-body font-semibold">
                  {Math.round(nextProgress * 100)}%
                </span>
              </div>
            </>
          ) : (
            <p className="text-on-surface text-sm font-body mb-5">
              🙏 You have completed the celestial journey. All milestones unlocked!
            </p>
          )}

          {/* Meditate CTA */}
          <button
            onClick={() => setCurrentTab('sanctuary')}
            className="w-full py-3 rounded-xl gold-gradient text-on-primary font-body font-semibold text-sm tracking-wide tactile-press tactile-transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-container-lowest"
          >
            Meditate
          </button>
        </motion.div>

        {/* ─── Sacred Footsteps ─── */}
        <motion.section
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
        >
          <h2 className="font-serif text-on-surface text-lg mb-3">Sacred Footsteps</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {unlockedList.map((milestone, idx) => {
              const Icon = milestoneIcons[milestone.icon as string] || Flower2;
              return (
                <motion.div
                  key={milestone.threshold}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + idx * 0.08, ease: 'easeOut' }}
                  className="min-w-[140px] glass rounded-xl p-3 ghost-border flex-shrink-0"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <p className="text-xs font-body font-semibold text-on-surface truncate">
                    {milestone.name}
                  </p>
                  <p className="text-[10px] font-body text-on-surface-variant mt-0.5">
                    {fmt(milestone.threshold)} chants
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      </main>

      {/* Render the Profile Dialog so the icon actually opens it! */}
      <ProfileDialog open={showProfile} onOpenChange={setShowProfile} />
    </div>
  );
}
