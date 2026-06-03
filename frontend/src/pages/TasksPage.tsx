import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { getComments, createComment } from "../services/commentService";

import {
  getTasks,
  createTask,
  deleteTask,
  updateTask,
} from "../services/taskService";

import {
  getProjects,
} from "../services/projectService";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";

// ---------------------------------------------------------------------------
// Droppable Column wrapper with Empty State
// ---------------------------------------------------------------------------
function DroppableColumn({
  id,
  title,
  children,
  count,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  count: number;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-50/50 dark:bg-zinc-900/40 border rounded-2xl p-4 min-h-[350px] transition-all duration-200 flex flex-col ${
        isOver
          ? "border-violet-500/70 shadow-[0_0_20px_rgba(139,92,246,0.15)] bg-slate-100 dark:bg-zinc-900"
          : "border-slate-200/80 dark:border-zinc-800/80"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-200">{title}</h2>
        <span className="text-xs px-2.5 py-0.5 bg-slate-200/60 dark:bg-zinc-800 rounded-full font-mono font-bold text-slate-500 dark:text-zinc-400">
          {count}
        </span>
      </div>

      <div className="flex-1 space-y-3">
        {count === 0 ? (
          <div className="h-full min-h-[240px] border-2 border-dashed border-slate-200 dark:border-zinc-800/60 rounded-xl flex flex-col items-center justify-center p-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-600">
              No tasks here yet
            </span>
            <p className="text-2xs text-slate-400 dark:text-zinc-500 mt-1 max-w-[150px]">
              Drag and drop items here to update status.
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable Task Card with Priority, Avatars, and Due Dates
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

  // Deterministic mock due date if task doesn't have one
  const getDueDateString = () => {
    if (task.due_date) {
      return new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    const d = new Date();
    d.setDate(d.getDate() + (task.id % 8) + 2);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Deterministic mock user initials
  const assignees = ["CK", "AM", "JD", "SL"];
  const assigneeInitials = assignees[task.id % assignees.length];

  // Priority color mapping
  const priority = task.priority || "MEDIUM";
  const priorityColors: Record<string, string> = {
    HIGH: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-900/50",
    MEDIUM: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/50",
    LOW: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/50"
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onCardClick(task)}
      className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 mb-3 cursor-grab active:cursor-grabbing select-none shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between min-h-[160px] ${
        isDragging
          ? "border-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.25)]"
          : "border-slate-200 dark:border-zinc-800 hover:border-violet-500/40 dark:hover:border-violet-500/40"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Priority Badge */}
          <span className={`px-2 py-0.5 rounded-full text-3xs font-bold border uppercase tracking-wider ${priorityColors[priority]}`}>
            {priority}
          </span>
          
          {/* Circular Assignee Avatar */}
          <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-900/30 flex items-center justify-center font-bold text-[10px] select-none shadow-inner">
            {assigneeInitials}
          </div>
        </div>

        <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 leading-snug">{task.title}</h3>
        <p className="text-slate-500 dark:text-zinc-400 mt-2 text-xs line-clamp-2">{task.description}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between text-3xs text-slate-400 dark:text-zinc-500 font-medium">
          {/* Project Tag */}
          <span className="truncate max-w-[125px] flex items-center gap-1">
            📁 {getProjectName(task.project_id)}
          </span>

          {/* Due date with icon */}
          <span className="flex items-center gap-1 shrink-0 font-mono">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
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
                className="bg-violet-600 hover:bg-violet-500 text-white text-3xs font-bold px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer shadow-sm hover:shadow"
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-3xs font-bold px-3 py-1.5 rounded-lg transition duration-200 cursor-pointer shadow-sm hover:shadow"
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
            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-semibold text-3xs hover:underline cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task Details & Comments Section Modal
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
            // Seed sample comments if empty
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
          // Fallback if backend API has issue
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
      user_id: 999, // identifier for active user
      created_at: new Date().toISOString(),
    };

    // Update state instantly and clear textarea cleanly
    setComments((prev) => [...prev, tempComment]);
    setNewComment("");

    try {
      await createComment(task.id, newComment);
    } catch (e) {
      console.error("Failed to post comment to database", e);
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
        color: "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300"
      };
    }
    if (userId === 101) {
      return {
        name: "Alice Miller",
        initials: "AM",
        color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
      };
    }
    if (userId === 102) {
      return {
        name: "John Doe",
        initials: "JD",
        color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
      };
    }
    const mockCommenters = [
      { name: "Alice Miller", initials: "AM", color: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" },
      { name: "John Doe", initials: "JD", color: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" },
      { name: "Sarah Logan", initials: "SL", color: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" }
    ];
    return mockCommenters[userId % mockCommenters.length];
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal body container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row text-slate-800 dark:text-zinc-100"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Left Column - Details */}
          <div className="flex-1 p-8 overflow-y-auto max-h-[40vh] md:max-h-none">
            <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold border border-violet-200/50 dark:border-violet-900/50 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              {task.priority || "MEDIUM"} Priority
            </span>

            <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-100 mt-4 leading-tight">
              {task.title}
            </h2>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs font-semibold text-slate-500 dark:text-zinc-400">
              <span className="flex items-center gap-1">
                📁 Project: <span className="text-slate-800 dark:text-zinc-200">{getProjectName(task.project_id)}</span>
              </span>
              <span className="flex items-center gap-1">
                ⚙️ Status: <span className="text-violet-600 dark:text-violet-400 uppercase tracking-wide">{task.status}</span>
              </span>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
                Description
              </h4>
              <p className="text-slate-600 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {task.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Right Column - Comments (Discussion Feed) */}
          <div className="w-full md:w-[420px] flex flex-col h-[45vh] md:h-[550px] bg-slate-50/50 dark:bg-zinc-900/30 border-t md:border-t-0 md:border-l border-slate-150 dark:border-zinc-800/80">
            <div className="p-6 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                💬 Discussion
              </h3>
            </div>

            {/* Comments Scroll Container */}
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
                    {/* User initials circle */}
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs select-none shadow-inner border border-slate-200/20 ${info.color}`}>
                      {info.initials}
                    </div>

                    {/* Bubble */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-800 dark:text-zinc-100">
                          {info.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {dateStr} {timeStr}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-zinc-950 border border-slate-200/50 dark:border-zinc-800/80 p-3 rounded-2xl rounded-tl-none shadow-3xs text-xs text-slate-700 dark:text-zinc-300 leading-relaxed break-words">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {comments.length === 0 && (
                <div className="text-center py-12 text-slate-400 dark:text-zinc-500 italic text-xs">
                  No comments yet. Start the discussion below!
                </div>
              )}
            </div>

            {/* Comment Input form */}
            <form onSubmit={handlePostComment} className="p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
              <div className="flex flex-col gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-violet-500 transition duration-200 resize-none h-16"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="self-end bg-violet-600 hover:bg-violet-500 text-white font-bold text-2xs px-4 py-2 rounded-xl transition duration-200 shadow-sm cursor-pointer disabled:opacity-60"
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeTask, setActiveTask] = useState<any | null>(null);

  // States for Task Click Modal
  const [selectedModalTask, setSelectedModalTask] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Require 8px movement before drag starts – prevents accidental drags on button clicks
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
    loadTasks();
    loadProjects();
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
    await createTask({
      title,
      description,
      priority: "MEDIUM",
      project_id: selectedProject,
    });
    setTitle("");
    setDescription("");
    await loadTasks();
  };

  const handleDelete = async (id: number) => {
    await deleteTask(id);
    await loadTasks();
  };  

  // Load realistic mock development tasks for testing
  const handleLoadSampleData = async () => {
    if (projects.length === 0) {
      alert("Please create at least one project first before loading sample tasks!");
      return;
    }
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
  };

  const todoTasks = tasks.filter((task) => task.status === "TODO");
  const progressTasks = tasks.filter((task) => task.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((task) => task.status === "DONE");

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

    const droppedColumnStatus = over.id as string; // "TODO" | "IN_PROGRESS" | "DONE"
    const taskId = Number(active.id);
    const task = tasks.find((t) => t.id === taskId);

    if (!task) return;
    if (task.status === droppedColumnStatus) return; // same column, no-op

    handleStatusChange(taskId, droppedColumnStatus);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="max-w-7xl mx-auto"
      >
        {/* Header with Sample Loader */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-5xl font-bold text-slate-900 dark:text-zinc-100">
              Tasks
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-2">
              Manage and track your active workflows on the Kanban Board.
            </p>
          </div>

          <button
            onClick={handleLoadSampleData}
            className="self-start sm:self-center px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:border-violet-500 dark:hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-300 transition duration-200 shadow-2xs hover:shadow-sm"
          >
            Load Sample Data
          </button>
        </div>

        {/* Create Task Form */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 mb-8 shadow-sm text-slate-800 dark:text-zinc-100 transition-colors duration-300">
          <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-zinc-200">
            Create New Task
          </h2>

          <input
            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/10 focus:border-violet-500 dark:focus:border-violet-500 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none transition duration-200"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/10 focus:border-violet-500 dark:focus:border-violet-500 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none transition duration-200"
            rows={4}
            placeholder="Task description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <select
            value={selectedProject || ""}
            onChange={(e) => setSelectedProject(Number(e.target.value))}
            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/10 focus:border-violet-500 dark:focus:border-violet-500 text-slate-800 dark:text-zinc-100 outline-none transition duration-200"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleCreate}
            className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 rounded-lg font-medium focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition duration-200 shadow-sm"
          >
            Create Task
          </button>
        </div>

        {/* Kanban Board – Drag & Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TODO */}
            <DroppableColumn id="TODO" title="TODO" count={todoTasks.length}>
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
            <DroppableColumn id="IN_PROGRESS" title="In Progress" count={progressTasks.length}>
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
            <DroppableColumn id="DONE" title="Done" count={doneTasks.length}>
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

          {/* Drag Overlay – ghost card that follows cursor */}
          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="bg-white dark:bg-zinc-900 border border-violet-500 rounded-xl p-4 w-80 shadow-[0_4px_20px_rgba(139,92,246,0.15)] dark:shadow-zinc-950/80 rotate-[2deg] opacity-95">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-zinc-100">
                  {activeTask.title}
                </h3>
                <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm line-clamp-2">
                  {activeTask.description}
                </p>
                <p className="text-violet-600 dark:text-violet-400 font-medium text-xs mt-2">
                  Project: {getProjectName(activeTask.project_id)}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Task Detail and Discussion Thread Modal */}
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