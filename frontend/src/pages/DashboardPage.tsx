import { useEffect, useState } from "react";
import { getProjects } from "../services/projectService";
import { getTasks } from "../services/taskService";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
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
  const { theme } = useTheme();
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

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

    loadProjects();
    loadTasks();
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

  // Chart configuration theme values
  const isDark = theme === "dark";
  const gridStroke = isDark ? "#27272a" : "#f1f5f9";
  const textStroke = isDark ? "#71717a" : "#94a3b8";

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

  // Recharts: Pie Chart Data for "Task Distribution" (TODO, IN_PROGRESS, DONE)
  const pieData = [
    { name: "Todo", value: todoTasks || 3, color: "#64748b" },
    { name: "In Progress", value: inProgressTasks || 4, color: "#8b5cf6" },
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
            <h1 className="text-4xl font-bold text-slate-900 dark:text-zinc-100">
              Dashboard Overview
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-2">
              Visual analytics, active tasks workflow, and live activity stream.
            </p>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Projects</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1">{totalProjects}</p>
            </div>
            <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-xl">
              <FolderOpen size={20} />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Tasks</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1">{totalTasks}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <CheckSquare size={20} />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Todo Status</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1">{todoTasks}</p>
            </div>
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-xl">
              <LayoutGrid size={20} />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Completed</span>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1">{completedTasks}</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckSquare size={20} />
            </div>
          </div>
        </div>

        {/* Interactive Recharts Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Area Chart: Task Velocity (2/3 width) */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Task Velocity</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Average task completion rate across the last 7 days.</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getVelocityData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" stroke={textStroke} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={textStroke} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#09090b" : "#ffffff",
                      borderColor: isDark ? "#27272a" : "#e2e8f0",
                      color: isDark ? "#f4f4f5" : "#0f172a",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="velocity"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVelocity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart: Task Distribution (1/3 width) */}
          <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Task Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Breakdown of current task statuses.</p>
            </div>
            <div className="h-48 w-full relative flex items-center justify-center my-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#09090b" : "#ffffff",
                      borderColor: isDark ? "#27272a" : "#e2e8f0",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-2xs text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-semibold">Active</span>
                <p className="text-2xl font-black text-slate-800 dark:text-zinc-100">{totalTasks}</p>
              </div>
            </div>
            {/* Custom Legends */}
            <div className="flex justify-center gap-4 text-xs font-semibold mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lower Section: Projects (2/3 width) and Recent Team Activity (1/3 width) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Projects List */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-zinc-100">
              Recent Projects
            </h2>

            <div className="grid gap-5">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-violet-500 dark:hover:border-violet-400 shadow-sm hover:shadow-md dark:hover:shadow-zinc-950/50 hover:-translate-y-0.5 transition-all duration-300 ease-in-out"
                >
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                    {project.title}
                  </h3>

                  <p className="text-slate-600 dark:text-zinc-400 mt-2">
                    {project.description}
                  </p>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-10 bg-slate-50 dark:bg-zinc-900/50 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                  <p className="text-slate-500 dark:text-zinc-400">No projects found. Create one to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live activity logs */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-zinc-100">
              Recent Team Activity
            </h2>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Live Stream Ticker
                </span>
              </div>

              <div className="space-y-3.5 max-h-[24rem] overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-xs leading-relaxed">
                    {/* Icon mapping */}
                    <div className="mt-0.5">
                      {log.type === "commit" && (
                        <span className="p-1 rounded bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 block">
                          <GitBranch size={12} />
                        </span>
                      )}
                      {log.type === "task" && (
                        <span className="p-1 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 block">
                          <CheckSquare size={12} />
                        </span>
                      )}
                      {log.type === "system" && (
                        <span className="p-1 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 block">
                          <Shield size={12} />
                        </span>
                      )}
                      {log.type === "backup" && (
                        <span className="p-1 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 block">
                          <Terminal size={12} />
                        </span>
                      )}
                    </div>

                    {/* Message content */}
                    <div className="flex-1">
                      <p className="text-slate-700 dark:text-zinc-300 font-mono text-3xs font-medium">
                        {log.message}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
