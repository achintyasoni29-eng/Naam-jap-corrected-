'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  RotateCcw,
  Check,
  ImageIcon,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useNaamJapStore } from '@/lib/store';

// ──────────────────────────────────────────────
// Scan Physical Counter Dialog
// ──────────────────────────────────────────────

type ScanPhase = 'capture' | 'verify';

function ScanCounterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [phase, setPhase] = useState<ScanPhase>('capture');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [manualCount, setManualCount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addScannedCount = useNaamJapStore((s) => s.addScannedCount);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setPhase('capture');
      setPreviewUrl(null);
      setManualCount('');
      setError(null);
    }
  }, [open]);

  // Clean up object URL on unmount to prevent memory leaks
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }

      setError(null);

      // Create preview URL and move instantly to verification phase
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPhase('verify');

      // Reset file input so same file can be re-selected if needed
      e.target.value = '';
    },
    []
  );

  const handleConfirm = useCallback(() => {
    const count = parseInt(manualCount, 10);
    if (isNaN(count) || count <= 0) {
      setError('Please enter a valid number greater than 0.');
      return;
    }
    
    addScannedCount(count);
    onOpenChange(false);
  }, [manualCount, addScannedCount, onOpenChange]);

  const handleRetake = useCallback(() => {
    setPhase('capture');
    setPreviewUrl(null);
    setManualCount('');
    setError(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-outline-variant/15 sm:max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="pt-6 pb-2 px-6">
          <DialogTitle className="font-serif text-on-surface text-lg flex items-center gap-2">
            <Camera className="size-5 text-primary" />
            Sync Physical Counter
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant/60 text-sm">
            {phase === 'capture' &&
              'Take a photo of your physical tally counter to log your chants.'}
            {phase === 'verify' && 'Enter the number shown on your counter.'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ═══ CAPTURE PHASE ═══ */}
          {phase === 'capture' && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="px-6 pb-6"
            >
              {/* Hidden file input that triggers the mobile camera */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Capture photo of physical counter"
              />

              {/* Camera Trigger Button */}
              <div className="relative w-full aspect-[4/3] rounded-xl bg-surface-container/60 ghost-border overflow-hidden mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-surface-container-high/30 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-surface-container-high/60 flex items-center justify-center">
                    <Camera className="size-8 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-on-surface-variant/70 text-sm font-body font-medium">
                      Open Camera
                    </p>
                  </div>
                </button>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 text-error/90 text-xs font-body mb-3 px-1"
                  >
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ═══ VERIFY & ENTER PHASE ═══ */}
          {phase === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="px-6 pb-6"
            >
              <div className="flex flex-col items-center gap-4 py-2">
                
                {/* Photo Preview */}
                {previewUrl && (
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-outline-variant/20 relative">
                    <img
                      src={previewUrl}
                      alt="Captured counter"
                      className="w-full h-full object-cover opacity-80"
                    />
                    <button
                      onClick={handleRetake}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-highest/80 backdrop-blur-sm flex items-center justify-center hover:bg-surface-container-highest transition-colors shadow-lg"
                      aria-label="Retake photo"
                    >
                      <RotateCcw className="size-4 text-on-surface-variant" />
                    </button>
                  </div>
                )}

                {/* Manual Number Input */}
                <div className="w-full mt-2">
                  <label htmlFor="manual-count" className="block text-xs uppercase tracking-wider text-on-surface-variant/60 font-body mb-2 text-center">
                    What number is on the counter?
                  </label>
                  <input
                    id="manual-count"
                    type="number"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="e.g. 108"
                    value={manualCount}
                    onChange={(e) => {
                      setManualCount(e.target.value);
                      setError(null);
                    }}
                    className="w-full h-16 rounded-xl bg-surface-container-highest border border-outline-variant/30 text-center text-3xl font-light text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/20"
                    autoFocus
                  />
                </div>
                
                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 text-error/90 text-xs font-body w-full justify-center"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add Chants Button */}
                <button
                  onClick={handleConfirm}
                  disabled={!manualCount}
                  className="w-full h-12 mt-2 rounded-xl gold-gradient text-on-primary font-body font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Check className="size-5" />
                  Add to My Total
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default ScanCounterDialog;
