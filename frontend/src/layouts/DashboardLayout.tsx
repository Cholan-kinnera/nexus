import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import LoadingSplash from "../components/LoadingSplash";
import CommandPalette from "../components/CommandPalette";
import { Bell, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

interface Props {
  children: ReactNode;
}

interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
}

export default function DashboardLayout({ children }: Props) {
  const { hasBooted, setHasBooted } = useAuth();
  const [isBooting, setIsBooting] = useState(!hasBooted);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "1", text: "Sarah Logan commented on your task 'Configure Gateway'", time: "3m ago", read: false },
    { id: "2", text: "Alice Miller assigned you task 'Database Schema Migration'", time: "1h ago", read: false },
    { id: "3", text: "System check: Automated DB backup successfully uploaded", time: "4h ago", read: true },
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (hasBooted) {
      setIsBooting(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsBooting(false);
      setHasBooted(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [hasBooted, setHasBooted]);

  return (
    <>
      <CommandPalette />
      <AnimatePresence mode="wait">
        {isBooting && <LoadingSplash />}
      </AnimatePresence>

      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
        <Sidebar />
 
        <main className="flex-1 p-8 flex flex-col">
          {/* Top Header Row with Notification Center */}
          <header className="flex justify-between items-center mb-6">
            <div className="text-2xs font-bold text-zinc-500 uppercase tracking-widest select-none font-mono">
              Workspace / Nexus PM
            </div>
 
            {/* Right Section: Notification trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setNotifsOpen(!notifsOpen)}
                className="relative p-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 hover:text-white transition-all duration-200 cursor-pointer shadow-md"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-zinc-100 text-zinc-950 rounded-full flex items-center justify-center font-mono font-bold text-[9px] shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
 
              {/* Framer Motion Notification Dropdown */}
              <AnimatePresence>
                {notifsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-full mt-2.5 w-80 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 text-zinc-100 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-850">
                      <span className="text-sm font-bold text-zinc-100">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-zinc-300 hover:text-white font-semibold text-2xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <CheckCheck size={12} />
                          Mark all as read
                        </button>
                      )}
                    </div>
 
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border transition-all duration-200 ${n.read
                              ? "bg-zinc-950/40 border-zinc-800/50 opacity-60"
                              : "bg-zinc-800/40 border-zinc-700/60"
                            }`}
                        >
                          <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                            {n.text}
                          </p>
                          <span className="text-[10px] text-zinc-500 font-mono mt-1.5 block">
                            {n.time}
                          </span>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="text-center py-6 text-zinc-500 italic text-xs">
                          No notifications.
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>
 
          {/* Content Box */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}