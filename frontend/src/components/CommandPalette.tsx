import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { getProjects } from "../services/projectService";
import { getTasks } from "../services/taskService";
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Moon,
  Sun,
  PlusCircle,
  Settings,
  Database,
  ShieldAlert,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  action: () => void;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dynamicCommands, setDynamicCommands] = useState<CommandItem[]>([]);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const staticCommands: CommandItem[] = [
    {
      id: "nav-dash",
      title: "Navigate to Dashboard",
      category: "Navigation",
      shortcut: "G + D",
      icon: LayoutDashboard,
      action: () => navigate("/dashboard"),
    },
    {
      id: "nav-proj",
      title: "Navigate to Projects",
      category: "Navigation",
      shortcut: "G + P",
      icon: FolderKanban,
      action: () => navigate("/projects"),
    },
    {
      id: "nav-tasks",
      title: "Navigate to Tasks",
      category: "Navigation",
      shortcut: "G + T",
      icon: CheckSquare,
      action: () => navigate("/tasks"),
    },
    {
      id: "nav-storage",
      title: "Navigate to Storage Vault",
      category: "Navigation",
      shortcut: "G + R",
      icon: Database,
      action: () => navigate("/storage"),
    },
    {
      id: "nav-security",
      title: "Navigate to Security Logs",
      category: "Navigation",
      shortcut: "G + L",
      icon: ShieldAlert,
      action: () => navigate("/security"),
    },
    {
      id: "nav-settings",
      title: "Navigate to Settings",
      category: "Navigation",
      shortcut: "G + S",
      icon: Settings,
      action: () => navigate("/settings"),
    },
    {
      id: "toggle-dark",
      title: theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode",
      category: "System",
      shortcut: "T + M",
      icon: theme === "light" ? Moon : Sun,
      action: () => toggleTheme(),
    },
    {
      id: "create-task",
      title: "Create New Task",
      category: "Actions",
      shortcut: "C + T",
      icon: PlusCircle,
      action: () => {
        navigate("/tasks");
      },
    },
    {
      id: "create-project",
      title: "Create New Project",
      category: "Actions",
      shortcut: "C + P",
      icon: PlusCircle,
      action: () => {
        navigate("/projects");
      },
    },
  ];

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset index and focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Dynamically load active projects and tasks for search
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [projectsData, tasksData] = await Promise.all([
          getProjects(),
          getTasks()
        ]);

        const projectCommands: CommandItem[] = projectsData.map((proj: any) => ({
          id: `proj-${proj.id}`,
          title: `Go to Project: ${proj.title}`,
          category: "Projects",
          icon: FolderKanban,
          action: () => {
            navigate("/projects");
          }
        }));

        const taskCommands: CommandItem[] = tasksData.map((task: any) => ({
          id: `task-${task.id}`,
          title: `Go to Task: ${task.title}`,
          category: "Tasks",
          icon: CheckSquare,
          action: () => {
            navigate("/tasks");
          }
        }));

        setDynamicCommands([...projectCommands, ...taskCommands]);
      } catch (e) {
        console.error("Failed to load command palette index", e);
      }
    };

    loadData();
  }, [isOpen, navigate]);

  const allCommands = [...staticCommands, ...dynamicCommands];

  const filteredCommands = allCommands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard navigation inside list
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length === 0 ? 0 : (prev + 1) % filteredCommands.length
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length === 0
            ? 0
            : (prev - 1 + filteredCommands.length) % filteredCommands.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          setIsOpen(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleNavigation);
    return () => window.removeEventListener("keydown", handleNavigation);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Keep selected item in view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-zinc-950/65 backdrop-blur-md"
          />

          {/* Center Card */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-[600px] bg-zinc-900/90 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col backdrop-blur-md"
          >
            {/* Search Input field */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-850 bg-zinc-950/30">
              <Search size={16} className="text-zinc-550" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command or search workspace..."
                className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-600 outline-none border-none focus:ring-0"
              />
              <div className="flex items-center gap-1 font-mono text-[9px] text-zinc-500">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-850 border border-zinc-800 text-zinc-400 select-none shadow-sm">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Commands List */}
            <div
              ref={listRef}
              className="max-h-[280px] overflow-y-auto p-2 space-y-0.5"
            >
              {filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-150 ${isSelected
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:bg-zinc-850/40 hover:text-zinc-200"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={14} className={isSelected ? "text-zinc-100" : "text-zinc-500"} />
                      <div>
                        <span className={`text-xs font-semibold ${isSelected ? "text-white" : "text-zinc-300"}`}>
                          {cmd.title}
                        </span>
                        <span className={`text-[10px] block font-mono ${isSelected ? "text-zinc-400" : "text-zinc-650"}`}>
                          {cmd.category}
                        </span>
                      </div>
                    </div>

                    {cmd.shortcut && (
                      <kbd
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold select-none border transition-colors ${isSelected
                            ? "bg-zinc-700 border-zinc-600 text-zinc-200"
                            : "bg-zinc-950 border-zinc-850 text-zinc-500"
                          }`}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}

              {filteredCommands.length === 0 && (
                <div className="text-center py-8 text-zinc-650 font-mono text-xs">
                  No matches.
                </div>
              )}
            </div>

            {/* Footer instructions */}
            <div className="px-4 py-2 bg-zinc-950/50 border-t border-zinc-850 flex justify-between items-center text-[10px] text-zinc-600 font-mono select-none">
              <span className="flex items-center gap-1.5">
                <span>↑↓</span> navigate
                <span className="ml-2">↵</span> select
              </span>
              <span>Nexus Commands</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
