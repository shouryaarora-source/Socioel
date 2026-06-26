import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-start px-[10vw]"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="max-w-[40vw] relative z-10">
        <motion.h2 className="text-[5vw] font-black tracking-tighter text-[#1F2937] leading-none uppercase"
          initial={{ opacity: 0, x: 50 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          Discover Events
        </motion.h2>
        <motion.p className="text-[1.5vw] text-[#4B5563] mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}>
          From morning runs to evening yoga. Local activities happening around you every day.
        </motion.p>
      </div>
      
      {phase >= 1 && (
        <motion.img 
          src={`${import.meta.env.BASE_URL}images/running.png`}
          className="absolute right-[10vw] top-[20vh] w-[30vw] rounded-2xl shadow-2xl object-cover"
          initial={{ scale: 0.8, opacity: 0, rotate: 10 }}
          animate={{ scale: 1, opacity: 1, rotate: -5 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
      )}
    </motion.div>
  );
}
