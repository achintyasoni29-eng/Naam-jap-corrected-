'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNaamJapStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Cloud, ArrowRight, User, Target } from 'lucide-react';

export default function OnboardingOverlay() {
  const { hasSeenOnboarding, setHasSeenOnboarding, userName, setUserName, setDailyGoal } = useNaamJapStore();
  const [step, setStep] = useState(1);
  const [localName, setLocalName] = useState(userName || '');

  // If they have already done this, don't show the screen at all
  if (hasSeenOnboarding) return null;

  const handleNextStep = () => setStep((s) => s + 1);

  const handleFinish = () => {
    setHasSeenOnboarding(true);
  };

  const handleGoogleLogin = async () => {
    // Mark onboarding as complete right before leaving the app
    setHasSeenOnboarding(true);
    
    const isApp = typeof window !== 'undefined' && navigator.userAgent.includes('NaamJapApp');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: isApp ? 'naamjap://auth' : 'https://naam-jap-corrected.vercel.app' 
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-background/95 backdrop-blur-xl">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: WELCOME & NAME */}
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-serif text-3xl text-on-surface mb-2">Begin Your Journey</h2>
            <p className="text-sm font-body text-on-surface-variant/70 mb-8">How would you like to be addressed?</p>
            
            <input 
              type="text" 
              placeholder="Enter your name" 
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="w-full bg-surface-container-highest/30 border border-outline-variant/30 rounded-xl py-4 px-4 text-center text-on-surface text-lg mb-8 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            
            <button 
              onClick={() => {
                setUserName(localName || 'Devotee');
                handleNextStep();
              }}
              className="w-full py-4 rounded-xl gold-gradient text-on-primary font-body font-bold text-sm tracking-wide transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* STEP 2: SET THE GOAL */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
          >
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-serif text-2xl text-on-surface mb-2">Welcome, {localName || 'Devotee'}</h2>
            <p className="text-sm font-body text-on-surface-variant/70 mb-8">Set your daily chanting commitment.</p>
            
            <div className="w-full space-y-3 mb-8">
              {[108, 500, 1000].map((goal) => (
                <button 
                  key={goal}
                  onClick={() => {
                    setDailyGoal(goal);
                    handleNextStep();
                  }}
                  className="w-full py-4 rounded-xl border border-outline-variant/30 text-on-surface font-body font-semibold text-lg hover:bg-primary/10 hover:border-primary/50 transition-all active:scale-95"
                >
                  {goal} Chants / Day
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3: SOFT AUTH ASK */}
        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md glass rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Cloud className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-serif text-2xl text-on-surface mb-2">Secure Your Journey</h2>
            <p className="text-sm font-body text-on-surface-variant/70 mb-8 px-2">
              Don't lose your progress if you change phones. Link your account to back up your chants safely to the cloud.
            </p>
            
            <button 
              onClick={handleGoogleLogin} 
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white text-black font-body font-bold text-sm hover:bg-gray-100 transition-colors active:scale-95 mb-4"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" /> 
              Sign in with Google
            </button>
            
            <button 
              onClick={handleFinish}
              className="w-full py-3 text-on-surface-variant font-body text-sm font-medium hover:text-on-surface transition-colors"
            >
              Skip for now, keep data on device
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
