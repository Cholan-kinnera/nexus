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

  // Dynamic profile details consumed from context
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
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between h-screen sticky top-0 transition-colors duration-300">
      <div>
        <div className="p-6 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-zinc-100 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" fill="#09090b" opacity="0.9" />
            </svg>
          </div>
          <span className="font-bold text-base text-white tracking-tight font-mono">
            NEXUS <span className="text-zinc-500">PM</span>
          </span>
        </div>

        <nav className="px-4 space-y-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors border ${isActive
                ? "bg-zinc-900 border-zinc-800 text-zinc-100 font-semibold"
                : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-150 border-transparent"
              }`
            }
          >
            <LayoutDashboard size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors border ${isActive
                ? "bg-zinc-900 border-zinc-800 text-zinc-100 font-semibold"
                : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-150 border-transparent"
              }`
            }
          >
            <FolderKanban size={18} />
            Projects
          </NavLink>

          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors border ${isActive
                ? "bg-zinc-900 border-zinc-800 text-zinc-100 font-semibold"
                : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-150 border-transparent"
              }`
            }
          >
            <CheckSquare size={18} />
            Tasks
          </NavLink>

          <NavLink
            to="/storage"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors border ${isActive
                ? "bg-zinc-900 border-zinc-800 text-zinc-100 font-semibold"
                : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-150 border-transparent"
              }`
            }
          >
            <Database size={18} />
            Storage
          </NavLink>

          <NavLink
            to="/security"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors border ${isActive
                ? "bg-zinc-900 border-zinc-800 text-zinc-100 font-semibold"
                : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-150 border-transparent"
              }`
            }
          >
            <ShieldAlert size={18} />
            Security Logs
          </NavLink>
        </nav>
      </div>

      {/* Footer Area: Profile + Theme Toggle */}
      <div className="p-4 border-t border-zinc-900 space-y-4">

        {/* User Account / Profile Section */}
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown Menu (Framer Motion) */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 w-full mb-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 text-zinc-300"
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg text-sm hover:bg-zinc-800/40 hover:text-zinc-100 transition-colors"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg text-sm text-red-400 hover:bg-red-950/20 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </motion.div>
          )}

          {/* Profile Trigger Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-900/50 text-left transition-colors duration-200"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-sm select-none">
              {userName ? userName.split(" ").map(n => n[0]).join("").toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200 truncate">
                {userName}
              </p>
              <p className="text-xs text-zinc-550 truncate">
                {userEmail}
              </p>
            </div>
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-lg text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-150 transition-all duration-300"
          aria-label="Toggle Theme"
        >
          <div className="flex items-center gap-3">
            {theme === "light" ? (
              <>
                <Moon size={18} className="text-zinc-400 transition-transform duration-300" />
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