'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, Cloud, CheckCircle2, AlertCircle, Mail, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNaamJapStore } from '@/lib/store';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const [user, setUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  // Auth States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const totalCount = useNaamJapStore((s) => s.totalCount);
  const unlockedMilestones = useNaamJapStore((s) => s.unlockedMilestones);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Send the 6-digit code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  // Verify the 6-digit code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      setAuthError(error.message);
    } else {
      // Success! The useEffect will automatically catch the new user
      setStep('email'); 
      setEmail('');
      setOtp('');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onOpenChange(false);
  };

  const syncToCloud = async () => {
    if (!user) return;
    setSyncStatus('syncing');

    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          total_chants: totalCount,
          unlocked_milestones: unlockedMilestones,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Error syncing:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-highest/40 transition-colors text-on-surface-variant"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="font-serif text-2xl text-on-surface mb-6">Your Profile</h2>

          {!user ? (
            <div className="flex flex-col items-center justify-center py-2 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Cloud className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-body font-semibold text-lg text-on-surface mb-2">Secure Your Journey</h3>
              <p className="text-sm font-body text-on-surface-variant/70 mb-6 px-4">
                Enter your email to receive a secure login code. Never lose your progress.
              </p>
              
              {step === 'email' ? (
                <form onSubmit={handleSendCode} className="w-full space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant/50" />
                    <input 
                      type="email" 
                      required
                      placeholder="devotee@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-container-highest/30 border border-outline-variant/30 rounded-xl py-3 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  {authError && <p className="text-xs text-red-400">{authError}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl gold-gradient text-on-primary font-body font-semibold text-sm transition-transform active:scale-95 disabled:opacity-70"
                  >
                    {loading ? 'Sending Code...' : 'Send Login Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="w-full space-y-4">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant/50" />
                    <input 
                      type="text" 
                      required
                      placeholder="Enter 6-digit code" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full bg-surface-container-highest/30 border border-outline-variant/30 rounded-xl py-3 pl-10 pr-4 text-on-surface tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  {authError && <p className="text-xs text-red-400">{authError}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl gold-gradient text-on-primary font-body font-semibold text-sm transition-transform active:scale-95 disabled:opacity-70"
                  >
                    {loading ? 'Verifying...' : 'Verify Code & Login'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep('email')}
                    className="text-xs text-primary mt-2 hover:underline"
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-highest/30 ring-1 ring-white/5">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-body text-on-surface truncate">
                    Devotee
                  </p>
                  <p className="text-xs font-body text-on-surface-variant truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold font-body text-primary mb-1">Cloud Backup</p>
                    <p className="text-xs font-body text-on-surface-variant/70">
                      Save your {totalCount.toLocaleString('en-IN')} chants safely to the heavens.
                    </p>
                  </div>
                  <Cloud className="h-5 w-5 text-primary opacity-70" />
                </div>
                
                <button
                  onClick={syncToCloud}
                  disabled={syncStatus === 'syncing'}
                  className="w-full py-3 rounded-xl gold-gradient text-on-primary font-body font-semibold text-sm tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {syncStatus === 'idle' && 'Sync Data Now'}
                  {syncStatus === 'syncing' && 'Syncing...'}
                  {syncStatus === 'success' && <><CheckCircle2 className="w-4 h-4" /> Successfully Saved</>}
                  {syncStatus === 'error' && <><AlertCircle className="w-4 h-4" /> Try Again</>}
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-body font-semibold text-sm hover:bg-surface-container-highest/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
