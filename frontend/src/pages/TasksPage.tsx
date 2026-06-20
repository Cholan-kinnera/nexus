import { useEffect, useState, useRef } from "react";
import axios from "axios";
import type { AxiosProgressEvent } from "axios";
import {
  getTasks,
  createTask,
  deleteTask,
  updateTask,
  getTaskAttachments,
  uploadTaskAttachment,
  deleteTaskAttachment,
} from "../services/taskService";
import type { TaskAttachment } from "../services/taskService";
import { getComments, createComment } from "../services/commentService";
import { getProjects } from "../services/projectService";
import DashboardLayout from "../layouts/DashboardLayout";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { TasksSkeleton } from "../components/ui/SkeletonLoader";
import { useAuth } from "../hooks/useAuth";
import { getProjectMembers } from "../services/projectMemberService";
import type { ProjectMemberResponse } from "../services/projectMemberService";
import api from "../api/client";
import { PremiumButton } from "../components/ui/PremiumButton";
import { PremiumCard } from "../components/ui/PremiumCard";
import { EmptyState } from "../components/ui/EmptyState";

interface ProjectItem {
  id: number;
  title: string;
  description?: string;
  created_at?: string;
}

interface TaskItem {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  project_id: number;
  due_date?: string;
}

interface UserProfile {
  id: number;
  full_name?: string;
  email: string;
  avatar_url?: string;
  role?: string;
}

interface CommentItem {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  user?: {
    full_name?: string;
    email?: string;
  };
}
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
  Paperclip,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image,
  File,
  Download,
  Trash2,
  Loader2
} from "lucide-react";

// Mock helper to fetch task hours
const getTaskHours = (task: TaskItem) => {
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
  activeTask: TaskItem | null;
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
      className={`bg-zinc-900/25 border rounded-xl p-4 min-h-[380px] transition-all duration-200 flex flex-col ${isOver
        ? "border-zinc-700/80 bg-zinc-900/50 shadow-lg shadow-black/20"
        : "border-zinc-800"
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
            <p className="text-[9px] text-zinc-300 mt-1 max-w-xs leading-relaxed">
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
  task: TaskItem;
  getProjectName: (id: number) => string;
  handleDelete: (id: number) => void;
  handleStatusChange: (id: number, status: string) => void;
  columnStatus: string;
  onCardClick: (task: TaskItem) => void;
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
      className={`bg-zinc-900/50 backdrop-blur-sm border rounded-xl p-5 mb-3 cursor-grab active:cursor-grabbing select-none shadow-sm hover:translate-y-[-2px] hover:shadow-[0_0_15px_rgba(124,58,237,0.04)] hover:border-zinc-700/80 transition-all duration-200 flex flex-col justify-between min-h-[160px] ${isDragging
        ? "border-zinc-600 shadow-2xl"
        : "border-zinc-800"
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
              <PremiumButton
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(task.id, "IN_PROGRESS");
                }}
                className="h-6 text-[10px] px-2.5 font-sans"
              >
                Start
              </PremiumButton>
            )}
            {columnStatus === "IN_PROGRESS" && (
              <PremiumButton
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(task.id, "DONE");
                }}
                className="bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-500 text-white dark:text-white h-6 text-[10px] px-2.5 border-none font-sans"
              >
                Complete
              </PremiumButton>
            )}
          </div>
          <PremiumButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(task.id);
            }}
            className="text-red-400 hover:text-red-350 dark:hover:bg-red-500/10 h-6 px-2 font-mono text-[10px] font-semibold border-none"
          >
            Delete
          </PremiumButton>
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
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  getProjectName: (id: number) => string;
}) {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState<ProjectMemberResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Attachments State
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !task) return;

    const fetchUserAndMembers = async () => {
      try {
        const [meRes, membersData] = await Promise.all([
          api.get("/users/me"),
          getProjectMembers(task.project_id)
        ]);
        setCurrentUser(meRes.data);
        setProjectMembers(membersData);
      } catch (err) {
        console.error("Failed to load user or project members:", err);
      }
    };

    fetchUserAndMembers();
  }, [isOpen, task]);

  useEffect(() => {
    if (!isOpen || !task) return;

    const fetchComments = async () => {
      try {
        const data = await getComments(task.id);
        setComments(data ?? []);
      } catch (err) {
        console.error("Failed to load task comments:", err);
      }
    };

    fetchComments();
  }, [isOpen, task]);

  useEffect(() => {
    if (!isOpen || !task) return;

    const fetchAttachments = async () => {
      try {
        const data = await getTaskAttachments(task.id);
        setAttachments(data ?? []);
      } catch (err) {
        console.error("Failed to load task attachments:", err);
      }
    };

    fetchAttachments();
  }, [isOpen, task]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string, filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) {
      return <Image size={15} className="text-violet-400" />;
    }
    if (mimeType === "application/pdf" || ext === "pdf") {
      return <FileText size={15} className="text-red-400" />;
    }
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      mimeType === "text/csv" ||
      ["xlsx", "csv", "xls"].includes(ext || "")
    ) {
      return <FileSpreadsheet size={15} className="text-emerald-400" />;
    }
    if (
      mimeType === "application/zip" ||
      mimeType === "application/x-zip-compressed" ||
      ext === "zip"
    ) {
      return <FileArchive size={15} className="text-amber-400" />;
    }
    return <File size={15} className="text-zinc-400" />;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Reset states
    setUploadError(null);
    setUploadSuccess(false);
    setIsUploading(true);
    setUploadProgress(0);

    // Front-end size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds the limit of 10 MB.");
      setIsUploading(false);
      return;
    }

    // Front-end extension validation
    const allowedExtensions = ["pdf", "png", "jpg", "jpeg", "gif", "webp", "svg", "zip", "docx", "txt", "xlsx", "csv"];
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExtensions.includes(fileExt)) {
      setUploadError(`File extension '.${fileExt}' is not supported.`);
      setIsUploading(false);
      return;
    }

    try {
      await uploadTaskAttachment(task!.id, file, (progressEvent: AxiosProgressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
        setUploadProgress(percentCompleted);
      });
      setUploadSuccess(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Reload attachments list
      const updated = await getTaskAttachments(task!.id);
      setAttachments(updated ?? []);
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { detail?: string } | undefined;
        const errMsg = responseData?.detail || "Failed to upload file. Please try again.";
        setUploadError(errMsg);
      } else {
        setUploadError("Failed to upload file. Please try again.");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleAttachmentDelete = async (attachmentId: number) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;

    try {
      await deleteTaskAttachment(attachmentId);
      // Reload attachments list
      const updated = await getTaskAttachments(task!.id);
      setAttachments(updated ?? []);
    } catch (err: unknown) {
      console.error("Delete failed:", err);
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { detail?: string } | undefined;
        const errMsg = responseData?.detail || "Failed to delete attachment.";
        alert(errMsg);
      } else {
        alert("Failed to delete attachment.");
      }
    }
  };

  if (!isOpen || !task) return null;

  const currentUserMember = projectMembers.find((m) => m.email === user?.email);
  const currentUserRole = currentUserMember ? currentUserMember.role : "viewer";
  const isViewer = currentUserRole === "viewer";

  // Defensive array derivations to prevent .map() crashes
  const safeComments = Array.isArray(comments) ? comments : [];
  const safeAttachments = Array.isArray(attachments) ? attachments : [];

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isViewer) return;
    setLoading(true);

    try {
      await createComment(task.id, newComment.trim());
      setNewComment("");
      const data = await getComments(task.id);
      setComments(data ?? []);
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert("Failed to post comment. Ensure you have Developer, Manager, or Owner role.");
    } finally {
      setLoading(false);
    }
  };

  const getCommenterInfo = (userId: number) => {
    const member = projectMembers.find((m) => m.user_id === userId);
    if (member) {
      const initials = member.full_name
        ? member.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
        : member.email
          ? member.email.substring(0, 2).toUpperCase()
          : "?";
      return {
        name: member.full_name || member.email || "Unknown Member",
        initials,
        avatar_url: member.avatar_url,
        color: "bg-zinc-950 border border-zinc-800 text-zinc-300",
      };
    }

    if (currentUser && currentUser.id === userId) {
      const initials = currentUser.full_name
        ? currentUser.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
        : currentUser.email
          ? currentUser.email.substring(0, 2).toUpperCase()
          : "?";
      return {
        name: currentUser.full_name || currentUser.email || "You",
        initials,
        avatar_url: currentUser.avatar_url,
        color: "bg-zinc-950 border border-zinc-800 text-zinc-300",
      };
    }

    return {
      name: `User #${userId}`,
      initials: `U${userId}`,
      avatar_url: null,
      color: "bg-zinc-950 border border-zinc-800 text-zinc-300",
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
          className="absolute inset-0 bg-slate-900/15 dark:bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.96, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-zinc-900/80 backdrop-blur-lg border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row text-zinc-200"
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

            <h2 className="text-xl font-bold text-zinc-100 mt-4 leading-tight">
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

            {/* Attachments Panel */}
            <div className="mt-6 pt-4 border-t border-zinc-850">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5 font-bold">
                <Paperclip size={12} className="text-zinc-500" />
                Attachments ({safeAttachments.length})
              </h4>

              {safeAttachments.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {safeAttachments.map((att) => {
                    const timeStr = new Date(att.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    });
                    const isUploader = att.user_id === currentUser?.id;
                    const canDelete = isUploader || !isViewer;

                    return (
                      <div key={att.id} className="flex items-center justify-between bg-zinc-950/40 border border-zinc-800/60 p-3 rounded-xl gap-3 text-xs hover:border-zinc-750 transition duration-150">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0 p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                            {getFileIcon(att.mime_type, att.file_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-300 truncate max-w-[220px]" title={att.file_name}>
                              {att.file_name}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{formatFileSize(att.file_size)}</span>
                              <span className="w-1 h-1 rounded-full bg-zinc-800" />
                              <span className="text-zinc-400">{att.user?.full_name || att.user?.email || "System"}</span>
                              <span className="w-1 h-1 rounded-full bg-zinc-800" />
                              <span>{timeStr}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={att.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download file"
                            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer"
                          >
                            <Download size={14} />
                          </a>
                          {canDelete && (
                            <button
                              onClick={() => handleAttachmentDelete(att.id)}
                              title="Delete attachment"
                              className="text-red-400 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[10px] text-zinc-550 italic font-mono py-2 bg-zinc-950/20 border border-dashed border-zinc-850 rounded-xl text-center p-4">
                  No attachments uploaded yet
                </div>
              )}

              {!isViewer && (
                <div className="mt-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.zip,.docx,.txt,.xlsx,.csv"
                  />
                  
                  {isUploading ? (
                    <div className="space-y-2 bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl">
                      <div className="flex items-center justify-between text-3xs font-mono text-zinc-450">
                        <span className="flex items-center gap-1.5">
                          <Loader2 size={12} className="animate-spin text-violet-400" />
                          Uploading attachment...
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-violet-500 transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-dashed border-zinc-800 hover:border-zinc-700/80 bg-zinc-950/20 hover:bg-zinc-900/10 text-zinc-450 hover:text-zinc-300 py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 text-xs font-mono"
                    >
                      <Paperclip size={13} className="text-zinc-500" />
                      Attach File
                    </button>
                  )}

                  {uploadError && (
                    <p className="text-3xs text-red-400 font-mono mt-2 bg-red-950/10 border border-red-900/30 px-2.5 py-1.5 rounded-lg">
                      ⚠️ {uploadError}
                    </p>
                  )}
                  {uploadSuccess && (
                    <p className="text-3xs text-emerald-400 font-mono mt-2 bg-emerald-950/10 border border-emerald-900/30 px-2.5 py-1.5 rounded-lg">
                      ✓ File attached successfully.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Discussion */}
          <div className="w-full md:w-[400px] flex flex-col h-[45vh] md:h-[500px] bg-zinc-950/30 border-t md:border-t-0 md:border-l border-zinc-850">
            <div className="p-6 pb-4 border-b border-zinc-850">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <MessageSquare size={14} />
                Discussion
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {safeComments.map((comment) => {
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
                  <div key={comment.id} className="flex gap-3 animate-fade-in">
                    {info.avatar_url ? (
                      <img
                        src={info.avatar_url}
                        alt={info.name}
                        className="w-7 h-7 rounded-full shrink-0 object-cover border border-zinc-800"
                      />
                    ) : (
                      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] select-none ${info.color}`}>
                        {info.initials}
                      </div>
                    )}

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

              {safeComments.length === 0 && (
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
                  placeholder={isViewer ? "Viewers cannot post comments" : "Write a comment..."}
                  disabled={isViewer}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 transition duration-200 resize-none h-16 disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || isViewer}
                  className="self-end bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold text-[10px] px-3.5 py-1.5 rounded transition duration-200 shadow-sm cursor-pointer disabled:opacity-60 font-mono disabled:cursor-not-allowed"
                >
                  {isViewer ? "Viewer Role Locked" : (loading ? "Posting..." : "Post Comment")}
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
  const shouldReduceMotion = useReducedMotion();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);

  const [selectedModalTask, setSelectedModalTask] = useState<TaskItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.03,
      },
    },
  };

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 350, damping: 25 },
    },
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data?.items ?? []);
  };

  const loadProjects = async () => {
    const data = await getProjects();
    const projectsList = data?.items ?? [];
    setProjects(projectsList);
    if (projectsList.length > 0) {
      setSelectedProject(projectsList[0].id);
    }
  };

  useEffect(() => {
    // Load tasks and projects synchronously on component mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="relative mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Ambient header glow */}
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="z-10 w-full max-w-5xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-150">
              Tasks
            </h1>
            <p className="text-zinc-300 mt-2 text-sm font-sans max-w-2xl leading-relaxed">
              Manage and track your active workflows on the Kanban Board.
            </p>
          </div>


        </div>

        {/* Create Task Form */}
        <PremiumCard ref={formRef} hoverable={false} className="mb-8 text-zinc-100 transition-colors duration-300">
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

          <PremiumButton
            variant="primary"
            onClick={handleCreate}
          >
            Create Task
          </PremiumButton>
        </PremiumCard>

        {/* ── KANBAN VIEW PORT ─────────────────────────────────────────── */}
        {isLoading ? (
          <TasksSkeleton />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No active tasks configured"
            description="Populate your active boards to organize pipelines, resolve blockers, and calculate story points."
            primaryActionLabel="Add Task"
            onPrimaryAction={scrollToForm}
          />
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
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
                  {todoTasks.map((task) => (
                    <motion.div key={task.id} variants={itemVariants}>
                      <DraggableTaskCard
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
                    </motion.div>
                  ))}
                </motion.div>
              </DroppableColumn>

              {/* IN PROGRESS */}
              <DroppableColumn
                id="IN_PROGRESS"
                title="In Progress"
                count={progressTasks.length}
                totalHours={progressHours}
                activeTask={activeTask}
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
                  {progressTasks.map((task) => (
                    <motion.div key={task.id} variants={itemVariants}>
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
                    </motion.div>
                  ))}
                </motion.div>
              </DroppableColumn>

              {/* DONE */}
              <DroppableColumn
                id="DONE"
                title="Done"
                count={doneTasks.length}
                totalHours={doneHours}
                activeTask={activeTask}
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-3">
                  {doneTasks.map((task) => (
                    <motion.div key={task.id} variants={itemVariants}>
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
                    </motion.div>
                  ))}
                </motion.div>
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
        <ErrorBoundary>
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
        </ErrorBoundary>
      </motion.div>
    </DashboardLayout>
  );
}