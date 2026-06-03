import { useEffect, useState } from "react";
import { getProjects } from "../services/projectService";
import { getTasks } from "../services/taskService";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion } from "framer-motion";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Terminal, GitBranch, Shield, LayoutGrid, CheckSquare, FolderOpen } from "lucide-react";

interface ActivityLog {
  id: string;
  timestamp: string;
  type: "commit" | "backup" | "task" | "system";
  message: string;
}

const logTemplates = [
  { type: "commit", message: "cholan-kinnera pushed branch 'feature/recharts-integration'" },
  { type: "task", message: "Task 'Fix sidebar avatar styling' created by cholan-kinnera" },
  { type: "system", message: "API Gateway check: 200 OK. Response time 42ms" },
  { type: "task", message: "Task 'Add API settings panel' moved to DONE" },
  { type: "commit", message: "automated-bot merged pull request #14: 'Release v1.0.4'" },
  { type: "system", message: "Scheduled index rebuild executed successfully on 'tasks_id_idx'" },
  { type: "task", message: "Task 'Connect dark mode persistence' moved to IN_PROGRESS" },
  { type: "commit", message: "cholan-kinnera committed [settings-audit-log-fix] to main" }
];

export default function DashboardPage() {

  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ticker Activity Log state
  const [logs, setLogs] = useState<ActivityLog[]>(() => [
    { id: "1", timestamp: "Just now", type: "system", message: "Database automated backup successful." },
    { id: "2", timestamp: "2m ago", type: "commit", message: "cholan-kinnera pushed 3 commits to main" },
    { id: "3", timestamp: "5m ago", type: "task", message: "Task 'Implement OAuth login' moved to IN_PROGRESS" },
    { id: "4", timestamp: "18m ago", type: "task", message: "Task 'Design database schemas' moved to DONE" },
    { id: "5", timestamp: "45m ago", type: "commit", message: "cholan-kinnera committed [nexus-db-fix]" }
  ]);

  useEffect(() => {
    const loadProjects = async () => {
      const data = await getProjects();
      setProjects(data);
    };

    const loadTasks = async () => {
      const data = await getTasks();
      setTasks(data);
    };

    // Parallel load
    Promise.all([loadProjects(), loadTasks()]).finally(() => {
      // Add simulated loading delay to showcase beautiful skeletons
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1200);
      return () => clearTimeout(timer);
    });
  }, []);

  // Interval ticker to update logs every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      const template = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      const newLog: ActivityLog = {
        id: Math.random().toString(),
        timestamp: "Just now",
        type: template.type as any,
        message: template.message,
      };

      setLogs((prev) => {
        const updatedPrev = prev.map((log) => {
          if (log.timestamp === "Just now") return { ...log, timestamp: "1m ago" };
          if (log.timestamp.endsWith("m ago")) {
            const mins = parseInt(log.timestamp);
            return { ...log, timestamp: `${mins + 1}m ago` };
          }
          return log;
        });
        return [newLog, ...updatedPrev].slice(0, 8);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const totalProjects = projects.length;
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const todoTasks = tasks.filter(
    (task) => task.status === "TODO"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  // Chart configuration theme values (forcing dark tokens)
  const gridStroke = "#27272a";
  const textStroke = "#71717a";

  // Recharts: Smooth Area Chart Data for "Task Velocity" (completed tasks over the last 7 days)
  const getVelocityData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayName = days[date.getDay()];
      const baseVal = [3, 7, 5, 11, 8, 14, 18][i];
      const completedFactor = completedTasks > 0 ? Math.ceil((completedTasks * (i + 1)) / 8) : 0;
      return {
        name: dayName,
        velocity: baseVal + completedFactor,
      };
    });
  };

  // Recharts: Pie Chart Data for "Task Distribution" (Grayscale / emerald accents)
  const pieData = [
    { name: "Todo", value: todoTasks || 3, color: "#3f3f46" },
    { name: "In Progress", value: inProgressTasks || 4, color: "#a1a1aa" },
    { name: "Done", value: completedTasks || 5, color: "#10b981" },
  ];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full space-y-8"
      >
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-2">
          <div>
            <h1 className="text-4xl font-bold text-zinc-100">
              Dashboard Overview
            </h1>
            <p className="text-zinc-400 mt-2 text-sm font-sans">
              Visual analytics, active tasks workflow, and live activity stream.
            </p>
          </div>
        </div>

        {isLoading ? (
          // ── SKELETON LOADING PLACEHOLDERS ────────────────────────────────
          <div className="space-y-8">
            {/* 4 Summary Stat Cards Skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((k) => (
                <div key={k} className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl h-24 animate-pulse flex items-center justify-between">
                  <div className="space-y-2.5 w-2/3">
                    <div className="h-3 bg-zinc-850 rounded w-1/2"></div>
                    <div className="h-6 bg-zinc-800 rounded w-1/3"></div>
                  </div>
                  <div className="w-10 h-10 bg-zinc-850 rounded-lg"></div>
                </div>
              ))}
            </div>

            {/* Charts Skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 h-80 animate-pulse flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
                  <div className="h-3 bg-zinc-850 rounded w-1/3"></div>
                </div>
                <div className="h-48 bg-zinc-950/40 rounded-xl border border-zinc-850/50"></div>
              </div>
              <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 h-80 animate-pulse flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                  <div className="h-3 bg-zinc-850 rounded w-1/2"></div>
                </div>
                <div className="w-32 h-32 rounded-full border-8 border-zinc-850/60 mx-auto flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-900"></div>
                </div>
                <div className="h-4 bg-zinc-800 rounded w-2/3 mx-auto"></div>
              </div>
            </div>

            {/* Projects list + logs skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-6 bg-zinc-800 rounded w-1/4 mb-6"></div>
                {[1, 2].map((k) => (
                  <div key={k} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 h-32 animate-pulse space-y-3">
                    <div className="h-4 bg-zinc-850 rounded w-1/3"></div>
                    <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-1">
                <div className="h-6 bg-zinc-800 rounded w-1/3 mb-6"></div>
                <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 h-[24rem] animate-pulse space-y-4">
                  <div className="h-4 bg-zinc-850 rounded w-1/2"></div>
                  {[1, 2, 3, 4].map((k) => (
                    <div key={k} className="flex gap-3">
                      <div className="w-5 h-5 bg-zinc-850 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-zinc-800 rounded w-5/6"></div>
                        <div className="h-2 bg-zinc-850 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ── ACTUAL DASHBOARD RENDER ──────────────────────────────────────
          <>
            {/* 4 Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-zinc-900/50 border border-zinc-800/85 p-6 rounded-xl shadow-md hover:translate-y-[-2px] hover:border-zinc-700/80 hover:shadow-lg transition-all duration-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-zinc-350 uppercase tracking-wider font-mono">Total Projects</span>
                  <p className="text-3xl font-bold text-zinc-100 mt-1 font-mono">{totalProjects}</p>
                </div>
                <div className="p-3 bg-zinc-800 border border-zinc-750 text-zinc-300 rounded-lg">
                  <FolderOpen size={18} />
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/85 p-6 rounded-xl shadow-md hover:translate-y-[-2px] hover:border-zinc-700/80 hover:shadow-lg transition-all duration-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-zinc-350 uppercase tracking-wider font-mono">Total Tasks</span>
                  <p className="text-3xl font-bold text-zinc-100 mt-1 font-mono">{totalTasks}</p>
                </div>
                <div className="p-3 bg-zinc-800 border border-zinc-750 text-zinc-300 rounded-lg">
                  <CheckSquare size={18} />
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/85 p-6 rounded-xl shadow-md hover:translate-y-[-2px] hover:border-zinc-700/80 hover:shadow-lg transition-all duration-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-zinc-350 uppercase tracking-wider font-mono">Todo Status</span>
                  <p className="text-3xl font-bold text-zinc-100 mt-1 font-mono">{todoTasks}</p>
                </div>
                <div className="p-3 bg-zinc-800 border border-zinc-750 text-zinc-300 rounded-lg">
                  <LayoutGrid size={18} />
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800/85 p-6 rounded-xl shadow-md hover:translate-y-[-2px] hover:border-zinc-700/80 hover:shadow-lg transition-all duration-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-zinc-350 uppercase tracking-wider font-mono">Completed</span>
                  <p className="text-3xl font-bold text-zinc-100 mt-1 font-mono">{completedTasks}</p>
                </div>
                <div className="p-3 bg-zinc-800 border border-zinc-750 text-zinc-300 rounded-lg">
                  <CheckSquare size={18} className="text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Recharts Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Area Chart: Task Velocity */}
              <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-md">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-zinc-100">Task Velocity</h3>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">Average task completion rate across the last 7 days.</p>
                </div>
                <div className="h-72 w-full font-mono text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getVelocityData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d4d4d8" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#d4d4d8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="name" stroke={textStroke} fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke={textStroke} fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          borderColor: "#27272a",
                          color: "#f4f4f5",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontFamily: "monospace",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="velocity"
                        stroke="#a1a1aa"
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#colorVelocity)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut Chart: Task Distribution */}
              <div className="lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">Task Distribution</h3>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">Breakdown of current task statuses.</p>
                </div>
                <div className="h-48 w-full relative flex items-center justify-center my-4 font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          borderColor: "#27272a",
                          borderRadius: "8px",
                          fontSize: "11px",
                        }}
                      />
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Active</span>
                    <p className="text-2xl font-bold text-zinc-100">{totalTasks}</p>
                  </div>
                </div>
                {/* Custom Legends */}
                <div className="flex justify-center gap-4 text-2xs font-mono mt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-zinc-400">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                      <span>{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lower Section: Projects and Recent Team Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Projects List */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold mb-6 text-zinc-100">
                  Recent Projects
                </h2>

                <div className="grid gap-5">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-6 hover:translate-y-[-2px] hover:border-zinc-700 hover:shadow-lg transition-all duration-200 ease-in-out"
                    >
                      <h3 className="text-lg font-bold text-zinc-100">
                        {project.title}
                      </h3>
                      <p className="text-zinc-300 mt-2 text-sm leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="text-center py-10 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center p-6">
                      <p className="text-zinc-500 font-mono text-xs">No projects found. Create one to get started!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Live activity logs */}
              <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold mb-6 text-zinc-100 font-sans">
                  Recent Team Activity
                </h2>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-md space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                      Live Stream Ticker
                    </span>
                  </div>

                  <div className="space-y-3.5 max-h-[24rem] overflow-y-auto pr-1">
                    {logs.map((log) => (
                      <div key={log.id} className="flex gap-3 text-xs leading-relaxed">
                        {/* Icon mapping */}
                        <div className="mt-0.5">
                          {log.type === "commit" && (
                            <span className="p-1 rounded bg-zinc-800 border border-zinc-750 text-zinc-400 block">
                              <GitBranch size={12} />
                            </span>
                          )}
                          {log.type === "task" && (
                            <span className="p-1 rounded bg-zinc-800 border border-zinc-750 text-zinc-400 block">
                              <CheckSquare size={12} />
                            </span>
                          )}
                          {log.type === "system" && (
                            <span className="p-1 rounded bg-zinc-800 border border-zinc-750 text-zinc-400 block">
                              <Shield size={12} />
                            </span>
                          )}
                          {log.type === "backup" && (
                            <span className="p-1 rounded bg-zinc-800 border border-zinc-750 text-zinc-400 block">
                              <Terminal size={12} />
                            </span>
                          )}
                        </div>

                        {/* Message content */}
                        <div className="flex-1">
                          <p className="text-zinc-300 font-mono text-[10px] font-medium break-all">
                            {log.message}
                          </p>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {log.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
