import { useEffect, useState, useRef } from "react";
import {
  getTasks,
  createTask,
  deleteTask,
  updateTask,
} from "../services/taskService";
import { getComments, createComment } from "../services/commentService";
import { getProjects } from "../services/projectService";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { 
  ClipboardList, 
  Clock, 
  MessageSquare, 
  ArrowUpRight
} from "lucide-react";

// Mock helper to fetch task hours
const getTaskHours = (task: any) => {
  return (task.id % 5) + 2;
};

// ---------------------------------------------------------------------------
// Droppable Kanban Column Component
// ---------------------------------------------------------------------------
function DroppableColumn({
  id,
  title,
  children,
  count,
  totalHours,
  activeTask,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  count: number;
  totalHours: number;
  activeTask: any | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  const dotColors: Record<string, string> = {
    TODO: "bg-zinc-650",
    IN_PROGRESS: "bg-amber-500/80",
    DONE: "bg-emerald-500/80"
  };

  return (
    <div
      ref={setNodeRef}
      className={`bg-zinc-900/35 border rounded-xl p-4 min-h-[380px] transition-all duration-200 flex flex-col ${isOver
          ? "border-zinc-700 bg-zinc-900/60 shadow-lg"
          : "border-zinc-850"
        }`}
    >
      <div className="flex justify-between items-center mb-4">
        {/* Monospace status micro-badge */}
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-3xs rounded-md font-mono select-none">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColors[id] || "bg-zinc-650"}`} />
          <span className="text-zinc-350">{title}</span>
        </div>
        
        <div className="flex items-center gap-1.5 text-4xs font-mono text-zinc-550">
          <span>{totalHours}h</span>
          <span className="w-1 h-1 rounded-full bg-zinc-800" />
          <span>{count} items</span>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {count === 0 && !isOver ? (
          <div className="h-full min-h-[240px] border border-dashed border-zinc-850 rounded-xl flex flex-col items-center justify-center p-6 text-center">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
              No tasks here
            </span>
            <p className="text-[9px] text-zinc-550 mt-1 max-w-[130px] leading-relaxed">
              Drag and drop items here to update status.
            </p>
          </div>
        ) : (
          <>
            {children}
            {isOver && activeTask && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.55, y: 0 }}
                className="border border-dashed border-zinc-700 bg-zinc-950/20 rounded-xl p-5 min-h-[160px] flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="w-12 h-4 rounded bg-zinc-900 animate-pulse" />
                  <div className="w-2/3 h-5 rounded bg-zinc-900 animate-pulse" />
                  <div className="w-full h-4 rounded bg-zinc-900 animate-pulse" />
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable Task Card
// ---------------------------------------------------------------------------
function DraggableTaskCard({
  task,
  getProjectName,
  handleDelete,
  handleStatusChange,
  columnStatus,
  onCardClick,
}: {
  task: any;
  getProjectName: (id: number) => string;
  handleDelete: (id: number) => void;
  handleStatusChange: (id: number, status: string) => void;
  columnStatus: string;
  onCardClick: (task: any) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: String(task.id) });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.35 : 1,
    transition: isDragging ? "none" : "opacity 200ms ease",
  };

  const getDueDateString = () => {
    if (task.due_date) {
      return new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    const d = new Date();
    d.setDate(d.getDate() + (task.id % 8) + 2);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const assignees = ["CK", "AM", "JD", "SL"];
  const assigneeInitials = assignees[task.id % assignees.length];

  const priority = task.priority || "MEDIUM";
  const priorityColors: Record<string, string> = {
    HIGH: "bg-zinc-950 text-red-400 border-zinc-800 font-mono",
    MEDIUM: "bg-zinc-950 text-amber-400 border-zinc-800 font-mono",
    LOW: "bg-zinc-950 text-blue-400 border-zinc-800 font-mono"
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onCardClick(task)}
      className={`bg-zinc-900/50 border rounded-xl p-5 mb-3 cursor-grab active:cursor-grabbing select-none shadow-sm hover:translate-y-[-2px] hover:shadow-lg hover:border-zinc-700 transition-all duration-200 flex flex-col justify-between min-h-[160px] ${isDragging
          ? "border-zinc-600 shadow-2xl"
          : "border-zinc-850"
        }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Monospace Priority Badge */}
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${priorityColors[priority]}`}>
            {priority}
          </span>

          {/* User initials circle */}
          <div className="w-5.5 h-5.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-[9px] select-none shadow-inner">
            {assigneeInitials}
          </div>
        </div>

        <h3 className="font-bold text-sm text-zinc-200 leading-snug">{task.title}</h3>
        <p className="text-zinc-400 mt-2 text-[11px] line-clamp-2">{task.description}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-850/80 flex flex-col gap-3">
        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span className="truncate max-w-[125px] flex items-center gap-1">
            <span>📁 {getProjectName(task.project_id)}</span>
            <span className="px-1 py-0.2 bg-zinc-950 rounded text-zinc-450 border border-zinc-850">
              ⏳ {getTaskHours(task)}h
            </span>
          </span>

          <span className="flex items-center gap-1 shrink-0">
            <Clock size={10} />
            {getDueDateString()}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1 pt-1">
          <div className="flex gap-2">
            {columnStatus === "TODO" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(task.id, "IN_PROGRESS");
                }}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-[10px] font-bold px-2.5 py-1 rounded transition duration-200 cursor-pointer shadow-sm"
              >
                Start
              </button>
            )}
            {columnStatus === "IN_PROGRESS" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(task.id, "DONE");
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded transition duration-200 cursor-pointer shadow-sm"
              >
                Complete
              </button>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(task.id);
            }}
            className="text-red-400 hover:text-red-300 font-semibold text-[10px] hover:underline cursor-pointer font-mono"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task Details Modal
// ---------------------------------------------------------------------------
function TaskModal({
  task,
  isOpen,
  onClose,
  getProjectName,
}: {
  task: any;
  isOpen: boolean;
  onClose: () => void;
  getProjectName: (id: number) => string;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      const fetchComments = async () => {
        try {
          const data = await getComments(task.id);
          if (data.length === 0) {
            const seedComments = [
              {
                id: -1,
                content: "Is this task ready for engineering review? Let's check the schema definitions.",
                task_id: task.id,
                user_id: 101,
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              },
              {
                id: -2,
                content: "I am finishing up the API endpoints right now. I will push a branch for review in an hour.",
                task_id: task.id,
                user_id: 102,
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              }
            ];
            setComments(seedComments);
          } else {
            setComments(data);
          }
        } catch (e) {
          const seedComments = [
            {
              id: -1,
              content: "Is this task ready for engineering review? Let's check the schema definitions.",
              task_id: task.id,
              user_id: 101,
              created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            }
          ];
          setComments(seedComments);
        }
      };
      fetchComments();
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);

    const tempComment = {
      id: Math.random(),
      content: newComment,
      task_id: task.id,
      user_id: 999,
      created_at: new Date().toISOString(),
    };

    setComments((prev) => [...prev, tempComment]);
    setNewComment("");

    try {
      await createComment(task.id, newComment);
    } catch (e) {
      console.error("Failed to post comment", e);
    } finally {
      setLoading(false);
    }
  };

  const getCommenterInfo = (userId: number) => {
    const currentUserName = localStorage.getItem("userName") || "Cholan Kinnera";
    if (userId === 1 || userId === 2 || userId === 0 || userId === 999) {
      return {
        name: currentUserName,
        initials: currentUserName.split(" ").map(n => n[0]).join("").toUpperCase(),
        color: "bg-zinc-950 border border-zinc-800 text-zinc-300"
      };
    }
    if (userId === 101) {
      return {
        name: "Alice Miller",
        initials: "AM",
        color: "bg-zinc-950 border border-zinc-800 text-zinc-300"
      };
    }
    return {
      name: "John Doe",
      initials: "JD",
      color: "bg-zinc-950 border border-zinc-800 text-zinc-300"
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-xs"
        />

        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row text-zinc-200"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Left Column - Details */}
          <div className="flex-1 p-8 overflow-y-auto max-h-[40vh] md:max-h-none">
            <span className="px-2.5 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
              {task.priority || "MEDIUM"} Priority
            </span>

            <h2 className="text-xl font-bold text-white mt-4 leading-tight">
              {task.title}
            </h2>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[11px] font-mono text-zinc-500">
              <span className="flex items-center gap-1">
                📁 Project: <span className="text-zinc-300">{getProjectName(task.project_id)}</span>
              </span>
              <span className="flex items-center gap-1">
                ⚙️ Status: <span className="text-zinc-300 uppercase">{task.status}</span>
              </span>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-850">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                Description
              </h4>
              <p className="text-zinc-400 text-xs leading-relaxed whitespace-pre-wrap">
                {task.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Right Column - Discussion */}
          <div className="w-full md:w-[400px] flex flex-col h-[45vh] md:h-[500px] bg-zinc-950/30 border-t md:border-t-0 md:border-l border-zinc-850">
            <div className="p-6 pb-4 border-b border-zinc-850">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare size={14} />
                Discussion
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {comments.map((comment) => {
                const info = getCommenterInfo(comment.user_id);
                const timeStr = new Date(comment.created_at).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit"
                });
                const dateStr = new Date(comment.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric"
                });

                return (
                  <div key={comment.id} className="flex gap-3">
                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] select-none ${info.color}`}>
                      {info.initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="font-bold text-2xs text-zinc-300">
                          {info.name}
                        </span>
                        <span className="text-[9px] text-zinc-650 font-mono">
                          {dateStr} {timeStr}
                        </span>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-850 p-3 rounded-xl rounded-tl-none text-[11px] text-zinc-400 leading-relaxed break-words">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {comments.length === 0 && (
                <div className="text-center py-12 text-zinc-600 italic text-[11px] font-mono">
                  No comments yet.
                </div>
              )}
            </div>

            <form onSubmit={handlePostComment} className="p-4 border-t border-zinc-850 bg-zinc-900">
              <div className="flex flex-col gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 transition duration-200 resize-none h-16"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="self-end bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-[10px] px-3.5 py-1.5 rounded transition duration-200 shadow-sm cursor-pointer disabled:opacity-60 font-mono"
                >
                  {loading ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main Tasks Kanban Page
// ---------------------------------------------------------------------------
export function TasksPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeTask, setActiveTask] = useState<any | null>(null);

  const [selectedModalTask, setSelectedModalTask] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data);
    if (data.length > 0) {
      setSelectedProject(data[0].id);
    }
  };

  useEffect(() => {
    Promise.all([loadTasks(), loadProjects()]).finally(() => {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    });
  }, []);

  const getProjectName = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.title || "Unknown Project";
  };

  const handleCreate = async () => {
    if (!selectedProject) {
      alert("Please select or create a project first");
      return;
    }
    setIsLoading(true);
    await createTask({
      title,
      description,
      priority: "MEDIUM",
      project_id: selectedProject,
    });
    setTitle("");
    setDescription("");
    await loadTasks();
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => {
    setIsLoading(true);
    await deleteTask(id);
    await loadTasks();
    setIsLoading(false);
  };

  const handleLoadSampleData = async () => {
    if (projects.length === 0) {
      alert("Please create at least one project first before loading sample tasks!");
      return;
    }
    setIsLoading(true);
    const targetProjectId = selectedProject || projects[0].id;
    const samples = [
      { title: "Integrate OAuth 2.0 Credentials", description: "Set up login and registration via GitHub and Google oauth endpoints.", priority: "HIGH" },
      { title: "Database migration for audit logs", description: "Create table schemas, constraints, and relational indices for security storage.", priority: "MEDIUM" },
      { title: "Configure GitHub Actions CI pipeline", description: "Automate build verification, lint checking, and image generation on push.", priority: "HIGH" },
      { title: "Draft developer API user guide", description: "Document endpoints, header signatures, and response payloads.", priority: "LOW" }
    ];

    for (const sample of samples) {
      await createTask({
        title: sample.title,
        description: sample.description,
        priority: sample.priority,
        project_id: targetProjectId
      });
    }
    await loadTasks();
    setIsLoading(false);
  };

  const todoTasks = tasks.filter((task) => task.status === "TODO");
  const progressTasks = tasks.filter((task) => task.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((task) => task.status === "DONE");

  const todoHours = todoTasks.reduce((acc, t) => acc + getTaskHours(t), 0);
  const progressHours = progressTasks.reduce((acc, t) => acc + getTaskHours(t), 0);
  const doneHours = doneTasks.reduce((acc, t) => acc + getTaskHours(t), 0);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await updateTask(taskId, {
        status: newStatus,
      });
      loadTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const draggedTask = tasks.find(
      (t) => String(t.id) === String(event.active.id)
    );
    setActiveTask(draggedTask || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const droppedColumnStatus = over.id as string;
    const taskId = Number(active.id);
    const task = tasks.find((t) => t.id === taskId);

    if (!task) return;
    if (task.status === droppedColumnStatus) return;

    handleStatusChange(taskId, droppedColumnStatus);
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-zinc-150">
              Tasks
            </h1>
            <p className="text-zinc-400 mt-2 text-sm font-sans">
              Manage and track your active workflows on the Kanban Board.
            </p>
          </div>

          <button
            onClick={handleLoadSampleData}
            className="self-start sm:self-center px-4 py-2 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold transition duration-200 shadow-sm font-mono cursor-pointer"
          >
            Load Sample Data
          </button>
        </div>

        {/* Create Task Form */}
        <div ref={formRef} className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-6 mb-8 text-zinc-100 backdrop-blur-sm transition-colors duration-300">
          <h2 className="text-lg font-bold text-zinc-200 mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-zinc-450" />
            Create New Task
          </h2>

          <input
            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 mb-4 focus:border-zinc-700 text-zinc-100 placeholder-zinc-550 outline-none transition duration-200 text-sm font-mono"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 mb-4 focus:border-zinc-700 text-zinc-100 placeholder-zinc-550 outline-none transition duration-200 text-sm"
            rows={3}
            placeholder="Task description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 font-mono">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-450 mb-1.5">
                Associate Project
              </label>
              <select
                value={selectedProject || ""}
                onChange={(e) => setSelectedProject(Number(e.target.value))}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 focus:border-zinc-700 text-zinc-300 outline-none transition duration-200 cursor-pointer text-xs"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-5 py-2.5 rounded-lg font-medium transition duration-200 shadow-sm cursor-pointer text-xs"
          >
            Create Task
          </button>
        </div>

        {/* ── KANBAN VIEW PORT ─────────────────────────────────────────── */}
        {isLoading ? (
          /* Animated columns skeletons */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((col) => (
              <div key={col} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 min-h-[350px] animate-pulse space-y-4">
                <div className="h-4 bg-zinc-850 rounded w-1/3 mb-2"></div>
                {[1, 2].map((card) => (
                  <div key={card} className="bg-zinc-950/40 border border-zinc-850 p-5 rounded-lg space-y-3">
                    <div className="h-3 bg-zinc-900 rounded w-1/4"></div>
                    <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
                    <div className="h-3 bg-zinc-900 rounded w-full"></div>
                    <div className="h-2 bg-zinc-900 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          /* ── BEAUTIFUL EMPTY STATE ────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-12 py-20 bg-zinc-900/20 border border-dashed border-zinc-850 rounded-xl max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800/80 flex items-center justify-center text-zinc-400 mb-6 shadow-inner">
              <ClipboardList size={22} className="text-zinc-550" />
            </div>

            <h3 className="text-lg font-bold text-zinc-200 mb-2">No active tasks configured</h3>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-8">
              Populate your active boards to organize pipelines, resolve blockers, and calculate story points.
            </p>

            <div className="flex gap-4">
              <button
                onClick={scrollToForm}
                className="px-4 py-2 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>Add Task</span>
                <ArrowUpRight size={12} />
              </button>
              <button
                onClick={handleLoadSampleData}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-semibold font-mono transition-all shadow-sm cursor-pointer"
              >
                Load Mock Tasks
              </button>
            </div>
          </motion.div>
        ) : (
          /* Kanban Board */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* TODO */}
              <DroppableColumn
                id="TODO"
                title="TODO"
                count={todoTasks.length}
                totalHours={todoHours}
                activeTask={activeTask}
              >
                {todoTasks.map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    getProjectName={getProjectName}
                    handleDelete={handleDelete}
                    handleStatusChange={handleStatusChange}
                    columnStatus="TODO"
                    onCardClick={(t) => {
                      setSelectedModalTask(t);
                      setModalOpen(true);
                    }}
                  />
                ))}
              </DroppableColumn>

              {/* IN PROGRESS */}
              <DroppableColumn
                id="IN_PROGRESS"
                title="In Progress"
                count={progressTasks.length}
                totalHours={progressHours}
                activeTask={activeTask}
              >
                {progressTasks.map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    getProjectName={getProjectName}
                    handleDelete={handleDelete}
                    handleStatusChange={handleStatusChange}
                    columnStatus="IN_PROGRESS"
                    onCardClick={(t) => {
                      setSelectedModalTask(t);
                      setModalOpen(true);
                    }}
                  />
                ))}
              </DroppableColumn>

              {/* DONE */}
              <DroppableColumn
                id="DONE"
                title="Done"
                count={doneTasks.length}
                totalHours={doneHours}
                activeTask={activeTask}
              >
                {doneTasks.map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    getProjectName={getProjectName}
                    handleDelete={handleDelete}
                    handleStatusChange={handleStatusChange}
                    columnStatus="DONE"
                    onCardClick={(t) => {
                      setSelectedModalTask(t);
                      setModalOpen(true);
                    }}
                  />
                ))}
              </DroppableColumn>
            </div>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={null}>
              {activeTask ? (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-80 shadow-2xl rotate-[2deg] opacity-95 text-left font-sans">
                  <h3 className="font-semibold text-sm text-zinc-100">
                    {activeTask.title}
                  </h3>
                  <p className="text-zinc-500 mt-2 text-[11px] line-clamp-2">
                    {activeTask.description}
                  </p>
                  <p className="text-zinc-400 font-mono text-[9px] mt-2">
                    Project: {getProjectName(activeTask.project_id)}
                  </p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Task Detail Modal */}
        <TaskModal
          task={selectedModalTask}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedModalTask(null);
            loadTasks();
          }}
          getProjectName={getProjectName}
        />
      </motion.div>
    </DashboardLayout>
  );
}