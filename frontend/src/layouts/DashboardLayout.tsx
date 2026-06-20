import { useState, useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import LoadingSplash from "../components/LoadingSplash";
import CommandPalette from "../components/CommandPalette";
import { Bell, CheckCheck, Search, User as UserIcon, Settings as SettingsIcon, LogOut as LogOutIcon } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { NotificationsSkeleton } from "../components/ui/SkeletonLoader";
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
  const { hasBooted, setHasBooted, user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [isBooting, setIsBooting] = useState(!hasBooted);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const loadNotificationsData = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const [notifsData, countData] = await Promise.all([
        getNotifications(10, 0),
        getUnreadCount(),
      ]);
      setNotifications(notifsData ?? []);
      setUnreadCount(countData.unread_count);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

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
      // Load notifications synchronously on token load
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadNotificationsData();
    }
  }, [token, loadNotificationsData]);

  // Load on open dropdown transition
  useEffect(() => {
    if (notifsOpen && token) {
      // Refresh notifications synchronously when opening the dropdown
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadNotificationsData();
    }
  }, [notifsOpen, token, loadNotificationsData]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (hasBooted) {
      // Sync booting status state synchronously once booted
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Workspace Bar */}
          <header className="sticky top-0 h-[84px] flex items-center justify-between border-b border-zinc-800/60 backdrop-blur-md bg-zinc-900/50 px-8 z-40">
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
            <div className="flex items-center gap-4.5">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setNotifsOpen(!notifsOpen)}
                  className="relative w-10 h-10 bg-zinc-900/50 dark:bg-zinc-950/40 hover:bg-zinc-900/80 dark:hover:bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-violet-600 text-white rounded-full flex items-center justify-center font-mono font-bold text-[9px] shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Framer Motion Notification Dropdown */}
                <AnimatePresence>
                  {notifsOpen && (
                    <motion.div
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                      transition={shouldReduceMotion ? { duration: 0.1 } : { type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute right-0 top-full mt-2.5 w-80 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 text-zinc-100 backdrop-blur-lg"
                    >
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-850">
                        <span className="text-sm font-bold text-zinc-100">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-zinc-300 hover:text-zinc-100 font-semibold text-2xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <CheckCheck size={12} />
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {isLoading ? (
                          <NotificationsSkeleton />
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

              {/* Polished profile indicator with dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3.5 pl-4 border-l border-zinc-800/80 pr-1 cursor-pointer select-none group"
                  aria-label="Profile menu"
                >
                  <div className="relative w-10 h-10 rounded-full bg-zinc-900 border border-zinc-850 text-zinc-400 flex items-center justify-center font-bold text-sm font-mono overflow-hidden flex-shrink-0 transition-all group-hover:ring-2 group-hover:ring-violet-500/30 group-hover:border-zinc-700">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.full_name ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "U"
                    )}
                    {/* Active user status indicator */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-zinc-900 rounded-full" />
                  </div>
                  <span className="hidden md:inline text-base font-medium text-zinc-300 group-hover:text-zinc-150 max-w-[120px] truncate transition-colors">
                    {user?.full_name?.split(" ")[0]}
                  </span>
                </button>

                {/* Profile Dropdown Menu */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                      transition={shouldReduceMotion ? { duration: 0.1 } : { type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute right-0 top-full mt-2.5 w-56 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 text-zinc-300 backdrop-blur-lg"
                    >
                      {/* User metadata heading */}
                      <div className="px-3 py-2.5 border-b border-zinc-850">
                        <p className="text-xs font-bold text-zinc-100 truncate">{user?.full_name}</p>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-mono">{user?.email}</p>
                      </div>

                      {/* Dropdown options */}
                      <div className="mt-1 space-y-0.5">
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/profile");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-850 hover:text-zinc-150 transition-colors cursor-pointer text-left"
                        >
                          <UserIcon size={13} className="text-zinc-500" />
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            navigate("/settings");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-850 hover:text-zinc-150 transition-colors cursor-pointer text-left"
                        >
                          <SettingsIcon size={13} className="text-zinc-500" />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                            navigate("/auth");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer text-left mt-1"
                        >
                          <LogOutIcon size={13} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>

          {/* Content Box */}
          <main className="flex-1 min-w-0 p-8 flex flex-col relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col min-w-0"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}