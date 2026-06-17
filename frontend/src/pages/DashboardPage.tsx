import { useEffect, useState, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { getProjects } from "../services/projectService";
import { getTasks } from "../services/taskService";
import { getProjectMembers } from "../services/projectMemberService";
import api from "../api/client";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion, animate } from "framer-motion";
import {
  Shield,
  LayoutGrid,
  CheckSquare,
  FolderOpen,
  Users,
  MessageSquare
} from "lucide-react";

const parseDescription = (rawDesc: string | undefined) => {
  if (!rawDesc) {
    return {
      description: "",
      category: "",
      priority: "",
      deadline: "",
    };
  }
  try {
    const data = JSON.parse(rawDesc);
    return {
      description: data.desc || "",
      category: data.category || "",
      priority: data.priority || "",
      deadline: data.deadline || "",
    };
  } catch (e) {
    return {
      description: rawDesc,
      category: "",
      priority: "",
      deadline: "",
    };
  }
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 10) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatActivityMessage = (log: any, userMap: Record<number, string>) => {
  const actor = log.user_id ? (userMap[log.user_id] || `User #${log.user_id}`) : "System";
  const meta = log.log_metadata || {};

  const capitalizeRole = (roleStr?: string) => {
    if (!roleStr) return "Member";
    return roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase();
  };

  switch (log.action) {
    case "PROJECT_CREATED":
      return `${actor} created project '${meta.project_name || "Unknown Project"}'`;
    case "PROJECT_UPDATED":
      return `${actor} updated project '${meta.project_name || "Unknown Project"}'`;
    case "PROJECT_DELETED":
      return `${actor} deleted project '${meta.project_name || "Unknown Project"}'`;
    case "MEMBER_ADDED":
      const addedMemberName = meta.user_name || (meta.user_id && userMap[meta.user_id]) || `User #${meta.user_id}`;
      return `${actor} invited ${addedMemberName} to project '${meta.project_name || "Unknown Project"}' as ${capitalizeRole(meta.role)}`;
    case "MEMBER_REMOVED":
      const removedMemberName = (meta.user_id && userMap[meta.user_id]) || `User #${meta.user_id}`;
      return `${actor} removed member ${removedMemberName} from project '${meta.project_name || "Unknown Project"}'`;
    case "MEMBER_ROLE_UPDATED":
      const targetMemberName = (meta.user_id && userMap[meta.user_id]) || `User #${meta.user_id}`;
      return `${actor} updated role of ${targetMemberName} to ${capitalizeRole(meta.new_role)}`;
    case "TASK_CREATED":
      return `${actor} created task '${meta.task_title || "Unknown Task"}'`;
    case "TASK_MOVED":
      return `${actor} moved task '${meta.task_title || "Unknown Task"}' from ${meta.old_status || "TODO"} to ${meta.new_status || "DONE"}`;
    case "TASK_UPDATED":
      return `${actor} updated task '${meta.task_title || "Unknown Task"}'`;
    case "TASK_ASSIGNED":
      const assigneeName = (meta.assigned_to && userMap[meta.assigned_to]) || `User #${meta.assigned_to}`;
      return `${actor} assigned task '${meta.task_title || "Unknown Task"}' to ${assigneeName}`;
    case "COMMENT_ADDED":
      return `${actor} added a comment to task`;
    case "LOGIN_SUCCESS":
      return `${actor} logged in successfully`;
    default:
      return `${actor} performed ${log.action} on ${log.entity_type}`;
  }
};

const getActivityIcon = (action: string) => {
  if (action.startsWith("PROJECT_")) return "project";
  if (action.startsWith("MEMBER_")) return "member";
  if (action.startsWith("TASK_")) return "task";
  if (action.startsWith("COMMENT_")) return "comment";
  return "system";
};

function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (node) {
      const controls = animate(0, value, {
        duration: 0.8,
        ease: "easeOut",
        onUpdate(latest) {
          node.textContent = Math.round(latest).toString();
        },
      });
      return () => controls.stop();
    }
  }, [value]);

  return <span ref={ref}>{value}</span>;
}

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
interface ChartWrapperProps {
  children: (width: number, height: number) => React.ReactNode;
}

function ChartWrapper({ children }: ChartWrapperProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });

    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={wrapperRef} className="w-full h-full relative min-h-0 min-w-0">
      {dimensions ? children(dimensions.width, dimensions.height) : (
        <div className="w-full h-full bg-zinc-950/10 rounded-lg animate-pulse" />
      )}
    </div>
  );
}


export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projData, taskData, analyticsData, logsData] = await Promise.all([
          getProjects(),
          getTasks(),
          api.get("/analytics/dashboard").then((res) => res.data),
          api.get("/activity-logs?limit=50").then((res) => res.data)
        ]);

        const projectsList = projData?.items ?? [];
        const tasksList = taskData?.items ?? [];
        const logsList = logsData?.items ?? [];

        setProjects(projectsList);
        setTasks(tasksList);
        setMetrics(analyticsData);
        setActivityLogs(logsList);

        // Build a user map dynamically from accessible project members
        const tempUserMap: Record<number, string> = {};

        // Add current user details to map
        try {
          const meRes = await api.get("/users/me");
          if (meRes.data?.id) {
            tempUserMap[meRes.data.id] = meRes.data.full_name || meRes.data.email || "You";
          }
        } catch (meErr) {
          console.error("Failed to get current user details:", meErr);
        }

        // Fetch members of all accessible projects in parallel
        try {
          const membersPromises = projectsList.map((p: any) => getProjectMembers(p.id).catch(() => []));
          const membersResults = await Promise.all(membersPromises);
          membersResults.forEach((membersList) => {
            membersList.forEach((m: any) => {
              if (m.user_id && m.full_name) {
                tempUserMap[m.user_id] = m.full_name;
              }
            });
          });
        } catch (membersErr) {
          console.error("Failed to build user map from project members:", membersErr);
        }

        setUserMap(tempUserMap);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        const timer = setTimeout(() => {
          setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    };

    loadData();
  }, []);

  const totalProjects = metrics ? metrics.total_projects : projects.length;
  const totalTasks = metrics ? metrics.total_tasks : tasks.length;

  const completedTasks = metrics ? metrics.completed_tasks : tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const todoTasks = metrics ? metrics.todo_tasks : tasks.filter(
    (task) => task.status === "TODO"
  ).length;

  const inProgressTasks = metrics ? metrics.in_progress_tasks : tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  // Chart configuration theme values based on active theme
  const gridStroke = isDark ? "#27272a" : "#E5E7EB";
  const tickFill = isDark ? "#a1a1aa" : "#6B7280";
  const axisStroke = isDark ? "#3f3f46" : "#D1D5DB";
  const tooltipBg = isDark ? "rgba(24, 24, 27, 0.9)" : "rgba(255, 255, 255, 0.95)";
  const tooltipBorder = isDark ? "#27272a" : "#E5E7EB";
  const tooltipColor = isDark ? "#f4f4f5" : "#111827";

  // Recharts: Smooth Area Chart Data for "Task Velocity" (completed tasks over the last 7 days)
  const getVelocityData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toDateString();
      const dayName = days[date.getDay()];

      // Count tasks completed on this calendar day from real activity logs
      const count = activityLogs.filter((log) => {
        if (log.action !== "TASK_MOVED") return false;
        if (log.log_metadata?.new_status !== "DONE") return false;
        const logDate = new Date(log.created_at);
        return logDate.toDateString() === dateStr;
      }).length;

      return {
        name: dayName,
        velocity: count,
      };
    });
  };

  // Recharts: Pie Chart Data for "Task Distribution" (Enterprise unified palette)
  const pieData = [
    { name: "Todo", value: todoTasks || 0, color: "#27272a" },
    { name: "In Progress", value: inProgressTasks || 0, color: "#71717a" },
    { name: "Done", value: completedTasks || 0, color: "#8b5cf6" },
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
        <div className="relative flex flex-col md:flex-row md:items-center justify-between pb-2">
          {/* Subtle ambient violet lighting behind header */}
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="z-10 w-full max-w-5xl flex flex-col items-start justify-start">
            <h1 className="text-4xl font-bold text-zinc-100">
              Dashboard Overview
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
              Visual analytics, active tasks workflow, and live activity stream.
            </p>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1: Total Projects */}
          <div className={`border rounded-xl p-6 shadow-md transition-all duration-200 hover:translate-y-[-2px] flex flex-col justify-between h-36 ${isLoading
              ? "bg-zinc-900/30 border-zinc-800/80 animate-pulse"
              : "bg-zinc-900/50 backdrop-blur-sm border-zinc-800 hover:border-zinc-700/80 hover:shadow-[0_0_15px_rgba(124,58,237,0.04)]"
            }`}>
            {isLoading ? (
              <div className="flex flex-col justify-between h-full w-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-2.5 w-2/3">
                    <div className="h-3 bg-zinc-850 rounded w-1/2"></div>
                    <div className="h-6 bg-zinc-800 rounded w-1/3"></div>
                  </div>
                  <div className="w-10 h-10 bg-zinc-850 rounded-lg"></div>
                </div>
                <div className="h-3 bg-zinc-850 rounded w-1/2 mt-4"></div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">Total Projects</span>
                    <p className="text-3xl font-bold text-zinc-100 mt-1 font-mono">
                      <AnimatedCounter value={totalProjects} />
                    </p>
                  </div>
                  <div className="p-2 bg-zinc-850 border border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg shadow-sm">
                    <FolderOpen size={16} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono mt-4 pt-2 border-t border-zinc-850/50">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+1 active this week</span>
                  <span className="text-zinc-500">Updated 10m ago</span>
                </div>
              </>
            )}
          </div>

          {/* Stat 2: Total Tasks */}
          <div className={`border rounded-xl p-6 shadow-md transition-all duration-200 hover:translate-y-[-2px] flex flex-col justify-between h-36 ${isLoading
              ? "bg-zinc-900/30 border-zinc-800/80 animate-pulse"
              : "bg-zinc-900/50 backdrop-blur-sm border-zinc-800 hover:border-zinc-700/80 hover:shadow-[0_0_15px_rgba(124,58,237,0.04)]"
            }`}>
            {isLoading ? (
              <div className="flex flex-col justify-between h-full w-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-2.5 w-2/3">
                    <div className="h-3 bg-zinc-850 rounded w-1/2"></div>
                    <div className="h-6 bg-zinc-800 rounded w-1/3"></div>
                  </div>
                  <div className="w-10 h-10 bg-zinc-850 rounded-lg"></div>
                </div>
                <div className="h-3 bg-zinc-850 rounded w-1/2 mt-4"></div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">Total Tasks</span>
                    <p className="text-3xl font-bold text-zinc-100 mt-1 font-mono">
                      <AnimatedCounter value={totalTasks} />
                    </p>
                  </div>
                  <div className="p-2 bg-zinc-850 border border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg shadow-sm">
                    <CheckSquare size={16} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono mt-4 pt-2 border-t border-zinc-850/50">
                  <span className="text-violet-600 dark:text-violet-400 font-semibold">+7 active tasks</span>
                  <span className="text-zinc-500">Updated 2m ago</span>
                </div>
              </>
            )}
          </div>

          {/* Stat 3: Todo Status */}
          <div className={`border rounded-xl p-6 shadow-md transition-all duration-200 hover:translate-y-[-2px] flex flex-col justify-between h-36 ${isLoading
              ? "bg-zinc-900/30 border-zinc-800/80 animate-pulse"
              : "bg-zinc-900/50 backdrop-blur-sm border-zinc-800 hover:border-zinc-700/80 hover:shadow-[0_0_15px_rgba(124,58,237,0.04)]"
            }`}>
            {isLoading ? (
              <div className="flex flex-col justify-between h-full w-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-2.5 w-2/3">
                    <div className="h-3 bg-zinc-850 rounded w-1/2"></div>
                    <div className="h-6 bg-zinc-800 rounded w-1/3"></div>
                  </div>
                  <div className="w-10 h-10 bg-zinc-850 rounded-lg"></div>
                </div>
                <div className="h-3 bg-zinc-850 rounded w-1/2 mt-4"></div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">Todo Status</span>
                    <p className="text-3xl font-bold text-zinc-100 mt-1 font-mono">
                      <AnimatedCounter value={todoTasks} />
                    </p>
                  </div>
                  <div className="p-2 bg-zinc-850 border border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg shadow-sm">
                    <LayoutGrid size={16} />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono mt-4 pt-2 border-t border-zinc-850/50">
                  <span className="text-zinc-500 dark:text-zinc-400 font-semibold">-2 items resolved</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Sync active</span>
                </div>
              </>
            )}
          </div>

          {/* Stat 4: Completed Tasks */}
          <div className={`border rounded-xl p-6 shadow-md transition-all duration-200 hover:translate-y-[-2px] flex flex-col justify-between h-36 ${isLoading
              ? "bg-zinc-900/30 border-zinc-800/80 animate-pulse"
              : "bg-zinc-900/50 backdrop-blur-sm border-zinc-800 hover:border-zinc-700/80 hover:shadow-[0_0_15px_rgba(124,58,237,0.04)]"
            }`}>
            {isLoading ? (
              <div className="flex flex-col justify-between h-full w-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-2.5 w-2/3">
                    <div className="h-3 bg-zinc-850 rounded w-1/2"></div>
                    <div className="h-6 bg-zinc-800 rounded w-1/3"></div>
                  </div>
                  <div className="w-10 h-10 bg-zinc-850 rounded-lg"></div>
                </div>
                <div className="h-3 bg-zinc-850 rounded w-1/2 mt-4"></div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">Completed Tasks</span>
                    <p className="text-3xl font-bold text-zinc-100 mt-1 font-mono">
                      <AnimatedCounter value={completedTasks} />
                    </p>
                  </div>
                  <div className="p-2 bg-zinc-850 border border-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg shadow-sm">
                    <CheckSquare size={16} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono mt-4 pt-2 border-t border-zinc-850/50">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+12% this week</span>
                  <span className="text-zinc-500">Velocity optimal</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recharts Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Area Chart: Task Velocity */}
          <div className={`lg:col-span-2 border rounded-xl p-6 shadow-md transition-all duration-300 flex flex-col justify-between h-[23.5rem] ${isLoading
              ? "bg-zinc-900/30 border-zinc-800/80 animate-pulse"
              : "bg-zinc-900/20 backdrop-blur-md border-zinc-800/60 hover:border-zinc-700/60 hover:shadow-[0_0_20px_rgba(139,92,246,0.04),0_10px_30px_rgba(0,0,0,0.5)]"
            }`}>
            {isLoading ? (
              <div className="flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
                  <div className="h-3 bg-zinc-850 rounded w-1/3"></div>
                </div>
                <div className="h-56 bg-zinc-950/40 rounded-xl border border-zinc-850/50"></div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-zinc-100">Task Velocity</h3>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">Average task completion rate across the last 7 days.</p>
                </div>
                <div className="h-72 w-full font-mono text-[10px]">
                  <ChartWrapper>
                    {(width, height) => (
                      <AreaChart width={width} height={height} data={getVelocityData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                        <XAxis dataKey="name" stroke={axisStroke} tick={{ fill: tickFill }} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={axisStroke} tick={{ fill: tickFill }} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: tooltipBg,
                            borderColor: tooltipBorder,
                            color: tooltipColor,
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontFamily: "monospace",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="velocity"
                          stroke="#8b5cf6"
                          strokeWidth={1.5}
                          fillOpacity={1}
                          fill="url(#colorVelocity)"
                        />
                      </AreaChart>
                    )}
                  </ChartWrapper>
                </div>
              </>
            )}
          </div>

          {/* Donut Chart: Task Distribution */}
          <div className={`lg:col-span-1 border rounded-xl p-6 shadow-md flex flex-col justify-between transition-all duration-300 h-[23.5rem] ${isLoading
              ? "bg-zinc-900/30 border-zinc-800/80 animate-pulse"
              : "bg-zinc-900/20 backdrop-blur-md border-zinc-800/60 hover:border-zinc-700/60 hover:shadow-[0_0_20px_rgba(139,92,246,0.04),0_10px_30px_rgba(0,0,0,0.5)]"
            }`}>
            {isLoading ? (
              <div className="flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                  <div className="h-3 bg-zinc-850 rounded w-1/2"></div>
                </div>
                <div className="w-32 h-32 rounded-full border-8 border-zinc-850/60 mx-auto flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-900"></div>
                </div>
                <div className="h-4 bg-zinc-800 rounded w-2/3 mx-auto"></div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">Task Distribution</h3>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">Breakdown of current task statuses.</p>
                </div>
                <div className="h-48 w-full relative flex items-center justify-center my-4 font-mono">
                  <ChartWrapper>
                    {(width, height) => (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <PieChart width={width} height={height}>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: tooltipBg,
                              borderColor: tooltipBorder,
                              color: tooltipColor,
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
                        <div className="absolute text-center">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Active</span>
                          <p className="text-2xl font-bold text-zinc-100">{totalTasks}</p>
                        </div>
                      </div>
                    )}
                  </ChartWrapper>
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
              </>
            )}
          </div>
        </div>

        {/* Lower Section: Projects and Recent Team Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Recent Projects */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-zinc-100 flex items-center gap-2">
              Recent Projects
            </h2>

            <div className="grid gap-5">
              {isLoading ? (
                [1, 2].map((k) => (
                  <div key={k} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 h-32 animate-pulse space-y-3">
                    <div className="h-4 bg-zinc-850 rounded w-1/3"></div>
                    <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
                    <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                  </div>
                ))
              ) : (
                projects.map((project) => {
                  const parsed = parseDescription(project.description);
                  const priorityColors: Record<string, string> = {
                    HIGH: "bg-zinc-950 text-red-400 border-zinc-850",
                    MEDIUM: "bg-zinc-950 text-amber-400 border-zinc-850",
                    LOW: "bg-zinc-950 text-blue-400 border-zinc-850"
                  };
                  return (
                    <div
                      key={project.id}
                      className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 transition-all duration-200 hover:translate-y-[-2px] hover:border-zinc-700/80 hover:shadow-[0_0_15px_rgba(124,58,237,0.04)] ease-in-out"
                    >
                      <h3 className="text-lg font-bold text-zinc-100">
                        {project.title}
                      </h3>
                      <p className="text-zinc-300 mt-2 text-sm leading-relaxed">
                        {parsed.description || "No description provided."}
                      </p>
                      {(parsed.category || parsed.priority || parsed.deadline) && (
                        <div className="flex flex-wrap gap-2 text-[9px] font-mono mt-4 pt-3 border-t border-zinc-850/50 select-none">
                          {parsed.category && (
                            <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 uppercase">
                              📁 {parsed.category}
                            </span>
                          )}
                          {parsed.priority && (
                            <span className={`px-2 py-0.5 rounded border uppercase tracking-wider ${priorityColors[parsed.priority] || "bg-zinc-950 text-zinc-400 border-zinc-850"}`}>
                              ⚡ {parsed.priority}
                            </span>
                          )}
                          {parsed.deadline && (
                            <span className="px-2 py-0.5 rounded border border-zinc-850 bg-zinc-950 text-zinc-400">
                              📅 {new Date(parsed.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              {!isLoading && projects.length === 0 && (
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

            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 shadow-md transition-all duration-200 hover:border-zinc-700/80 hover:shadow-[0_0_15px_rgba(124,58,237,0.04)] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-850">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                  Live Stream Ticker
                </span>
              </div>

              <div className="space-y-3.5 max-h-[24rem] overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="space-y-4 animate-pulse">
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
                ) : (
                  activityLogs.map((log) => {
                    const iconType = getActivityIcon(log.action);
                    return (
                      <div key={log.id} className="flex gap-3 text-xs leading-relaxed">
                        {/* Icon mapping */}
                        <div className="mt-0.5">
                          {iconType === "project" && (
                            <span className="p-1.5 rounded bg-zinc-900/40 border border-zinc-800 text-zinc-400 block">
                              <FolderOpen size={12} />
                            </span>
                          )}
                          {iconType === "member" && (
                            <span className="p-1.5 rounded bg-zinc-900/40 border border-zinc-800 text-zinc-400 block">
                              <Users size={12} />
                            </span>
                          )}
                          {iconType === "task" && (
                            <span className="p-1.5 rounded bg-zinc-900/40 border border-zinc-800 text-zinc-450 block">
                              <CheckSquare size={12} />
                            </span>
                          )}
                          {iconType === "comment" && (
                            <span className="p-1.5 rounded bg-zinc-900/40 border border-zinc-800 text-zinc-450 block">
                              <MessageSquare size={12} />
                            </span>
                          )}
                          {iconType === "system" && (
                            <span className="p-1.5 rounded bg-zinc-900/40 border border-zinc-800 text-zinc-450 block">
                              <Shield size={12} />
                            </span>
                          )}
                        </div>

                        {/* Message content */}
                        <div className="flex-1">
                          <p className="text-zinc-300 font-mono text-[10px] font-medium break-words font-sans">
                            {formatActivityMessage(log, userMap)}
                          </p>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {formatRelativeTime(log.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                {!isLoading && activityLogs.length === 0 && (
                  <div className="text-center py-8 text-zinc-600 italic text-[11px] font-mono">
                    No team activity logged yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
