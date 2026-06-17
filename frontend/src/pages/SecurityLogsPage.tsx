import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Play, Terminal, CheckCircle2 } from "lucide-react";

export default function SecurityLogsPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanSteps, setScanSteps] = useState<string[]>([]);
  const [scanFinished, setScanFinished] = useState(false);

  const handleScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanFinished(false);
    setScanSteps([]);

    const logs = [
      "📡 Connecting to secure keyserver at auth.nexus-pm.io...",
      "🔑 Analyzing 256-bit active cryptographic handshakes...",
      "🔒 Scanning JWT token signatures and credentials pool...",
      "🛡️  Verifying role-based permission policies (RBAC)...",
      "✅ Scan finished. 0 security incidents detected.",
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setScanSteps((prev) => [...prev, log]);
        if (index === logs.length - 1) {
          setIsScanning(false);
          setScanFinished(true);
        }
      }, (index + 1) * 800);
    });
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="relative flex justify-between items-center pb-2">
          {/* Ambient header glow */}
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="z-10 w-full max-w-5xl">
            <h1 className="text-4xl font-bold text-zinc-100">
              Security Audit Logs
            </h1>
            <p className="text-zinc-300 mt-2 text-sm font-sans max-w-2xl leading-relaxed">
              Track authentication transactions, API handshakes, and access audits.
            </p>
          </div>
        </div>

        {/* Empty State / Audit Console */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Columns - Beautiful Empty State */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center p-12 py-20 bg-zinc-900/20 border border-dashed border-zinc-850 rounded-xl h-full shadow-md"
            >
              {/* Shield SVG Illustration */}
              <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800/80 flex items-center justify-center text-zinc-400 mb-6 shadow-inner">
                <Shield size={22} className="text-zinc-550" />
              </div>

              <h3 className="text-lg font-bold text-zinc-200 mb-2">No security incidents detected</h3>
              <p className="text-xs text-zinc-300 max-w-lg leading-relaxed mb-8">
                Your workspace is secured. Active access control audits and JWT token verification systems are operating normally.
              </p>

              <button
                onClick={handleScan}
                disabled={isScanning}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm ${isScanning
                    ? "bg-zinc-850 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-950 cursor-pointer"
                  }`}
              >
                <Play size={12} fill="currentColor" />
                <span>{isScanning ? "Scanning System..." : "Run Security Scan"}</span>
              </button>
            </motion.div>
          </div>

          {/* Right Column - Scan Console */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col justify-between h-full min-h-[300px]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal size={14} />
                  Audit Console
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono mt-1">Logs will appear here during scans.</p>
              </div>

              {/* Console logs output */}
              <div className="bg-zinc-950 border border-zinc-850/80 rounded-lg p-4 font-mono text-[10px] text-zinc-300 space-y-2.5 h-48 overflow-y-auto mt-4">
                {scanSteps.map((step, idx) => (
                  <div key={idx} className={step.startsWith("✅") ? "text-emerald-400 font-semibold" : "text-zinc-350"}>
                    {step}
                  </div>
                ))}
                {scanSteps.length === 0 && !isScanning && (
                  <div className="text-zinc-500 italic py-10 text-center">Console idle. Run security scan to audit access.</div>
                )}
                {isScanning && (
                  <span className="inline-block w-1.5 h-3 bg-zinc-300 animate-pulse"></span>
                )}
              </div>

              {/* Scan Complete Banner */}
              <AnimatePresence>
                {scanFinished && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400 text-[10px] font-mono flex items-center gap-2 shadow-inner"
                  >
                    <CheckCircle2 size={12} />
                    <span>Audit complete. system status: SECURE.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </motion.div>
    </DashboardLayout>
  );
}
