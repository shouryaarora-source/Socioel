import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 0),
      setTimeout(() => setPhase(2), 400),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="text-center px-12 relative z-10">
        <motion.h1 className="text-[7vw] font-black tracking-tighter text-[#1F2937] leading-none uppercase"
          style={{ fontFamily: 'var(--font-display, sans-serif)' }}>
          {'Find Your'.split('').map((char, i) => (
            <motion.span key={i} style={{ display: 'inline-block' }}
              initial={{ opacity: 0, y: 60, rotateX: -40 }}
              animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 60, rotateX: -40 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: phase >= 2 ? i * 0.04 : 0 }}>
              {char}
            </motion.span>
          ))}
          <br/>
          {'Tribe'.split('').map((char, i) => (
            <motion.span key={i} style={{ display: 'inline-block', color: '#E05C23' }}
              initial={{ opacity: 0, y: 60, rotateX: -40 }}
              animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 60, rotateX: -40 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: phase >= 2 ? (i + 10) * 0.04 : 0 }}>
              {char}
            </motion.span>
          ))}
        </motion.h1>
      </div>
    </motion.div>
  );
}
