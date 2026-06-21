import { useEffect, useState, useRef, useCallback } from "react";
import {
  getProjects,
  createProject,
  deleteProject,
} from "../services/projectService";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion, useReducedMotion } from "framer-motion";
import { FolderPlus, Trash2, Calendar, ArrowLeft, FolderKanban } from "lucide-react";
import MembersTab from "../components/project/MembersTab";
import { PremiumButton } from "../components/ui/PremiumButton";
import { PremiumCard } from "../components/ui/PremiumCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ProjectsSkeleton } from "../components/ui/SkeletonLoader";

// Helper to parse description JSON safely
const parseDescription = (rawDesc: string | undefined) => {
  if (!rawDesc) {
    return {
      description: "",
      category: "",
      priority: "MEDIUM",
      deadline: "",
    };
  }
  try {
    const data = JSON.parse(rawDesc);
    return {
      description: data.desc || "",
      category: data.category || "",
      priority: data.priority || "MEDIUM",
      deadline: data.deadline || "",
    };
  } catch {
    return {
      description: rawDesc,
      category: "",
      priority: "MEDIUM",
      deadline: "",
    };
  }
};

interface ProjectItem {
  id: number;
  title: string;
  description?: string;
  created_at?: string;
}

export default function ProjectsPage() {
  const shouldReduceMotion = useReducedMotion();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Advanced configuration states
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [deadline, setDeadline] = useState("");

  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const priorityRef = useRef<HTMLDivElement>(null);

  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const formRef = useRef<HTMLDivElement>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 350, damping: 25 },
    },
  };

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      const projectsList = (data?.items ?? []) as ProjectItem[];
      setProjects(projectsList);
      // Sync selected project details if currently open
      if (selectedProject) {
        const updated = projectsList.find((p) => p.id === selectedProject.id);
        if (updated) {
          setSelectedProject(updated);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }, [selectedProject]);

  useEffect(() => {
    // Fetch projects synchronously on component mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
        setIsPriorityOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert("Project title is required");
      return;
    }
    if (trimmedTitle.length < 3) {
      alert("Project title must be at least 3 characters");
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
    try {
      await createProject({
        title: trimmedTitle,
        description: serializedDescription,
      });

      setTitle("");
      setDescription("");
      setCategory("");
      setPriority("MEDIUM");
      setDeadline("");

      await loadProjects();
    } catch (err) {
      console.error("Failed to create project:", err);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    try {
      await deleteProject(id);
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
      await loadProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("Failed to delete project. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors mb-6 text-xs font-mono cursor-pointer"
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
                  {parsed.category || "General"}
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
                    <div className="text-zinc-300 uppercase">{parsed.category || "General"}</div>
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
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-150">
              Projects
            </h1>
            <p className="text-zinc-300 mt-2 text-sm font-sans max-w-2xl leading-relaxed">
              Manage and configure your active development projects.
            </p>
          </div>
        </div>

        {/* Create Project Form Container */}
        <PremiumCard ref={formRef} hoverable={false} className="mb-8 text-zinc-100 transition-colors duration-300">
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
              <div className="relative" ref={priorityRef}>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5 font-mono">
                  Priority
                </label>
                <button
                  type="button"
                  onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 focus:border-zinc-700 text-zinc-300 outline-none transition duration-200 cursor-pointer text-xs flex justify-between items-center text-left h-[42px]"
                >
                  <span>
                    {priority === "LOW" && "Low"}
                    {priority === "MEDIUM" && "Medium"}
                    {priority === "HIGH" && "High"}
                  </span>
                  <svg
                    className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isPriorityOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isPriorityOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl overflow-hidden py-1">
                    {[
                      { value: "LOW", label: "Low" },
                      { value: "MEDIUM", label: "Medium" },
                      { value: "HIGH", label: "High" }
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => {
                          setPriority(item.value);
                          setIsPriorityOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors duration-150 ${
                          priority === item.value
                            ? "bg-violet-600/10 text-violet-600 dark:bg-violet-600/20 dark:text-violet-400 font-semibold"
                            : "text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Completion Date */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5 font-mono">
                  Target Completion Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 pr-10 focus:border-zinc-700 text-zinc-300 outline-none transition duration-200 cursor-pointer text-xs h-[42px] relative z-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none z-0" />
                </div>
              </div>
            </div>

            {/* Create Button */}
            <div className="pt-2">
              <PremiumButton
                variant="primary"
                onClick={handleCreate}
              >
                Create Project
              </PremiumButton>
            </div>
          </div>
        </PremiumCard>

        {/* ── PROJECTS VIEW PORT ────────────────────────────────────────── */}
        {isLoading ? (
          <ProjectsSkeleton />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects in workspace"
            description="Get started by creating a new development project to track tasks, velocity stats, and pipeline integrations."
            primaryActionLabel="Initialize Project"
            onPrimaryAction={scrollToForm}
          />
        ) : (
          /* Actual projects grid layout with stagger entry */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {projects.map((project) => {
              const parsed = parseDescription(project.description);
              const projCategory = parsed.category || "General";
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
                <motion.div variants={itemVariants} key={project.id} className="flex">
                  <PremiumCard
                    onClick={() => setSelectedProject(project)}
                    className="flex flex-col justify-between w-full"
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

                        <PremiumButton
                          variant="danger"
                          size="sm"
                          leftIcon={<Trash2 size={12} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(project.id);
                          }}
                          className="font-mono text-[10px] h-7 px-2.5"
                        >
                          Delete
                        </PremiumButton>
                      </div>
                    </div>
                  </PremiumCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}