import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BOOT_PHRASES = [
  "Initializing secure session...",
  "Syncing cloud database metrics...",
  "Authenticating user credentials...",
  "Establishing cryptographic tunnel...",
  "Loading workspaces & analytics...",
  "Launching Nexus-PM v1.0...",
];

export default function LoadingSplash() {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const phraseInterval = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % BOOT_PHRASES.length);
    }, 700);
    return () => clearInterval(phraseInterval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
      className="fixed inset-0 bg-zinc-950 z-[9999] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Ambient center violet radial glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none select-none" />

      {/* Techy Logo & Spinner Area */}
      <div className="relative flex flex-col items-center gap-8">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Pulsing outer ring */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full border border-violet-500/30"
          />

          {/* Rotating dashboard circle */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute w-20 h-20 rounded-full border-t-2 border-r-2 border-violet-500 border-b-transparent border-l-transparent"
          />

          {/* Glowing central cube */}
          <motion.div
            animate={{
              scale: [0.95, 1.05, 0.95],
              rotate: [0, 45, 90, 135, 180, 225, 270, 315, 360],
            }}
            transition={{
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
            }}
            className="w-8 h-8 bg-violet-600 rounded-lg shadow-lg shadow-violet-500/50 flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" />
            </svg>
          </motion.div>
        </div>

        {/* Text Area */}
        <div className="flex flex-col items-center gap-1.5 text-center z-10">
          <h2 className="text-white font-bold text-lg tracking-wider uppercase">
            NEXUS <span className="text-violet-500">PM</span>
          </h2>

          <div className="h-5 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={phraseIdx}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-xs font-mono text-zinc-500 tracking-wide"
              >
                {BOOT_PHRASES[phraseIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Retro scanlines effect */}
      <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.03]" />
    </motion.div>
  );
}
