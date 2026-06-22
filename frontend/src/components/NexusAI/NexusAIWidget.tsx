import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Plus, Check, X, ChevronDown } from "lucide-react";
import { getProjects } from "../../services/projectService";
import { createTask } from "../../services/taskService";
import api from "../../api/client";

interface ProjectItem {
  id: number;
  title: string;
  description?: string;
  created_at?: string;
}

interface TaskSuggestion {
  title: string;
  description: string;
  added?: boolean;
  adding?: boolean;
}

export default function NexusAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleAddTask = async (index: number, suggestion: TaskSuggestion) => {
    if (!selectedProjectId) return;

    // Set adding state
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

      // Set added state
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
            className="w-[360px] md:w-[400px] max-h-[520px] bg-zinc-900/90 dark:bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden mb-4 mr-1 text-zinc-150"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center">
                  <Sparkles size={14} />
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-100">
                  Nexus AI Assistant
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-850 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {/* Project selector dropdown */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-550 mb-1.5 font-mono">
                  Select Project
                </label>
                {isLoadingProjects ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 py-3 font-mono">
                    <Loader2 size={12} className="animate-spin text-zinc-450" />
                    Loading projects...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-xs text-zinc-500 py-2 italic font-sans">
                    No projects found. Please create a project first.
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedProjectId || ""}
                      onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                      className="w-full appearance-none bg-zinc-950/80 border border-zinc-800 rounded-lg p-2.5 pr-8 focus:border-zinc-700 text-zinc-300 outline-none transition duration-200 cursor-pointer text-xs font-mono"
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

              {/* Action area */}
              <div className="pt-2">
                <button
                  onClick={handleGenerateTasks}
                  disabled={!selectedProjectId || isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-xs font-mono rounded-lg transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-zinc-950" />
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

              {/* Error messages */}
              {errorMessage && (
                <div className="text-[10px] text-red-400 font-mono bg-red-950/20 border border-red-900/30 px-3 py-2.5 rounded-lg leading-relaxed">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Suggestions List */}
              <div className="space-y-3">
                {suggestions.length > 0 && (
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-550 font-mono mb-2">
                    AI Suggestions ({suggestions.length})
                  </div>
                )}

                {suggestions.map((sug, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 bg-zinc-950/40 border border-zinc-850/80 rounded-xl flex items-start justify-between gap-3 text-left transition duration-200 hover:border-zinc-800"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-200 leading-snug truncate">
                        {sug.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
                        {sug.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddTask(idx, sug)}
                      disabled={sug.added || sug.adding}
                      className={`shrink-0 p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                        sug.added
                          ? "bg-emerald-950/40 border-emerald-900/50 text-emerald-400"
                          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100"
                      }`}
                    >
                      {sug.adding ? (
                        <Loader2 size={12} className="animate-spin text-zinc-400" />
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
