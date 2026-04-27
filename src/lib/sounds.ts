'use client';

/* ------------------------------------------------------------------ */
/*  Meditation Bell Sound — Web Audio API                              */
/*  Generates a pleasant, short Tibetan singing bowl / bell tone        */
/*  using additive synthesis with harmonics and exponential decay.      */
/* ------------------------------------------------------------------ */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  // Resume if suspended (browsers require user gesture to start audio)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a gentle meditation bell sound.
 * A warm sine tone at ~528Hz with harmonics that decay naturally,
 * simulating a small Tibetan singing bowl or temple bell.
 */
export function playMeditationBell(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Master gain — overall volume control
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.25, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    masterGain.connect(ctx.destination);

    // Fundamental tone — warm 528Hz (known as "love frequency")
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(528, now);
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.8);

    // 2nd harmonic — 1056Hz octave, softer
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1056, now);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now);
    osc2.stop(now + 0.5);

    // 3rd harmonic — 1584Hz, very subtle shimmer
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1584, now);
    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0.08, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.start(now);
    osc3.stop(now + 0.35);
  } catch {
    // Silently fail if audio isn't available
  }
}

/**
 * Play a gentle mala bead click — a soft, short percussive tone.
 * Lighter than the bell, suitable for every-tap mode.
 */
export function playBeadClick(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.15, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    masterGain.connect(ctx.destination);

    // Soft wooden bead click — short sine burst at ~800Hz
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // Silently fail if audio isn't available
  }
}

/**
 * Play a milestone celebration sound — a rising arpeggio of soft bells.
 */
export function playMilestoneChime(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [528, 660, 792, 1056];
    notes.forEach((freq, i) => {
      const startTime = now + i * 0.15;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.2, startTime);
      masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);
      masterGain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + 1.2);

      // Shimmer harmonic
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2, startTime);
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.1, startTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(startTime);
      osc2.stop(startTime + 0.6);
    });
  } catch {
    // Silently fail if audio isn't available
  }
}

export type SoundMode = 'every_tap' | 'every_108' | 'off';

/**
 * Play the appropriate sound based on mode and count.
 */
export function playChantSound(mode: SoundMode, count: number): void {
  if (mode === 'off') return;

  if (mode === 'every_tap') {
    playBeadClick();
  } else if (mode === 'every_108') {
    if (count % 108 === 0) {
      playMeditationBell();
    }
  }
}
