import { useEffect, useState, useRef } from "react";
import {
  getProjects,
  createProject,
  deleteProject,
} from "../services/projectService";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion } from "framer-motion";
import { FolderPlus, Trash2, Calendar, ArrowUpRight, ArrowLeft } from "lucide-react";
import MembersTab from "../components/project/MembersTab";

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
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Advanced configuration states
  const [category, setCategory] = useState("Cloud Infrastructure");
  const [priority, setPriority] = useState("MEDIUM");
  const [deadline, setDeadline] = useState("");

  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const formRef = useRef<HTMLDivElement>(null);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      const projectsList = data?.items ?? [];
      setProjects(projectsList);
      // Sync selected project details if currently open
      if (selectedProject) {
        const updated = projectsList.find((p: any) => p.id === selectedProject.id);
        if (updated) {
          setSelectedProject(updated);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
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

    setIsLoading(true);
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
    setIsLoading(true);
    await deleteProject(id);
    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
    await loadProjects();
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Rendering individual project details view
  if (selectedProject) {
    const parsed = parseDescription(selectedProject.description);
    const healthOptions = [
      { label: "On Track", color: "bg-zinc-950 text-emerald-400 border-zinc-800" },
      { label: "At Risk", color: "bg-zinc-950 text-amber-400 border-zinc-800" },
      { label: "Critical", color: "bg-zinc-950 text-red-400 border-zinc-800" }
    ];
    const health = healthOptions[selectedProject.id % healthOptions.length];

    return (
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="max-w-6xl mx-auto"
        >
          {/* Back Button */}
          <button
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 text-xs font-mono cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Projects</span>
          </button>

          {/* Project Details Header */}
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 mb-8 text-zinc-100">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h1 className="text-3xl font-bold text-zinc-150">{selectedProject.title}</h1>
              <div className="flex gap-2 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 uppercase">
                  {parsed.category || "Cloud Infrastructure"}
                </span>
                <span className="px-2 py-0.5 rounded border border-zinc-850 bg-zinc-950 text-amber-400 uppercase tracking-wider font-mono">
                  {parsed.priority || "MEDIUM"}
                </span>
                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${health.color}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current block"></span>
                  <span>{health.label}</span>
                </span>
              </div>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed max-w-3xl">
              {parsed.description || "No description provided."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-zinc-800 mb-6 text-xs font-mono">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-2.5 px-1.5 border-b-2 font-semibold transition-colors cursor-pointer ${activeTab === "overview"
                  ? "border-zinc-200 text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`pb-2.5 px-1.5 border-b-2 font-semibold transition-colors cursor-pointer ${activeTab === "members"
                  ? "border-zinc-200 text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
            >
              Members
            </button>
          </div>

          {/* Tab Contents */}
          <div className="transition-all duration-200">
            {activeTab === "overview" && (
              <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 text-zinc-350 space-y-4">
                <h3 className="text-base font-bold text-zinc-200">Project Description Details</h3>
                <p className="text-sm leading-relaxed">{parsed.description || "No description details provided."}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 font-mono text-[10px]">
                  <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                    <div className="text-zinc-500 mb-1">CATEGORY</div>
                    <div className="text-zinc-300 uppercase">{parsed.category}</div>
                  </div>
                  <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                    <div className="text-zinc-500 mb-1">PRIORITY</div>
                    <div className="text-zinc-300 uppercase">{parsed.priority}</div>
                  </div>
                  <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                    <div className="text-zinc-500 mb-1">PROJECT ID</div>
                    <div className="text-zinc-300">{selectedProject.id}</div>
                  </div>
                  <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">
                    <div className="text-zinc-500 mb-1">DEADLINE</div>
                    <div className="text-zinc-300">{parsed.deadline || "NONE"}</div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "members" && (
              <MembersTab projectId={selectedProject.id} />
            )}
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="relative flex justify-between items-center mb-8">
          {/* Ambient header glow */}
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="z-10 w-full max-w-5xl">
            <h1 className="text-4xl font-bold text-zinc-150">
              Projects
            </h1>
            <p className="text-zinc-300 mt-2 text-sm font-sans max-w-2xl leading-relaxed">
              Manage and configure your active development projects.
            </p>
          </div>
        </div>

        {/* Create Project Form Container */}
        <div ref={formRef} className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 mb-8 text-zinc-100 transition-colors duration-300">
          <h2 className="text-lg font-bold text-zinc-200 mb-4 flex items-center gap-2">
            <FolderPlus size={18} className="text-zinc-400" />
            Create New Project
          </h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5 font-mono">
                Project Title
              </label>
              <input
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 focus:border-zinc-700 text-zinc-100 placeholder-zinc-550 outline-none transition duration-200 text-sm font-mono"
                placeholder="Enter workspace or project title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5 font-mono">
                Description
              </label>
              <textarea
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 focus:border-zinc-700 text-zinc-100 placeholder-zinc-550 outline-none transition duration-200 text-sm"
                rows={3}
                placeholder="Specify target deliverables and goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Advanced Configuration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              {/* Category Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Infrastructure"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 focus:border-zinc-700 text-zinc-300 outline-none transition duration-200 text-xs"
                />
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 focus:border-zinc-700 text-zinc-300 outline-none transition duration-200 cursor-pointer text-xs"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              {/* Completion Date */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 focus:border-zinc-700 text-zinc-300 outline-none transition duration-200 cursor-pointer text-xs"
                />
              </div>
            </div>

            {/* Create Button */}
            <div className="pt-2">
              <button
                onClick={handleCreate}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-5 py-2.5 rounded-lg font-medium transition duration-200 shadow-sm cursor-pointer text-xs"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>

        {/* ── PROJECTS VIEW PORT ────────────────────────────────────────── */}
        {isLoading ? (
          /* Animated skeleton loader */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((k) => (
              <div key={k} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 h-48 animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-zinc-850 rounded w-1/4"></div>
                  <div className="h-4 bg-zinc-850 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-zinc-800 rounded w-1/2"></div>
                <div className="h-3 bg-zinc-850 rounded w-3/4"></div>
                <div className="h-2 bg-zinc-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          /* ── BEAUTIFUL EMPTY STATE ────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-12 py-20 bg-zinc-900/20 border border-dashed border-zinc-850 rounded-xl max-w-2xl mx-auto"
          >
            {/* Folder SVG Illustration */}
            <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800/80 flex items-center justify-center text-zinc-400 mb-6 shadow-inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-zinc-200 mb-2">No projects in workspace</h3>
            <p className="text-xs text-zinc-300 max-w-lg leading-relaxed mb-8">
              Get started by creating a new development project to track tasks, velocity stats, and pipeline integrations.
            </p>

            <button
              onClick={scrollToForm}
              className="px-4 py-2 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Initialize Project</span>
              <ArrowUpRight size={12} />
            </button>
          </motion.div>
        ) : (
          /* Actual projects grid layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => {
              const parsed = parseDescription(project.description);
              const projCategory = parsed.category || "Cloud Infrastructure";
              const projPriority = parsed.priority || "MEDIUM";
              const projDeadline = parsed.deadline;
              const projDescription = parsed.description;

              // Health labels using mono badges
              const healthOptions = [
                { label: "On Track", color: "bg-zinc-950 text-emerald-400 border-zinc-800" },
                { label: "At Risk", color: "bg-zinc-950 text-amber-400 border-zinc-800" },
                { label: "Critical", color: "bg-zinc-950 text-red-400 border-zinc-800" }
              ];
              const health = healthOptions[project.id % healthOptions.length];

              const priorityColors: Record<string, string> = {
                HIGH: "bg-zinc-950 text-red-400 border-zinc-800",
                MEDIUM: "bg-zinc-950 text-amber-400 border-zinc-800",
                LOW: "bg-zinc-950 text-blue-400 border-zinc-800"
              };

              const progressPercent = projPriority === "HIGH" ? 45 : projPriority === "MEDIUM" ? 70 : 85;

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 shadow-md hover:border-zinc-700/80 hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(124,58,237,0.04)] transition-all duration-200 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 uppercase">
                        {projCategory}
                      </span>
                      <div className="flex gap-1.5 items-center">
                        <span className={`px-2 py-0.5 rounded border uppercase tracking-wider ${priorityColors[projPriority]}`}>
                          {projPriority}
                        </span>
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${health.color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current block"></span>
                          <span>{health.label}</span>
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-150">
                      {project.title}
                    </h3>

                    <p className="text-zinc-300 mt-2 text-xs leading-relaxed line-clamp-2">
                      {projDescription}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-850">
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1.5 text-[10px] font-mono text-zinc-500">
                        <span>Completion Progress</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-950 border border-zinc-850 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-zinc-400 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      {projDeadline ? (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                          <Calendar size={10} />
                          Due: {new Date(projDeadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500">No deadline set</span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project.id);
                        }}
                        className="text-red-400 hover:text-red-300 font-semibold font-mono text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}