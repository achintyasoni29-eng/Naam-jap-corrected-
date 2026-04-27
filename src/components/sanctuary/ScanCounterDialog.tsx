'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  RotateCcw,
  Check,
  Loader2,
  ImageIcon,
  AlertCircle,
  X,
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

interface ScanResult {
  success: boolean;
  number: number;
  message: string;
}

type ScanPhase = 'capture' | 'processing' | 'result';

function ScanCounterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [phase, setPhase] = useState<ScanPhase>('capture');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addScannedCount = useNaamJapStore((s) => s.addScannedCount);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setPhase('capture');
      setPreviewUrl(null);
      setBase64Image(null);
      setResult(null);
      setError(null);
    }
  }, [open]);

  // Clean up object URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image is too large. Please use a photo under 10MB.');
        return;
      }

      setError(null);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setBase64Image(base64);
      };
      reader.readAsDataURL(file);

      // Reset file input so same file can be re-selected
      e.target.value = '';
    },
    []
  );

  const handleScan = useCallback(async () => {
    if (!base64Image) return;

    setPhase('processing');
    setError(null);

    try {
      const res = await fetch('/api/scan-counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await res.json();

      if (data.success && data.number >= 0) {
        setResult(data);
        setPhase('result');
      } else {
        setError(data.message || data.error || 'Could not read the counter. Please try again.');
        setPhase('capture');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setPhase('capture');
    }
  }, [base64Image]);

  const handleConfirm = useCallback(() => {
    if (result && result.success && result.number > 0) {
      addScannedCount(result.number);
    }
    onOpenChange(false);
  }, [result, addScannedCount, onOpenChange]);

  const handleRetake = useCallback(() => {
    setPhase('capture');
    setPreviewUrl(null);
    setBase64Image(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-outline-variant/15 sm:max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="pt-6 pb-2 px-6">
          <DialogTitle className="font-serif text-on-surface text-lg flex items-center gap-2">
            <Camera className="size-5 text-primary" />
            Scan Physical Counter
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant/60 text-sm">
            {phase === 'capture' &&
              'Take a clear photo of your tally counter\'s number display.'}
            {phase === 'processing' && 'Reading the counter display...'}
            {phase === 'result' && 'Confirm the detected number below.'}
          </DialogDescription>
        </DialogHeader>

        {/* ═══ CAPTURE PHASE ═══ */}
        <AnimatePresence mode="wait">
          {phase === 'capture' && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="px-6 pb-6"
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Capture photo of physical counter"
              />

              {/* Preview area or placeholder */}
              <div className="relative w-full aspect-[4/3] rounded-xl bg-surface-container/60 ghost-border overflow-hidden mb-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview of captured counter"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-surface-container-high/30 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full bg-surface-container-high/60 flex items-center justify-center">
                      <ImageIcon className="size-8 text-on-surface-variant/40" />
                    </div>
                    <div className="text-center">
                      <p className="text-on-surface-variant/70 text-sm font-body font-medium">
                        Tap to open camera
                      </p>
                      <p className="text-on-surface-variant/40 text-xs font-body mt-1">
                        or upload a photo
                      </p>
                    </div>
                  </button>
                )}

                {/* Retake button (overlays preview) */}
                {previewUrl && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface-container-highest/80 backdrop-blur-sm flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                    aria-label="Retake photo"
                  >
                    <RotateCcw className="size-4 text-on-surface-variant" />
                  </button>
                )}
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

              {/* Scan button */}
              <button
                onClick={handleScan}
                disabled={!previewUrl}
                className="w-full h-12 rounded-xl gold-gradient text-on-primary font-body font-semibold text-sm disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Camera className="size-4" />
                Read Counter
              </button>

              {/* Tip */}
              <p className="text-on-surface-variant/40 text-[11px] text-center mt-3 font-body leading-relaxed">
                Tip: Hold the camera steady and ensure the number display is clearly visible with good lighting.
              </p>
            </motion.div>
          )}

          {/* ═══ PROCESSING PHASE ═══ */}
          {phase === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="px-6 pb-6"
            >
              <div className="flex flex-col items-center gap-4 py-6">
                {/* Pulsing loader */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-surface-container-high/40 flex items-center justify-center">
                    <Loader2 className="size-10 text-primary animate-spin" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                </div>

                {/* Preview thumbnail */}
                {previewUrl && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden opacity-60">
                    <img
                      src={previewUrl}
                      alt="Scanning counter..."
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <p className="text-on-surface-variant/70 text-sm font-body text-center">
                  AI is reading your counter display...
                </p>
              </div>
            </motion.div>
          )}

          {/* ═══ RESULT PHASE ═══ */}
          {phase === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="px-6 pb-6"
            >
              {/* Result display */}
              <div className="text-center py-4">
                <p className="text-on-surface-variant/50 text-xs uppercase tracking-[0.15em] font-body mb-2">
                  Detected Count
                </p>
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                  className="font-body text-5xl font-light text-gold-gradient tabular-nums mb-2"
                >
                  {result.number.toLocaleString('en-IN')}
                </motion.p>
                <p className="text-on-surface-variant/40 text-xs font-body">
                  This will be added to your total
                </p>
              </div>

              {/* Preview thumbnail */}
              {previewUrl && (
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden opacity-40">
                    <img
                      src={previewUrl}
                      alt="Scanned counter"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRetake}
                  className="h-12 rounded-xl glass ghost-border flex items-center justify-center gap-2 text-on-surface-variant/70 hover:bg-surface-container-high/40 active:scale-[0.97] transition-all"
                >
                  <RotateCcw className="size-4" />
                  <span className="text-sm font-medium">Rescan</span>
                </button>
                <button
                  onClick={handleConfirm}
                  className="h-12 rounded-xl gold-gradient text-on-primary font-body font-semibold text-sm active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                >
                  <Check className="size-4" />
                  Add Chants
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
