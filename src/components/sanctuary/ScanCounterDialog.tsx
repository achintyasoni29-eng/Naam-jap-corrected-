'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RotateCcw, Check, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useNaamJapStore } from '@/lib/store';

type ScanPhase = 'capture' | 'processing' | 'verify';

function ScanCounterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [phase, setPhase] = useState<ScanPhase>('capture');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [manualCount, setManualCount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addScannedCount = useNaamJapStore((s) => s.addScannedCount);

  React.useEffect(() => {
    if (open) {
      setPhase('capture');
      setPreviewUrl(null);
      setManualCount('');
      setError(null);
    }
  }, [open]);

  const processImageWithAI = async (base64Image: string) => {
    setPhase('processing');
    try {
      const res = await fetch('/api/scan-counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await res.json();

      if (data.success && data.number > 0) {
        setManualCount(data.number.toString());
      } else {
        // More descriptive error if AI fails to find a number
        setError(data.error || "Couldn't clearly see the numbers. Please enter them manually below.");
      }
    } catch (err) {
      // Graceful degradation: If Vercel still times out, we just let them type it in.
      setError("AI took too long to respond. Please enter your count manually below.");
    }
    setPhase('verify');
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setError(null);

    // ⚡ THE FIX: MICRO-COMPRESSION ⚡
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Shrink to 400px (More than enough for AI to read blocky LCD text)
        const MAX_WIDTH = 400; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Compress aggressively to 40% quality. Turns 5MB into ~15KB!
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.4); 
        
        setPreviewUrl(compressedBase64); 
        processImageWithAI(compressedBase64);
      };
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  }, []);

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
            Upload Counter Image
          </DialogTitle>
          <DialogDescription className="text-on-surface-variant/60 text-sm">
            {phase === 'capture' && 'Take a photo of your physical tally counter to log your chants.'}
            {phase === 'processing' && 'Extracting numbers from your photo...'}
            {phase === 'verify' && 'Confirm the number detected.'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {phase === 'capture' && (
            <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 pb-6">
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
              <div className="relative w-full aspect-[4/3] rounded-xl bg-surface-container/60 ghost-border overflow-hidden mb-4">
                <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-surface-container-high/30 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-surface-container-high/60 flex items-center justify-center">
                    <Camera className="size-8 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-on-surface-variant/70 text-sm font-body font-medium">Open Camera</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {phase === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 pb-6 flex flex-col items-center justify-center py-8">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-surface-container-high/40 flex items-center justify-center">
                  <Loader2 className="size-10 text-primary animate-spin" />
                </div>
              </div>
              <p className="text-on-surface-variant/70 text-sm font-body text-center animate-pulse">Scanning numbers...</p>
            </motion.div>
          )}

          {phase === 'verify' && (
            <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 pb-6">
              <div className="flex flex-col items-center gap-4 py-2">
                {previewUrl && (
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-outline-variant/20 relative">
                    <img src={previewUrl} alt="Captured counter" className="w-full h-full object-cover opacity-80" />
                    <button onClick={handleRetake} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-highest/80 backdrop-blur-sm flex items-center justify-center hover:bg-surface-container-highest shadow-lg">
                      <RotateCcw className="size-4 text-on-surface-variant" />
                    </button>
                  </div>
                )}
                <div className="w-full mt-2">
                  <label htmlFor="manual-count" className="block text-xs uppercase tracking-wider text-on-surface-variant/60 font-body mb-2 text-center">AI Detection Result</label>
                  <input id="manual-count" type="number" pattern="[0-9]*" inputMode="numeric" placeholder="e.g. 108" value={manualCount} onChange={(e) => { setManualCount(e.target.value); setError(null); }} className="w-full h-16 rounded-xl bg-surface-container-highest border border-outline-variant/30 text-center text-3xl font-light text-gold-gradient focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" autoFocus />
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-2 text-error/90 text-xs font-body w-full justify-center mt-2">
                      <AlertCircle className="size-4 shrink-0" />
                      <span className="text-center">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* --- ANTI-CHEAT BANNER --- */}
                <div className="w-full bg-surface-container-high/40 border border-outline-variant/20 rounded-lg p-3 mt-2 flex items-start gap-2">
                  <AlertCircle className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-on-surface-variant/80 font-body leading-relaxed text-left">
                    <strong>Integrity Check:</strong> Please ensure you enter the exact number from your physical counter. Honesty is the foundation of devotion.
                  </p>
                </div>
                {/* ----------------------------- */}

                <button onClick={handleConfirm} disabled={!manualCount} className="w-full h-12 mt-4 rounded-xl gold-gradient text-on-primary font-body font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  <Check className="size-5" /> Add to My Total
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
