import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center flex-col"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div 
        className="w-[15vw] h-[15vw] bg-white rounded-full flex items-center justify-center shadow-xl mb-8 border-4 border-[#E05C23]"
        initial={{ scale: 0 }}
        animate={phase >= 1 ? { scale: 1 } : { scale: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <svg className="w-[8vw] h-[8vw] text-[#E05C23]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <motion.path 
            strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"
            initial={{ pathLength: 0 }}
            animate={phase >= 2 ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>

      <motion.h2 className="text-[4vw] font-black tracking-tighter text-[#1F2937] leading-none uppercase text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}>
        Get Verified
      </motion.h2>
      <motion.p className="text-[1.5vw] text-[#4B5563] mt-4 text-center max-w-[40vw]"
        initial={{ opacity: 0 }}
        animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        Safe and trusted. Selfie verification keeps the community real.
      </motion.p>
    </motion.div>
  );
}
