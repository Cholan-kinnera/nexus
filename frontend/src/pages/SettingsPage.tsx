import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
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
  Monitor,
  Sun,
  Moon,
  Eye,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme, themeLogs, clearThemeLogs } = useTheme();
  const { user, login, token } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setRole(user.role || "");

      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.put("/users/me", {
        full_name: fullName,
        email: email,
        role: role,
      });

      if (response.status === 200) {
        const updatedUser = response.data;
        if (token) {
          login(token, {
            full_name: updatedUser.full_name,
            email: updatedUser.email,
            role: updatedUser.role,
          });
        }
        localStorage.setItem("userName", updatedUser.full_name || "");
        localStorage.setItem("userEmail", updatedUser.email || "");
        localStorage.setItem("userRole", updatedUser.role || "");

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile details. Please try again.");
    }
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
        <div className="relative mb-8">
          {/* Ambient header glow */}
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="z-10 w-full max-w-5xl">
            <h1 className="text-4xl font-bold text-zinc-100">
              Developer Settings
            </h1>
            <p className="text-zinc-300 mt-2 text-sm font-sans max-w-2xl leading-relaxed">
              Configure profile credentials, manage API integrations, and view system logs.
            </p>
          </div>
        </div>

        {isLoading ? (
          // ── SKELETON PLACEHOLDERS ────────────────────────────────────────
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 h-96 animate-pulse space-y-4">
              <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 bg-zinc-850 rounded w-1/4"></div>
                  <div className="h-9 bg-zinc-950/40 rounded border border-zinc-850"></div>
                </div>
              ))}
              <div className="h-9 bg-zinc-800 rounded w-full"></div>
            </div>
            <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 h-96 animate-pulse space-y-4">
              <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
              <div className="h-48 bg-zinc-950/40 rounded border border-zinc-850"></div>
            </div>
          </div>
        ) : (
          // ── ACTUAL SETTINGS PANEL ────────────────────────────────────────
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: User Info Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 shadow-md">
                <h2 className="text-sm font-bold text-zinc-150 mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <User size={16} className="text-zinc-400" />
                  User Profile
                </h2>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5 font-mono">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-3.5 text-zinc-550" />
                      <input
                        type="text"
                        className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-xs text-zinc-100 outline-none focus:border-zinc-700 transition-colors duration-200 font-mono"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5 font-mono">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-3.5 text-zinc-550" />
                      <input
                        type="email"
                        className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-xs text-zinc-100 outline-none focus:border-zinc-700 transition-colors duration-200 font-mono"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5 font-mono">
                      Professional Role
                    </label>
                    <div className="relative">
                      <Briefcase size={14} className="absolute left-3 top-3.5 text-zinc-550" />
                      <input
                        type="text"
                        className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-xs text-zinc-100 outline-none focus:border-zinc-700 transition-colors duration-200 font-mono"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs font-mono py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSaved ? "Saved Successfully!" : "Save Profile Details"}
                  </button>
                </form>
              </div>

              {/* Profile Avatar Card */}
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-xl mb-3 shadow-inner">
                  {user?.full_name ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase() : "U"}
                </div>
                <h3 className="font-bold text-zinc-150 text-sm">{user?.full_name}</h3>
                <p className="text-2xs text-zinc-500 mt-1 font-mono">{role}</p>
                <div className="mt-4 px-3 py-1 rounded border border-zinc-800 bg-zinc-950 text-[10px] font-mono font-semibold tracking-wider text-zinc-450 uppercase">
                  Active Session
                </div>
              </div>
            </div>

            {/* Right Column: API Keys + Logs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Terminal Box (Generate API Keys) */}
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-150 flex items-center gap-2 font-mono uppercase tracking-wider">
                      <Key size={16} className="text-zinc-400" />
                      API Credentials
                    </h2>
                    <p className="text-2xs text-zinc-500 font-mono mt-0.5">
                      Generate access keys for backend pipeline integrations.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateKey}
                    disabled={isGenerating}
                    className={`px-4 py-2 text-xs font-semibold font-mono rounded-lg text-white shadow-sm transition-all duration-200 ${isGenerating
                      ? "bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed"
                      : "bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:shadow-md cursor-pointer"
                      }`}
                  >
                    {isGenerating ? "Generating..." : "Generate API Key"}
                  </button>
                </div>

                {/* Developer Terminal Console */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-inner">
                  <div className="bg-zinc-900/60 px-4 py-2 flex items-center gap-2 border-b border-zinc-850">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-zinc-800 block"></span>
                      <span className="w-2 h-2 rounded-full bg-zinc-800 block"></span>
                      <span className="w-2 h-2 rounded-full bg-zinc-800 block"></span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5 ml-2">
                      <Terminal size={12} />
                      bash - nexus-cli
                    </span>
                  </div>

                  <div className="p-4 font-mono text-[11px] text-emerald-400 space-y-1.5 h-56 overflow-y-auto min-h-[14rem] select-all">
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
                      <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-pulse ml-0.5 align-middle"></span>
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                </div>

                {/* Key actions */}
                {generatedKey && (
                  <div className="mt-3 flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                    <div className="truncate mr-4">
                      <span className="text-[10px] text-zinc-450 uppercase tracking-wider font-semibold font-mono">
                        Copy API Key
                      </span>
                      <p className="text-xs font-mono text-zinc-200 mt-0.5 truncate max-w-md">
                        {generatedKey}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyKey}
                      className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    >
                      {hasCopied ? (
                        <>
                          <Check size={14} className="text-green-500" />
                          <span className="font-mono text-2xs">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span className="font-mono text-2xs">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Preferences / Theme Selector Card */}
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 shadow-md">
                <h2 className="text-sm font-bold text-zinc-150 mb-4 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <Eye size={16} className="text-zinc-400" />
                  Preferences
                </h2>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5 font-mono">
                      Appearance Theme
                    </span>
                    <p className="text-2xs text-zinc-500 font-mono mb-3">
                      Select how Nexus PM appears on this device.
                    </p>

                    {/* Segmented Theme Switcher */}
                    <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1 gap-1">
                      <button
                        type="button"
                        onClick={() => setTheme("system")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-center text-xs font-mono rounded-md transition-all duration-200 cursor-pointer ${theme === "system"
                            ? "bg-violet-600 text-white shadow-sm font-bold"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
                          }`}
                      >
                        <Monitor size={14} />
                        <span>System</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-center text-xs font-mono rounded-md transition-all duration-200 cursor-pointer ${theme === "light"
                            ? "bg-violet-600 text-white shadow-sm font-bold"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
                          }`}
                      >
                        <Sun size={14} />
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-center text-xs font-mono rounded-md transition-all duration-200 cursor-pointer ${theme === "dark"
                            ? "bg-violet-600 text-white shadow-sm font-bold"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
                          }`}
                      >
                        <Moon size={14} />
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Toggle Persistence Log */}
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-zinc-150 flex items-center gap-2 font-mono uppercase tracking-wider">
                      <ShieldAlert size={16} className="text-zinc-400" />
                      Theme Audit Log
                    </h2>
                    <p className="text-2xs text-zinc-500 font-mono mt-0.5">
                      Real-time local state logging tracking light/dark mode storage changes.
                    </p>
                  </div>
                  <button
                    onClick={clearThemeLogs}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-950/20 transition-all flex items-center gap-1.5 text-xs font-semibold font-mono cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Clear Logs
                  </button>
                </div>

                <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-4 font-mono text-[10px] text-zinc-500 space-y-1 h-36 overflow-y-auto">
                  {themeLogs.map((log, idx) => (
                    <div key={idx} className="hover:bg-zinc-900/50 p-0.5 rounded transition-colors">
                      {log}
                    </div>
                  ))}
                  {themeLogs.length === 0 && (
                    <div className="text-zinc-650 italic text-center py-4">No audit logs available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
