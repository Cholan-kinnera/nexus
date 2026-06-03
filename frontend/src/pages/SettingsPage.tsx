import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";
import {
  Terminal,
  Key,
  User,
  Mail,
  Briefcase,
  ShieldAlert,
  Trash2,
  Check,
  Copy,
} from "lucide-react";

export default function SettingsPage() {
  const { themeLogs, clearThemeLogs } = useTheme();

  // User Info States (initialized from localStorage or default values)
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "Cholan Kinnera");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail") || "cholan@example.com");
  const [userRole, setUserRole] = useState(() => localStorage.getItem("userRole") || "Lead Developer");
  const [isSaved, setIsSaved] = useState(false);

  // Terminal States
  const [terminalLines, setTerminalLines] = useState<string[]>(["$ click 'Generate API Key' above to begin..."]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLines]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("userName", userName);
    localStorage.setItem("userEmail", userEmail);
    localStorage.setItem("userRole", userRole);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleGenerateKey = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGeneratedKey("");
    setHasCopied(false);

    const logSteps = [
      "$ nexus-cli apikey:generate --env=production",
      "📡 Connecting to secure keyserver at auth.nexus-pm.io...",
      "🔑 Initializing 256-bit cryptographic handshake...",
      "⚙️  Encrypting payload with RSA-4096 signature...",
      "✅ Key generated and synchronized successfully.",
    ];

    setTerminalLines([]);

    logSteps.forEach((step, index) => {
      setTimeout(() => {
        setTerminalLines((prev) => [...prev, step]);
        if (index === logSteps.length - 1) {
          const mockKey = "nx_live_" + Array.from({ length: 32 }, () =>
            Math.random().toString(36).charAt(2)
          ).join("");
          setGeneratedKey(mockKey);
          setTerminalLines((prev) => [
            ...prev,
            `🔑 API Key: ${mockKey}`,
            "⚠️  WARNING: Keep this key confidential. It will not be shown again.",
          ]);
          setIsGenerating(false);
        }
      }, (index + 1) * 600);
    });
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-5xl mx-auto"
      >
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-zinc-100">
            Developer Settings
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-2">
            Configure profile credentials, manage API integrations, and view system logs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: User Info Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <User size={18} className="text-violet-600 dark:text-violet-400" />
                User Profile
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-3 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors duration-200"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="email"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors duration-200"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                    Professional Role
                  </label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-3 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-zinc-100 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors duration-200"
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isSaved ? "Saved Successfully!" : "Save Profile Details"}
                </button>
              </form>
            </div>

            {/* Profile Avatar Card */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-2xl mb-3 shadow-inner">
                {userName.split(" ").map(n => n[0]).join("").toUpperCase()}
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100">{userName}</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{userRole}</p>
              <div className="mt-4 px-3 py-1 rounded-full text-2xs font-semibold tracking-wider bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 uppercase">
                Active Developer Session
              </div>
            </div>
          </div>

          {/* Right Column: API Keys + Logs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Terminal Box (Generate API Keys) */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Key size={18} className="text-violet-600 dark:text-violet-400" />
                    API Credentials
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Generate access keys for backend pipeline integrations.
                  </p>
                </div>
                <button
                  onClick={handleGenerateKey}
                  disabled={isGenerating}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-all duration-200 ${
                    isGenerating
                      ? "bg-zinc-400 dark:bg-zinc-700 cursor-not-allowed"
                      : "bg-violet-600 hover:bg-violet-500 hover:shadow-md cursor-pointer"
                  }`}
                >
                  {isGenerating ? "Generating..." : "Generate API Key"}
                </button>
              </div>

              {/* Developer Terminal Console */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                {/* Console Header Bar */}
                <div className="bg-zinc-900 px-4 py-2 flex items-center gap-2 border-b border-zinc-800">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 block"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 block"></span>
                  </div>
                  <span className="text-2xs font-mono text-zinc-500 flex items-center gap-1.5 ml-2">
                    <Terminal size={12} />
                    bash - nexus-cli
                  </span>
                </div>

                {/* Console Body */}
                <div className="p-4 font-mono text-xs text-emerald-400 space-y-1.5 h-56 overflow-y-auto min-h-[14rem] select-all">
                  {terminalLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={
                        line.startsWith("$")
                          ? "text-zinc-300 font-semibold"
                          : line.includes("WARNING")
                          ? "text-amber-400"
                          : line.includes("API Key:")
                          ? "text-violet-400 select-all font-bold"
                          : "text-emerald-400"
                      }
                    >
                      {line}
                    </div>
                  ))}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-0.5 align-middle"></span>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>

              {/* Key actions */}
              {generatedKey && (
                <div className="mt-3 flex items-center justify-between bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
                  <div className="truncate mr-4">
                    <span className="text-2xs text-violet-600 dark:text-violet-400 uppercase tracking-wider font-semibold">
                      Copy API Key
                    </span>
                    <p className="text-xs font-mono text-slate-800 dark:text-zinc-200 mt-0.5 truncate max-w-md">
                      {generatedKey}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyKey}
                    className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5 text-xs font-medium"
                  >
                    {hasCopied ? (
                      <>
                        <Check size={14} className="text-green-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle Persistence Log */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <ShieldAlert size={18} className="text-violet-600 dark:text-violet-400" />
                    Theme Persistence Audit Log
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Real-time local state logging tracking light/dark mode storage changes.
                  </p>
                </div>
                <button
                  onClick={clearThemeLogs}
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Trash2 size={14} />
                  Clear Logs
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 font-mono text-2xs text-slate-600 dark:text-zinc-400 space-y-1 h-36 overflow-y-auto">
                {themeLogs.map((log, idx) => (
                  <div key={idx} className="hover:bg-slate-100 dark:hover:bg-zinc-900/50 p-0.5 rounded transition-colors">
                    {log}
                  </div>
                ))}
                {themeLogs.length === 0 && (
                  <div className="text-zinc-500 italic text-center py-4">No audit logs available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
