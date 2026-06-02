import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();

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

      {/* Theme Toggle Button */}
      <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80">
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