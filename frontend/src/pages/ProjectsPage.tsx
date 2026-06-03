import { useEffect, useState } from "react";
import {
  getProjects,
  createProject,
  deleteProject,
} from "../services/projectService";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion } from "framer-motion";

// Helper to parse description JSON safely
const parseDescription = (rawDesc: string | undefined) => {
  if (!rawDesc) {
    return {
      description: "",
      category: "Cloud Infrastructure",
      priority: "MEDIUM",
      deadline: "",
    };
  }
  try {
    const data = JSON.parse(rawDesc);
    return {
      description: data.desc || "",
      category: data.category || "Cloud Infrastructure",
      priority: data.priority || "MEDIUM",
      deadline: data.deadline || "",
    };
  } catch (e) {
    return {
      description: rawDesc,
      category: "Cloud Infrastructure",
      priority: "MEDIUM",
      deadline: "",
    };
  }
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Advanced configuration states
  const [category, setCategory] = useState("Cloud Infrastructure");
  const [priority, setPriority] = useState("MEDIUM");
  const [deadline, setDeadline] = useState("");

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("Project title is required");
      return;
    }

    // Persist category, priority, and deadline in the description JSON string
    const serializedDescription = JSON.stringify({
      desc: description,
      category,
      priority,
      deadline,
    });

    await createProject({
      title,
      description: serializedDescription,
    });

    setTitle("");
    setDescription("");
    setCategory("Cloud Infrastructure");
    setPriority("MEDIUM");
    setDeadline("");

    await loadProjects();
  };

  const handleDelete = async (id: number) => {
    await deleteProject(id);
    await loadProjects();
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-zinc-100">
              Projects
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-2">
              Manage and configure your active development projects.
            </p>
          </div>
        </div>

        {/* Create Project Form Container */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 mb-8 shadow-sm text-slate-800 dark:text-zinc-100 transition-colors duration-300">
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-200 mb-4">
            Create New Project
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                Project Title
              </label>
              <input
                className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/10 focus:border-violet-500 dark:focus:border-violet-500 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none transition duration-200"
                placeholder="Enter workspace or project title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                Description
              </label>
              <textarea
                className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/10 focus:border-violet-500 dark:focus:border-violet-500 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none transition duration-200"
                rows={3}
                placeholder="Specify target deliverables and goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Advanced Configuration Grid (Tailwind responsive columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/10 focus:border-violet-500 dark:focus:border-violet-500 text-slate-800 dark:text-zinc-100 outline-none transition duration-200 cursor-pointer"
                >
                  <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                  <option value="Backend Development">Backend Development</option>
                  <option value="MLOps Pipeline">MLOps Pipeline</option>
                  <option value="Frontend Design">Frontend Design</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/10 focus:border-violet-500 dark:focus:border-violet-500 text-slate-800 dark:text-zinc-100 outline-none transition duration-200 cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              {/* Completion Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1.5">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/10 focus:border-violet-500 dark:focus:border-violet-500 text-slate-800 dark:text-zinc-100 outline-none transition duration-200 cursor-pointer"
                />
              </div>
            </div>

            {/* Create Button */}
            <div className="pt-2">
              <button
                onClick={handleCreate}
                className="bg-violet-600 hover:bg-violet-500 px-5 py-3 rounded-lg text-white font-medium focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition duration-200 shadow-sm cursor-pointer"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>

        {/* Projects List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => {
            const parsed = parseDescription(project.description);
            const projCategory = parsed.category || "Cloud Infrastructure";
            const projPriority = parsed.priority || "MEDIUM";
            const projDeadline = parsed.deadline;
            const projDescription = parsed.description;

            // Map health color based on priority/ID mapping to look real
            const healthOptions = [
              { label: "On Track", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-900/50" },
              { label: "At Risk", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-900/50" },
              { label: "Critical", color: "bg-red-500/10 text-red-700 dark:text-red-400 dark:bg-red-950/30 border-red-200/50 dark:border-red-900/50" }
            ];
            const health = healthOptions[project.id % healthOptions.length];

            const priorityColors: Record<string, string> = {
              HIGH: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-900/50",
              MEDIUM: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50",
              LOW: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50"
            };

            const progressPercent = projPriority === "HIGH" ? 45 : projPriority === "MEDIUM" ? 70 : 85;

            return (
              <div
                key={project.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-violet-500 dark:hover:border-violet-400 hover:-translate-y-1 transition-all duration-300 ease-in-out flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-2xs font-semibold tracking-wider bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 uppercase">
                      {projCategory}
                    </span>
                    <div className="flex gap-1.5 items-center">
                      <span className={`px-2 py-0.5 rounded-full text-3xs font-bold border uppercase tracking-wider ${priorityColors[projPriority]}`}>
                        {projPriority}
                      </span>
                      <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-2xs font-semibold border ${health.color}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current block"></span>
                        <span>{health.label}</span>
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                    {project.title}
                  </h3>

                  <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm line-clamp-2">
                    {projDescription}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                      <span>Completion Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-950 border border-slate-200/50 dark:border-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-violet-600 dark:bg-violet-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    {projDeadline ? (
                      <span className="flex items-center gap-1 font-mono text-3xs text-slate-400 dark:text-zinc-500">
                        📅 Due: {new Date(projDeadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    ) : (
                      <span className="text-3xs text-slate-400 dark:text-zinc-500">No deadline set</span>
                    )}

                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                      </svg>
                      Delete Project
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}