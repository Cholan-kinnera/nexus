import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Database,
  ShieldAlert,
  Sun,
  Moon,
  Settings,
  LogOut,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userName = user?.full_name;
  const userEmail = user?.email;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate("/auth");
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-zinc-850 border-r border-zinc-800 flex flex-col justify-between h-screen sticky top-0 transition-colors duration-300">
      <div>
        <div className="p-6 flex items-center gap-2">
          {/* Logo container with slate gray surface, border, and depth */}
          <div className="w-6 h-6 rounded bg-zinc-800 dark:bg-zinc-100 border border-zinc-700/30 dark:border-zinc-800/20 flex items-center justify-center shadow-inner">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" className="fill-zinc-600 dark:fill-zinc-950" />
            </svg>
          </div>
          <span className="font-bold text-base text-zinc-100 tracking-tight font-mono">
            NEXUS <span className="text-zinc-550 dark:text-zinc-500">PM</span>
          </span>
        </div>

        <nav className="px-4 space-y-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `relative flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 border text-xs ${isActive
                ? "bg-violet-500/10 dark:bg-zinc-900/30 border-violet-500/20 dark:border-zinc-850 text-violet-600 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-800/10 dark:hover:bg-zinc-900/20 hover:text-zinc-950 dark:hover:text-zinc-200 border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-violet-500 rounded-r" />
                )}
                <LayoutDashboard size={16} className={isActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-450 dark:text-zinc-450"} />
                <span>Dashboard</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `relative flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 border text-xs ${isActive
                ? "bg-violet-500/10 dark:bg-zinc-900/30 border-violet-500/20 dark:border-zinc-850 text-violet-600 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-800/10 dark:hover:bg-zinc-900/20 hover:text-zinc-950 dark:hover:text-zinc-200 border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-violet-500 rounded-r" />
                )}
                <FolderKanban size={16} className={isActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-450 dark:text-zinc-450"} />
                <span>Projects</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `relative flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 border text-xs ${isActive
                ? "bg-violet-500/10 dark:bg-zinc-900/30 border-violet-500/20 dark:border-zinc-850 text-violet-600 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-800/10 dark:hover:bg-zinc-900/20 hover:text-zinc-950 dark:hover:text-zinc-200 border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-violet-500 rounded-r" />
                )}
                <CheckSquare size={16} className={isActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-450 dark:text-zinc-450"} />
                <span>Tasks</span>
              </>
            )}
          </NavLink>

          {/* Subtle separator between primary tools and system logs */}
          <div className="h-px bg-zinc-800/60 dark:bg-zinc-800/40 my-3.5 mx-2" />

          <NavLink
            to="/storage"
            className={({ isActive }) =>
              `relative flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 border text-xs ${isActive
                ? "bg-violet-500/10 dark:bg-zinc-900/30 border-violet-500/20 dark:border-zinc-850 text-violet-600 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-800/10 dark:hover:bg-zinc-900/20 hover:text-zinc-950 dark:hover:text-zinc-200 border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-violet-500 rounded-r" />
                )}
                <Database size={16} className={isActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-450 dark:text-zinc-450"} />
                <span>Storage</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/security"
            className={({ isActive }) =>
              `relative flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 border text-xs ${isActive
                ? "bg-violet-500/10 dark:bg-zinc-900/30 border-violet-500/20 dark:border-zinc-850 text-violet-600 dark:text-zinc-100 font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-800/10 dark:hover:bg-zinc-900/20 hover:text-zinc-950 dark:hover:text-zinc-200 border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-violet-500 rounded-r" />
                )}
                <ShieldAlert size={16} className={isActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-450 dark:text-zinc-450"} />
                <span>Security Logs</span>
              </>
            )}
          </NavLink>
        </nav>
      </div>

      {/* Footer Area: Profile + Theme Toggle */}
      <div className="p-4 border-t border-zinc-800 space-y-4">
        {/* User Account / Profile Section */}
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown Menu (Framer Motion) */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 w-full mb-2 bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 text-zinc-300 backdrop-blur-lg"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg text-sm hover:bg-zinc-800/10 dark:hover:bg-zinc-800/40 hover:text-zinc-100 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </motion.div>
          )}

          {/* Profile Trigger Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-800/10 dark:hover:bg-zinc-900/30 hover:border-zinc-800 border border-transparent text-left transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-sm select-none shadow-sm">
              {userName ? userName.split(" ").map((n) => n[0]).join("").toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                {userName}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {userEmail}
              </p>
            </div>
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-800/10 dark:hover:bg-zinc-900/50 hover:text-zinc-100 dark:hover:text-zinc-100 transition-all duration-300 cursor-pointer"
          aria-label="Toggle Theme"
        >
          <div className="flex items-center gap-3">
            {theme === "light" ? (
              <>
                <Moon size={18} className="text-zinc-500 transition-transform duration-300" />
                <span className="text-sm font-medium">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun size={18} className="text-amber-500 transition-transform duration-300" />
                <span className="text-sm font-medium">Light Mode</span>
              </>
            )}
          </div>
        </button>
      </div>
    </aside>
  );
}