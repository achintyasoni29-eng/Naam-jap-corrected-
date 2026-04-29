'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, LogOut, Cloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNaamJapStore } from '@/lib/store';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  // Supabase User State
  const [user, setUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Local App Data
  const totalCount = useNaamJapStore((s) => s.totalCount);
  const unlockedMilestones = useNaamJapStore((s) => s.unlockedMilestones);

  // Check if user is logged in when the dialog opens
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // This brings them right back to your app after logging in!
        redirectTo: window.location.origin,
      }
    });
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onOpenChange(false);
  };

  // Save Local Data to Cloud
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
        }, { onConflict: 'user_id' }); // Upsert updates the row if it exists, creates if it doesn't

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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Dialog Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md glass rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-container-highest/40 transition-colors text-on-surface-variant"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="font-serif text-2xl text-on-surface mb-6">Your Profile</h2>

          {/* IF USER IS NOT LOGGED IN */}
          {!user ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Cloud className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-body font-semibold text-lg text-on-surface mb-2">Secure Your Journey</h3>
              <p className="text-sm font-body text-on-surface-variant/70 mb-8 px-4">
                Sign in to back up your total chants and milestones safely to the cloud. Never lose your progress.
              </p>
              
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white text-black font-body font-semibold text-sm hover:bg-gray-100 transition-colors active:scale-95"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Sign in with Google
              </button>
            </div>
          ) : (
            /* IF USER IS LOGGED IN */
            <div className="space-y-6">
              {/* User Identity Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-highest/30 ring-1 ring-white/5">
                <img 
                  src={user.user_metadata?.avatar_url || 'https://via.placeholder.com/150'} 
                  alt="Profile" 
                  className="w-12 h-12 rounded-full border border-primary/20"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-body text-on-surface truncate">
                    {user.user_metadata?.full_name || 'Devotee'}
                  </p>
                  <p className="text-xs font-body text-on-surface-variant truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Cloud Sync Section */}
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

              {/* Logout Button */}
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
