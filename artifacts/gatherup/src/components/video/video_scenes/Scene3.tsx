import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene3() {
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
      className="absolute inset-0 flex items-center justify-end px-[10vw]"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.2, opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      {phase >= 1 && (
        <motion.img 
          src={`${import.meta.env.BASE_URL}images/social.png`}
          className="absolute left-[10vw] top-[25vh] w-[35vw] rounded-2xl shadow-2xl object-cover"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
      )}

      <div className="max-w-[40vw] relative z-10 text-right">
        <motion.h2 className="text-[5vw] font-black tracking-tighter text-[#1F2937] leading-none uppercase"
          initial={{ opacity: 0, y: 50 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          Join Community
        </motion.h2>
        <motion.p className="text-[1.5vw] text-[#4B5563] mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}>
          Connect with locals who share your passion.
        </motion.p>
      </div>
    </motion.div>
  );
}
