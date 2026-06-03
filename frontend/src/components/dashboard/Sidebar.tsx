import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
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
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamic profile state synced with settings
  const [userName, setUserName] = useState(() => localStorage.getItem("userName") || "Cholan Kinnera");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail") || "cholan@example.com");

  useEffect(() => {
    const handleStorageChange = () => {
      setUserName(localStorage.getItem("userName") || "Cholan Kinnera");
      setUserEmail(localStorage.getItem("userEmail") || "cholan@example.com");
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col justify-between h-screen sticky top-0 transition-colors duration-300">
      <div>
        <div className="p-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
            Nexus PM
          </h1>
        </div>

        <nav className="px-4 space-y-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-100"
              }`
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-100"
              }`
            }
          >
            <FolderKanban size={18} />
            Projects
          </NavLink>

          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 font-semibold"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-100"
              }`
            }
          >
            <CheckSquare size={18} />
            Tasks
          </NavLink>
        </nav>
      </div>

      {/* Footer Area: Profile + Theme Toggle */}
      <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 space-y-4">
        
        {/* User Account / Profile Section */}
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown Menu (Framer Motion) */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg p-2 z-50 text-slate-700 dark:text-zinc-200"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings"); // Mock Settings route
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-zinc-700/50 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </motion.div>
          )}

          {/* Profile Trigger Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 text-left transition-colors duration-200"
          >
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-sm select-none">
              {userName.split(" ").map(n => n[0]).join("").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">
                {userName}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                {userEmail}
              </p>
            </div>
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-100 transition-all duration-300"
          aria-label="Toggle Theme"
        >
          <div className="flex items-center gap-3">
            {theme === "light" ? (
              <>
                <Moon size={18} className="text-violet-600 transition-transform duration-300 rotate-0" />
                <span className="text-sm font-medium">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun size={18} className="text-amber-500 transition-transform duration-300 rotate-0" />
                <span className="text-sm font-medium">Light Mode</span>
              </>
            )}
          </div>
        </button>
      </div>
    </aside>
  );
}