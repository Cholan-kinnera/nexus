import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import LoadingSplash from "../components/LoadingSplash";
import CommandPalette from "../components/CommandPalette";
import { Bell, CheckCheck, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  formatRelativeTime,
} from "../services/notificationService";
import type { NotificationResponse } from "../services/notificationService";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const { hasBooted, setHasBooted, user, token } = useAuth();
  const [isBooting, setIsBooting] = useState(!hasBooted);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotificationsData = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const [notifsData, countData] = await Promise.all([
        getNotifications(10, 0),
        getUnreadCount(),
      ]);
      setNotifications(notifsData?.items ?? []);
      setUnreadCount(countData.unread_count);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markAsRead(id);
      await loadNotificationsData();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      await loadNotificationsData();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Load initially when token is available
  useEffect(() => {
    if (token) {
      loadNotificationsData();
    }
  }, [token]);

  // Load on open dropdown transition
  useEffect(() => {
    if (notifsOpen && token) {
      loadNotificationsData();
    }
  }, [notifsOpen, token]);

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

        <main className="flex-1 min-w-0 p-8 flex flex-col">
          {/* Top Workspace Bar */}
          <header className="flex items-center justify-between border border-zinc-800/60 backdrop-blur-sm rounded-full bg-zinc-900/50 py-2.5 px-5 shadow-lg shadow-black/10 mb-8 z-40">
            {/* Workspace Name */}
            <div className="flex items-center gap-2.5 pl-2 select-none">
              <span className="text-xs font-bold text-zinc-300 font-mono tracking-tight">
                Nexus Workspace
              </span>
              <span className="px-1.5 py-0.5 bg-zinc-950/80 border border-zinc-850 rounded text-[9px] text-zinc-500 font-mono">
                PROD
              </span>
            </div>

            {/* Global Search Button */}
            <div className="flex-1 max-w-[480px] min-w-[320px] mx-6 hidden sm:block">
              <button
                onClick={() => {
                  const event = new KeyboardEvent("keydown", {
                    key: "k",
                    ctrlKey: true,
                    metaKey: true,
                    bubbles: true
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full flex items-center justify-between px-3.5 py-1.8 bg-zinc-900/50 dark:bg-zinc-950/40 hover:bg-zinc-900/80 dark:hover:bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 rounded-lg text-2xs text-zinc-500 font-mono transition-all duration-200 cursor-pointer shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-none"
              >
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <Search size={12} className="text-zinc-500" />
                  <span>Search projects, tasks, logs...</span>
                </span>
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-[8px] rounded text-zinc-500 shadow-sm">⌘K</kbd>
              </button>
            </div>

            {/* Right Controls: Notifications & Profile */}
            <div className="flex items-center gap-3">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setNotifsOpen(!notifsOpen)}
                  className="relative p-2 bg-zinc-900/50 dark:bg-zinc-950/40 hover:bg-zinc-900/80 dark:hover:bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-all duration-200 cursor-pointer shadow-sm"
                  aria-label="Notifications"
                >
                  <Bell size={14} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-violet-600 text-white rounded-full flex items-center justify-center font-mono font-bold text-[8px] shadow-sm">
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
                      className="absolute right-0 top-full mt-2.5 w-80 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 text-zinc-100 backdrop-blur-lg"
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
                        {isLoading ? (
                          <div className="text-center py-6 text-zinc-500 font-mono text-[10px] animate-pulse">
                            Loading...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="text-center py-6 text-zinc-500 italic text-xs">
                            No notifications.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => !n.is_read && handleMarkRead(n.id)}
                              className={`p-3 rounded-xl border transition-all duration-200 ${n.is_read
                                  ? "bg-zinc-950/40 border-zinc-800/50 opacity-60"
                                  : "bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-650 cursor-pointer"
                                }`}
                            >
                              <p className="text-xs text-zinc-250 font-bold leading-tight font-sans">
                                {n.title}
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-1 font-sans leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-[9px] text-zinc-600 font-mono mt-1.5 block">
                                {formatRelativeTime(n.created_at)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Simple profile indicator */}
              <div className="flex items-center gap-2.5 pl-1.5 border-l border-zinc-800/80 pr-1">
                <div className="w-6.5 h-6.5 rounded-full bg-zinc-900 border border-zinc-850 text-zinc-400 flex items-center justify-center font-bold text-[9px] select-none font-mono">
                  {user?.full_name ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "U"}
                </div>
                <span className="hidden md:inline text-[10px] font-medium text-zinc-400 font-mono max-w-[100px] truncate">
                  {user?.full_name?.split(" ")[0]}
                </span>
              </div>
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