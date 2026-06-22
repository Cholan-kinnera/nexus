import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Plus, Check, X, ChevronDown, Copy, ChevronLeft, FileText, PenLine, ClipboardList } from "lucide-react";
import { getProjects } from "../../services/projectService";
import { createTask } from "../../services/taskService";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/client";

interface ProjectItem {
  id: number;
  title: string;
  description?: string;
  created_at?: string;
}

interface TaskItem {
  id: number;
  title: string;
  project_id: number;
}

interface TaskSuggestion {
  title: string;
  description: string;
  priority?: string;
  added?: boolean;
  adding?: boolean;
}

type ActiveScreen = "home" | "generate-tasks" | "project-summary" | "task-description" | "meeting-tasks";

export default function NexusAIWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Redesigned activeScreen state instead of activeTab
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>("home");

  // Tab 1: Generate Tasks State (Preserved)
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tab 2: Project Summary State
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Tab 3: Task Description State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [descError, setDescError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Tab 4: Meeting Notes State
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingSuggestions, setMeetingSuggestions] = useState<TaskSuggestion[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  const firstName = user?.full_name ? user.full_name.trim().split(" ")[0] : "there";

  // Fetch projects on mount or when widget is opened
  useEffect(() => {
    if (isOpen) {
      const loadProjects = async () => {
        setIsLoadingProjects(true);
        try {
          const response = await getProjects();
          const list = (response?.items ?? []) as ProjectItem[];
          setProjects(list);
          if (list.length > 0 && selectedProjectId === null) {
            setSelectedProjectId(list[0].id);
          }
        } catch (err) {
          console.error("Failed to load projects in AI Widget:", err);
        } finally {
          setIsLoadingProjects(false);
        }
      };
      loadProjects();
    }
  }, [isOpen]);

  // Fetch project tasks for Task Description tab
  useEffect(() => {
    if (selectedProjectId && activeScreen === "task-description" && isOpen) {
      const loadTasks = async () => {
        setIsLoadingTasks(true);
        setTasks([]);
        setSelectedTaskId(null);
        try {
          const response = await api.get(`/tasks/?project_id=${selectedProjectId}`);
          const list = (response.data?.items ?? []) as TaskItem[];
          const filtered = list.filter((t) => t.project_id === selectedProjectId);
          setTasks(filtered);
          if (filtered.length > 0) {
            setSelectedTaskId(filtered[0].id);
          }
        } catch (err) {
          console.error("Failed to load tasks in AI Widget:", err);
        } finally {
          setIsLoadingTasks(false);
        }
      };
      loadTasks();
    }
  }, [selectedProjectId, activeScreen, isOpen]);

  // Tab 1 Handler (Preserved)
  const handleGenerateTasks = async () => {
    if (!selectedProjectId) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setSuggestions([]);

    try {
      const response = await api.post(`/ai/projects/${selectedProjectId}/generate-tasks`);
      const data = response.data as TaskSuggestion[];
      setSuggestions(data.map((item) => ({ ...item, added: false, adding: false })));
    } catch (err: unknown) {
      console.error("AI Task generation error:", err);
      setErrorMessage("Failed to generate task suggestions. Please check if project description is set.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Tab 1 Add Task (Preserved)
  const handleAddTask = async (index: number, suggestion: TaskSuggestion) => {
    if (!selectedProjectId) return;

    setSuggestions((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, adding: true } : item))
    );

    try {
      await createTask({
        title: suggestion.title,
        description: suggestion.description,
        project_id: selectedProjectId,
        priority: "MEDIUM",
      });

      setSuggestions((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, adding: false, added: true } : item))
      );
    } catch (err) {
      console.error("Failed to add task from AI suggestion:", err);
      alert("Failed to create task from suggestion.");
      setSuggestions((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, adding: false } : item))
      );
    }
  };

  // Tab 2 Handler: Project Summary
  const handleSummarizeProject = async () => {
    if (!selectedProjectId) return;
    setIsGeneratingSummary(true);
    setSummaryError(null);
    setSummaryText(null);

    try {
      const response = await api.post(`/ai/projects/${selectedProjectId}/summarize`);
      const data = response.data as { summary: string };
      setSummaryText(data.summary);
    } catch (err: unknown) {
      console.error("AI Project summary error:", err);
      setSummaryError("Failed to generate project summary. Please check if project description is set.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Tab 3 Handler: Task Description Generator
  const handleGenerateDescription = async () => {
    if (!selectedTaskId) return;
    setIsGeneratingDesc(true);
    setDescError(null);
    setGeneratedDescription(null);

    try {
      const response = await api.post(`/ai/tasks/${selectedTaskId}/generate-description`);
      const data = response.data as { description: string };
      setGeneratedDescription(data.description);
    } catch (err: unknown) {
      console.error("AI Task description error:", err);
      setDescError("Failed to generate task description. Please try again.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  // Tab 3 copy action
  const handleCopyDescription = () => {
    if (!generatedDescription) return;
    navigator.clipboard.writeText(generatedDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tab 4 Handler: Meeting Notes -> Tasks
  const handleExtractTasks = async () => {
    if (!selectedProjectId || !meetingNotes.trim()) return;
    setIsExtracting(true);
    setMeetingError(null);
    setMeetingSuggestions([]);

    try {
      const response = await api.post(`/ai/projects/${selectedProjectId}/meeting-to-tasks`, {
        meeting_notes: meetingNotes,
      });
      const data = response.data as TaskSuggestion[];
      setMeetingSuggestions(data.map((item) => ({ ...item, added: false, adding: false })));
    } catch (err: unknown) {
      console.error("AI Meeting tasks extraction error:", err);
      setMeetingError("AI returned invalid format");
    } finally {
      setIsExtracting(false);
    }
  };

  // Tab 4 Add Task
  const handleAddMeetingTask = async (index: number, suggestion: TaskSuggestion) => {
    if (!selectedProjectId) return;

    setMeetingSuggestions((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, adding: true } : item))
    );

    try {
      await createTask({
        title: suggestion.title,
        description: suggestion.description,
        project_id: selectedProjectId,
        priority: suggestion.priority || "MEDIUM",
      });

      setMeetingSuggestions((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, adding: false, added: true } : item))
      );
    } catch (err) {
      console.error("Failed to add task from AI suggestion:", err);
      alert("Failed to create task from suggestion.");
      setMeetingSuggestions((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, adding: false } : item))
      );
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="w-[360px] md:w-[400px] min-h-[380px] max-h-[520px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden mb-4 mr-1 text-zinc-800 dark:text-zinc-150"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center">
                  <Sparkles size={14} />
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Nexus AI Assistant
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <AnimatePresence mode="wait">
                {activeScreen === "home" ? (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col text-left"
                  >
                    <h3 className="text-zinc-900 dark:text-white font-semibold text-base mt-1">
                      Hi, {firstName} 👋
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">
                      How can I help you today?
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Generate Tasks Card */}
                      <div
                        onClick={() => setActiveScreen("generate-tasks")}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/60 cursor-pointer hover:border-violet-500/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 flex flex-col items-start text-left"
                      >
                        <Sparkles size={16} className="text-violet-400 mb-1" />
                        <span className="text-zinc-900 dark:text-white text-xs font-semibold mt-1">
                          Generate Tasks
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-500 text-[10px] leading-tight mt-0.5">
                          Turn goals into tasks
                        </span>
                      </div>

                      {/* Project Summary Card */}
                      <div
                        onClick={() => setActiveScreen("project-summary")}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/60 cursor-pointer hover:border-violet-500/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 flex flex-col items-start text-left"
                      >
                        <FileText size={16} className="text-violet-400 mb-1" />
                        <span className="text-zinc-900 dark:text-white text-xs font-semibold mt-1">
                          Project Summary
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-500 text-[10px] leading-tight mt-0.5">
                          Quick project overview
                        </span>
                      </div>

                      {/* Task Description Card */}
                      <div
                        onClick={() => setActiveScreen("task-description")}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/60 cursor-pointer hover:border-violet-500/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 flex flex-col items-start text-left"
                      >
                        <PenLine size={16} className="text-violet-400 mb-1" />
                        <span className="text-zinc-900 dark:text-white text-xs font-semibold mt-1">
                          Task Description
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-500 text-[10px] leading-tight mt-0.5">
                          Write from task title
                        </span>
                      </div>

                      {/* Meeting -> Tasks Card */}
                      <div
                        onClick={() => setActiveScreen("meeting-tasks")}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/60 cursor-pointer hover:border-violet-500/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 flex flex-col items-start text-left"
                      >
                        <ClipboardList size={16} className="text-violet-400 mb-1" />
                        <span className="text-zinc-900 dark:text-white text-xs font-semibold mt-1">
                          Meeting → Tasks
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-500 text-[10px] leading-tight mt-0.5">
                          Extract tasks from notes
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeScreen}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Top Bar */}
                    <div className="flex items-center gap-2 mb-3 text-left">
                      <button
                        onClick={() => {
                          if (activeScreen === "generate-tasks") {
                            setSuggestions([]);
                            setIsGenerating(false);
                            setErrorMessage(null);
                          } else if (activeScreen === "project-summary") {
                            setSummaryText(null);
                            setIsGeneratingSummary(false);
                            setSummaryError(null);
                          } else if (activeScreen === "task-description") {
                            setGeneratedDescription(null);
                            setIsGeneratingDesc(false);
                            setDescError(null);
                            setCopied(false);
                          } else if (activeScreen === "meeting-tasks") {
                            setMeetingNotes("");
                            setMeetingSuggestions([]);
                            setIsExtracting(false);
                            setMeetingError(null);
                          }
                          setActiveScreen("home");
                        }}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors p-0.5 flex items-center justify-center"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-zinc-900 dark:text-white text-sm font-semibold">
                        {activeScreen === "generate-tasks" && "Generate Tasks"}
                        {activeScreen === "project-summary" && "Project Summary"}
                        {activeScreen === "task-description" && "Task Description"}
                        {activeScreen === "meeting-tasks" && "Meeting → Tasks"}
                      </span>
                    </div>

                    {/* Project selector dropdown (visible for all tabs) */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-mono text-left">
                        Select Project
                      </label>
                      {isLoadingProjects ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500 py-3 font-mono text-left">
                          <Loader2 size={12} className="animate-spin text-zinc-440" />
                          Loading projects...
                        </div>
                      ) : projects.length === 0 ? (
                        <div className="text-xs text-zinc-500 dark:text-zinc-500 py-2 italic font-sans text-left">
                          No projects found. Please create a project first.
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={selectedProjectId || ""}
                            onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                            className="w-full appearance-none bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 pr-8 focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-700 dark:text-zinc-300 outline-none transition duration-200 cursor-pointer text-xs font-mono"
                          >
                            {projects.map((proj) => (
                              <option key={proj.id} value={proj.id}>
                                {proj.title}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                        </div>
                      )}
                    </div>

                    {/* Selected Feature Content */}
                    {activeScreen === "generate-tasks" && (
                      <div className="space-y-4">
                        <div className="pt-2">
                          <button
                            onClick={handleGenerateTasks}
                            disabled={!selectedProjectId || isGenerating}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs font-mono rounded-lg transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 size={13} className="animate-spin text-white dark:text-zinc-950" />
                                <span>Generating suggestions...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={13} />
                                <span>Generate Actionable Tasks</span>
                              </>
                            )}
                          </button>
                        </div>

                        {errorMessage && (
                          <div className="text-[10px] text-red-455 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 px-3 py-2.5 rounded-lg leading-relaxed text-left">
                            ⚠️ {errorMessage}
                          </div>
                        )}

                        <div className="space-y-3">
                          {suggestions.length > 0 && (
                            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-550 font-mono mb-2 text-left">
                              AI Suggestions ({suggestions.length})
                            </div>
                          )}

                          {suggestions.map((sug, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850/80 rounded-xl flex items-start justify-between gap-3 text-left transition duration-200 hover:border-zinc-350 dark:hover:border-zinc-800"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug truncate">
                                  {sug.title}
                                </p>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                                  {sug.description}
                                </p>
                              </div>

                              <button
                                onClick={() => handleAddTask(idx, sug)}
                                disabled={sug.added || sug.adding}
                                className={`shrink-0 p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                                  sug.added
                                    ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400"
                                    : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-650 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                                }`}
                              >
                                {sug.adding ? (
                                  <Loader2 size={12} className="animate-spin text-zinc-440" />
                                ) : sug.added ? (
                                  <Check size={12} />
                                ) : (
                                  <Plus size={12} />
                                )}
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeScreen === "project-summary" && (
                      <div className="space-y-4">
                        <div className="pt-2">
                          <button
                            onClick={handleSummarizeProject}
                            disabled={!selectedProjectId || isGeneratingSummary}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs font-mono rounded-lg transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                          >
                            {isGeneratingSummary ? (
                              <>
                                <Loader2 size={13} className="animate-spin text-white dark:text-zinc-950" />
                                <span>Generating summary…</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={13} />
                                <span>Summarize Project</span>
                              </>
                            )}
                          </button>
                        </div>

                        {summaryError && (
                          <div className="text-[10px] text-red-455 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 px-3 py-2.5 rounded-lg leading-relaxed text-left">
                            ⚠️ {summaryError}
                          </div>
                        )}

                        {summaryText && (
                          <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl leading-relaxed text-xs text-zinc-700 dark:text-zinc-300 font-sans shadow-inner text-left">
                            {summaryText}
                          </div>
                        )}
                      </div>
                    )}

                    {activeScreen === "task-description" && (
                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-mono">
                            Select Task
                          </label>
                          {isLoadingTasks ? (
                            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500 py-3 font-mono">
                              <Loader2 size={12} className="animate-spin text-zinc-440" />
                              Loading tasks...
                            </div>
                          ) : tasks.length === 0 ? (
                            <div className="text-xs text-zinc-500 dark:text-zinc-500 py-3 italic font-sans text-center border border-zinc-200 dark:border-zinc-850 rounded-lg bg-zinc-50 dark:bg-zinc-950/20">
                              No tasks found in this project.
                            </div>
                          ) : (
                            <div className="relative">
                              <select
                                value={selectedTaskId || ""}
                                onChange={(e) => setSelectedTaskId(Number(e.target.value))}
                                className="w-full appearance-none bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 pr-8 focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-700 dark:text-zinc-300 outline-none transition duration-200 cursor-pointer text-xs font-mono"
                              >
                                {tasks.map((task) => (
                                  <option key={task.id} value={task.id}>
                                    {task.title}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={handleGenerateDescription}
                            disabled={!selectedProjectId || !selectedTaskId || isGeneratingDesc}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs font-mono rounded-lg transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                          >
                            {isGeneratingDesc ? (
                              <>
                                <Loader2 size={13} className="animate-spin text-white dark:text-zinc-950" />
                                <span>Generating description…</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={13} />
                                <span>Generate Description</span>
                              </>
                            )}
                          </button>
                        </div>

                        {descError && (
                          <div className="text-[10px] text-red-455 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 px-3 py-2.5 rounded-lg leading-relaxed">
                            ⚠️ {descError}
                          </div>
                        )}

                        {generatedDescription && (
                          <div className="space-y-3">
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-xl leading-relaxed text-xs text-zinc-700 dark:text-zinc-300 font-sans shadow-inner">
                              {generatedDescription}
                            </div>
                            <button
                              onClick={handleCopyDescription}
                              className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-250 font-bold text-xs font-mono rounded-lg transition duration-200 cursor-pointer border border-zinc-200 dark:border-zinc-750 flex items-center justify-center gap-2"
                            >
                              <Copy size={12} />
                              <span>{copied ? "Copied ✓" : "Copy Description"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeScreen === "meeting-tasks" && (
                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5 font-mono">
                            Meeting Notes
                          </label>
                          <textarea
                            value={meetingNotes}
                            onChange={(e) => setMeetingNotes(e.target.value)}
                            placeholder="Paste your meeting notes here…"
                            rows={4}
                            className="w-full bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 focus:border-zinc-400 dark:focus:border-zinc-700 text-zinc-700 dark:text-zinc-300 outline-none transition duration-200 text-xs font-sans resize-y"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={handleExtractTasks}
                            disabled={!selectedProjectId || !meetingNotes.trim() || isExtracting}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs font-mono rounded-lg transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                          >
                            {isExtracting ? (
                              <>
                                <Loader2 size={13} className="animate-spin text-white dark:text-zinc-950" />
                                <span>Extracting tasks from notes…</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={13} />
                                <span>Extract Tasks</span>
                              </>
                            )}
                          </button>
                        </div>

                        {meetingError && (
                          <div className="text-[10px] text-red-455 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 px-3 py-2.5 rounded-lg leading-relaxed">
                            ⚠️ {meetingError}
                          </div>
                        )}

                        <div className="space-y-3">
                          {meetingSuggestions.length > 0 && (
                            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono mb-2">
                              Extracted Tasks ({meetingSuggestions.length})
                            </div>
                          )}

                          {meetingSuggestions.map((sug, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850/80 rounded-xl flex items-start justify-between gap-3 text-left transition duration-200 hover:border-zinc-355 dark:hover:border-zinc-800"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-snug truncate">
                                    {sug.title}
                                  </p>
                                  {sug.priority && (
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold leading-none ${
                                      sug.priority === "HIGH"
                                        ? "bg-red-950/60 text-red-400 border border-red-900/50"
                                        : sug.priority === "MEDIUM"
                                        ? "bg-amber-950/60 text-amber-400 border border-amber-900/50"
                                        : "bg-blue-950/60 text-blue-400 border border-blue-900/50"
                                    }`}>
                                      {sug.priority}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-1 leading-normal">
                                  {sug.description}
                                </p>
                              </div>

                              <button
                                onClick={() => handleAddMeetingTask(idx, sug)}
                                disabled={sug.added || sug.adding}
                                className={`shrink-0 p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                                  sug.added
                                    ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400"
                                    : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-650 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
                                }`}
                              >
                                {sug.adding ? (
                                  <Loader2 size={12} className="animate-spin text-zinc-440" />
                                ) : sug.added ? (
                                  <Check size={12} />
                                ) : (
                                  <Plus size={12} />
                                )}
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 flex items-center justify-center shadow-2xl cursor-pointer relative z-50 border border-zinc-200"
        title="Nexus AI Assistant"
      >
        {isOpen ? <X size={20} /> : <Sparkles size={20} />}
      </motion.button>
    </div>
  );
}
