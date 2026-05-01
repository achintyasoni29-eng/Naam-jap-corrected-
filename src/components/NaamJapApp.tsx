'use client';

import OnboardingOverlay from './sanctuary/OnboardingOverlay';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Map, Flame } from 'lucide-react';
import { useNaamJapStore } from '@/lib/store';
import SanctuaryScreen from '@/components/sanctuary/SanctuaryScreen';
import PilgrimageScreen from '@/components/pilgrimage/PilgrimageScreen';
import AkhandJyotScreen from '@/components/akhand-jyot/AkhandJyotScreen';

const tabs = [
  { id: 'sanctuary' as const, label: 'Home', icon: Home },
  { id: 'pilgrimage' as const, label: 'Pilgrimage', icon: Map },
  { id: 'akhand-jyot' as const, label: 'Akhand Jyot', icon: Flame },
] as const;

export default function NaamJapApp() {
  const currentTab = useNaamJapStore((s) => s.currentTab);
  const setCurrentTab = useNaamJapStore((s) => s.setCurrentTab);
  const hasHydrated = useNaamJapStore((s) => s._hasHydrated);

  // Fallback: if Zustand persist hasn't fired in 2s, force hydration
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceReady(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const isReady = hasHydrated || forceReady;

  // Show a serene loading screen while waiting for hydration
  if (!isReady) {
    return (
      <div className="min-h-[100dvh] w-full max-w-[100vw] bg-surface-container-lowest flex flex-col items-center justify-center gap-4 overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <Flame className="size-8 text-primary/50" />
        </motion.div>
        <p className="font-serif text-sm text-on-surface-variant/50">Preparing your sanctuary...</p>
      </div>
    );
  }

  return (
    // STRICT MOBILE BOUNDARIES
    <div className="relative flex flex-col min-h-[100dvh] w-full max-w-[100vw] bg-surface-container-lowest overflow-x-hidden">
      
      {/* 1. THE BRAND NEW ONBOARDING OVERLAY */}
      <OnboardingOverlay />

      {/* Screen Content */}
      <AnimatePresence mode="wait">
        {currentTab === 'sanctuary' && (
          <motion.div
            key="sanctuary"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 w-full min-h-[100dvh] pb-28"
          >
            <SanctuaryScreen />
          </motion.div>
        )}
        {currentTab === 'pilgrimage' && (
          <motion.div
            key="pilgrimage"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 w-full min-h-[100dvh] pb-28"
          >
            <PilgrimageScreen />
          </motion.div>
        )}
        {currentTab === 'akhand-jyot' && (
          <motion.div
            key="akhand-jyot"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 w-full min-h-[100dvh] pb-28"
          >
            <AkhandJyotScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-4 left-0 right-0 w-full px-4 z-50 flex justify-center pointer-events-none">
        <div className="glass-strong max-w-full rounded-full px-3 py-2 flex items-center gap-1 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-outline-variant/10 pointer-events-auto">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center rounded-full px-3 sm:px-4 py-2
                  tactile-transition select-none
                  ${isActive
                    ? 'gold-gradient text-on-primary scale-110 shadow-lg'
                    : 'text-on-surface/40 hover:text-on-surface/70 hover:bg-surface-container-highest/30'
                  }
                `}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={isActive ? 'drop-shadow-sm' : ''}
                />
                {!isActive && (
                  <span className="text-[10px] uppercase tracking-wider mt-0.5 font-medium whitespace-nowrap">
                    {tab.label === 'Akhand Jyot' ? 'Jyot' : tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
