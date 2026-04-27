'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, User, Sun, Sparkles, Volume2, VolumeX } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useNaamJapStore } from '@/lib/store';
import { playBeadClick, playMeditationBell } from '@/lib/sounds';

/* ------------------------------------------------------------------ */
/*  Profile Dialog — set name, haptic mode, sound mode                 */
/* ------------------------------------------------------------------ */

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** If true, this is the first-time welcome flow (shown on initial launch) */
  isFirstTime?: boolean;
}

export default function ProfileDialog({ open, onOpenChange, isFirstTime = false }: ProfileDialogProps) {
  const userName = useNaamJapStore((s) => s.userName);
  const hapticMode = useNaamJapStore((s) => s.hapticMode);
  const soundMode = useNaamJapStore((s) => s.soundMode);
  const setUserName = useNaamJapStore((s) => s.setUserName);
  const setHapticMode = useNaamJapStore((s) => s.setHapticMode);
  const setSoundMode = useNaamJapStore((s) => s.setSoundMode);

  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input when dialog opens
  React.useEffect(() => {
    if (open) {
      // Small delay to let the dialog animation settle
      const t = setTimeout(() => {
        if (isFirstTime) {
          setDraftName('');
          inputRef.current?.focus();
        } else {
          setDraftName(userName === 'Devotee' ? '' : userName);
        }
      }, 150);
      return () => clearTimeout(t);
    }
  }, [open, isFirstTime, userName]);

  const handleSave = useCallback(() => {
    const trimmed = draftName.trim();
    if (trimmed.length > 0) {
      setUserName(trimmed);
    }
    onOpenChange(false);
  }, [draftName, setUserName, onOpenChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
    },
    [handleSave]
  );

  // Preview sound when tapping a sound mode option
  const handleSoundPreview = useCallback((mode: 'every_tap' | 'every_108' | 'off') => {
    if (mode === 'off') return;
    if (mode === 'every_tap') playBeadClick();
    if (mode === 'every_108') playMeditationBell();
    setSoundMode(mode);
  }, [setSoundMode]);

  const nameInitial = (userName === 'Devotee' ? '' : userName).charAt(0).toUpperCase() || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-outline-variant/15 sm:max-w-sm rounded-2xl p-0 overflow-hidden">
        {/* ── Decorative top glow ── */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[80px] bg-primary/8 blur-[40px] rounded-full" />

        <DialogHeader className="pt-8 pb-2 px-6">
          <DialogTitle className="font-serif text-on-surface text-lg text-center">
            {isFirstTime ? 'Welcome, Seeker' : 'Your Profile'}
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant/60 text-sm text-center">
            {isFirstTime
              ? 'What shall we call you on your journey?'
              : 'Update your name and preferences.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* ── Avatar preview ── */}
          <div className="flex justify-center">
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-full bg-surface-container-high/60 border border-primary/20 flex items-center justify-center"
            >
              {draftName.trim() ? (
                <span className="font-serif text-xl font-semibold text-primary">
                  {draftName.trim().charAt(0).toUpperCase()}
                </span>
              ) : nameInitial ? (
                <span className="font-serif text-xl font-semibold text-on-surface-variant/60">
                  {nameInitial}
                </span>
              ) : (
                <User className="size-6 text-on-surface-variant/40" />
              )}
            </motion.div>
          </div>

          {/* ── Name input ── */}
          <div>
            <label className="block text-on-surface-variant/70 text-xs font-body uppercase tracking-[0.15em] mb-2 px-1">
              Your Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your name..."
              maxLength={24}
              className="w-full h-12 rounded-xl bg-surface-container/60 border border-outline-variant/15 px-4 text-on-surface font-body text-sm placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/30 focus:bg-surface-container-high/40 transition-colors"
            />
          </div>

          {/* ── Sound mode selector ── */}
          {!isFirstTime && (
            <div>
              <label className="flex items-center gap-1.5 text-on-surface-variant/70 text-xs font-body uppercase tracking-[0.15em] mb-2 px-1">
                <Volume2 className="size-3.5" />
                Sound
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'every_tap' as const, label: 'Every Tap', icon: '🔔' },
                  { value: 'every_108' as const, label: 'Every 108', icon: '🪷' },
                  { value: 'off' as const, label: 'Off', icon: '🔇' },
                ]).map((option) => (
                  <button
                    key={`sound-${option.value}`}
                    onClick={() => handleSoundPreview(option.value)}
                    className={`rounded-lg py-2.5 px-2 text-center text-xs font-body font-medium transition-all cursor-pointer ${
                      soundMode === option.value
                        ? 'bg-primary/15 text-primary border border-primary/25'
                        : 'bg-surface-container/40 text-on-surface-variant/60 border border-outline-variant/10 hover:bg-surface-container-high/40'
                    }`}
                  >
                    <span className="block text-base mb-0.5">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Haptic mode selector (only on non-first-time) ── */}
          {!isFirstTime && (
            <div>
              <label className="block text-on-surface-variant/70 text-xs font-body uppercase tracking-[0.15em] mb-2 px-1">
                Haptic Feedback
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'every_tap' as const, label: 'Every Tap', icon: '📳' },
                  { value: 'every_108' as const, label: 'Every 108', icon: '🪷' },
                  { value: 'off' as const, label: 'Off', icon: '🔇' },
                ]).map((option) => (
                  <button
                    key={`haptic-${option.value}`}
                    onClick={() => setHapticMode(option.value)}
                    className={`rounded-lg py-2.5 px-2 text-center text-xs font-body font-medium transition-all cursor-pointer ${
                      hapticMode === option.value
                        ? 'bg-primary/15 text-primary border border-primary/25'
                        : 'bg-surface-container/40 text-on-surface-variant/60 border border-outline-variant/10 hover:bg-surface-container-high/40'
                    }`}
                  >
                    <span className="block text-base mb-0.5">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Save button ── */}
          <button
            onClick={handleSave}
            disabled={isFirstTime && draftName.trim().length === 0}
            className="w-full h-12 rounded-xl gold-gradient text-on-primary font-body font-semibold text-sm disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isFirstTime ? (
              <>
                <Sparkles className="size-4" />
                Begin Your Journey
              </>
            ) : (
              <>
                <Check className="size-4" />
                Save
              </>
            )}
          </button>

          {isFirstTime && (
            <p className="text-on-surface-variant/40 text-[11px] text-center font-body">
              You can always change this later from your profile.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
