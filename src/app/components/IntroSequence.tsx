import { useEffect } from 'react';
import { motion } from 'motion/react';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFF_META: Record<Difficulty, { label: string; caseRef: string; tabColor: string; stamp: string }> = {
  easy:   { label: 'ROOKIE CHASE',    caseRef: 'OP-PHANTOM-1', tabColor: '#5a7a3a', stamp: 'OPEN'       },
  medium: { label: 'SENIOR AGENT',    caseRef: 'OP-PHANTOM-2', tabColor: '#9a6020', stamp: 'RESTRICTED' },
  hard:   { label: 'ELITE OPERATION', caseRef: 'OP-PHANTOM-3', tabColor: '#8b1a0a', stamp: 'CLASSIFIED' },
};

interface Props {
  onComplete: () => void;
  difficulty?: Difficulty;
}

export function IntroSequence({ onComplete, difficulty = 'easy' }: Props) {
  const meta = DIFF_META[difficulty];

  // Auto-advance after 3.2s
  useEffect(() => {
    const t = setTimeout(onComplete, 3200);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080604', zIndex: 4000, overflow: 'hidden',
      fontFamily: "'Space Mono', monospace",
    }}>
      {/* Subtle scanlines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 3px)' }} />

      {/* Case folder flying in */}
      <motion.div
        initial={{ opacity: 0, y: 60, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', width: 340 }}
      >
        {/* Folder tab */}
        <div style={{ height: 26, background: meta.tabColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 16, marginRight: 80, borderRadius: '4px 4px 0 0' }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.9)' }}>{meta.caseRef}</span>
        </div>

        {/* Folder body */}
        <div style={{ background: '#ede0c4', padding: '28px 28px 32px', boxShadow: '0 24px 80px rgba(0,0,0,0.9)', position: 'relative' }}>
          {/* Stamp */}
          <motion.div
            initial={{ opacity: 0, scale: 1.4, rotate: 14 }}
            animate={{ opacity: 1, scale: 1, rotate: 12 }}
            transition={{ delay: 0.5, duration: 0.3, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: 18, right: 18,
              border: `3px solid ${meta.tabColor}bb`,
              padding: '3px 9px',
              fontSize: 11, fontWeight: 900, letterSpacing: '0.2em',
              color: `${meta.tabColor}cc`,
              fontFamily: "'Oswald', sans-serif",
              transform: 'rotate(12deg)',
            }}
          >{meta.stamp}</motion.div>

          {/* Top rule */}
          <div style={{ borderTop: '2px solid #9a8060', marginBottom: 18 }} />

          {/* INTERPOL */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: 9, letterSpacing: '0.3em', color: '#7a5a30', marginBottom: 12 }}>
            INTERPOL · FIELD OPERATIONS
          </motion.div>

          {/* Big difficulty label */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}
            style={{ fontFamily: "'Oswald', sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: '0.1em', color: '#1a0800', lineHeight: 1, marginBottom: 14 }}>
            {meta.label}
          </motion.div>

          <div style={{ borderTop: '1px dashed #b09060', marginBottom: 14 }} />

          {/* Status line */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ fontSize: 10, color: '#5a3a10', letterSpacing: '0.12em', lineHeight: 1.9 }}>
            <div>STATUS:  CASE FILE OPENED</div>
            <div>AGENT:   FIELD DETECTIVE, UNIT 7</div>
            <div style={{ color: '#8b1a0a', fontWeight: 700 }}>ACTION:  MISSION COMMENCING...</div>
          </motion.div>

          {/* Loading bar */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            style={{ marginTop: 18, height: 3, background: '#c0a870', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: '0%' }} animate={{ width: '100%' }}
              transition={{ delay: 1.1, duration: 1.8, ease: 'linear' }}
              style={{ height: '100%', background: meta.tabColor, borderRadius: 2 }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Skip */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        onClick={onComplete}
        style={{ position: 'absolute', bottom: 24, right: 32, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: '0.2em', cursor: 'pointer', fontFamily: "'Space Mono', monospace" }}
      >SKIP →</motion.button>
    </div>
  );
}
