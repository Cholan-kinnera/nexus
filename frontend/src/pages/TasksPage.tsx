import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

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
// Droppable Column wrapper
// ---------------------------------------------------------------------------
function DroppableColumn({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-[#0F172A] border rounded-2xl p-4 min-h-[200px] transition-all duration-200 ${
        isOver
          ? "border-violet-500/70 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
          : "border-slate-800"
      }`}
    >
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
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
}: {
  task: any;
  getProjectName: (id: number) => string;
  handleDelete: (id: number) => void;
  handleStatusChange: (id: number, status: string) => void;
  columnStatus: string;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-[#111827] border rounded-xl p-4 mb-4 cursor-grab active:cursor-grabbing select-none transition-shadow duration-200 ${
        isDragging
          ? "border-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.3)]"
          : "border-slate-700 hover:border-slate-600"
      }`}
    >
      <h3 className="font-semibold text-lg">{task.title}</h3>

      <p className="text-slate-400 mt-2">{task.description}</p>

      <p className="text-violet-400 text-sm mt-2">
        Project: {getProjectName(task.project_id)}
      </p>

      <div className="mt-4 flex items-center gap-3">
        {columnStatus === "TODO" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStatusChange(task.id, "IN_PROGRESS");
            }}
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
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
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            Complete
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(task.id);
          }}
          className="text-red-400 hover:text-red-300 text-sm transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export function TasksPage() {

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activeTask, setActiveTask] = useState<any | null>(null);

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

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);


const loadProjects = async () => {
  const data = await getProjects();

  console.log("TASK PAGE PROJECTS:", data);

  setProjects(data);

  if (data.length > 0) {
    setSelectedProject(data[0].id);
  }
};
const getProjectName = (projectId: number) => {
  const project = projects.find((p) => p.id === projectId);
  return project?.title || "Unknown Project";
};
  const handleCreate = async () => {

  if (!selectedProject) {
    alert("Please select a project");
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

  const todoTasks = tasks.filter(
    (task) => task.status === "TODO"
  );

  const progressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  );

  const doneTasks = tasks.filter(
    (task) => task.status === "DONE"
  );

const handleStatusChange = async (
  taskId: number,
  newStatus: string 
) => {
  try {
    await updateTask(taskId, {
      status: newStatus,
    });

    loadTasks();
  } catch (error) {
    console.error(error);
  }
};

  // ---- Drag handlers ----
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
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white">
            Tasks
          </h1>

          <p className="text-slate-400 mt-2">
            Manage and track your work
          </p>
        </div>

        {/* Create Task */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Create New Task
          </h2>

          <input
            className="w-full bg-[#111827] border border-slate-700 rounded-lg p-3 mb-4"
            placeholder="Task title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />

          <textarea
            className="w-full bg-[#111827] border border-slate-700 rounded-lg p-3 mb-4"
            rows={4}
            placeholder="Task description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />
          <select
  value={selectedProject || ""}
  onChange={(e) =>
    setSelectedProject(Number(e.target.value))
  }
  className="w-full bg-[#111827] border border-slate-700 rounded-lg p-3 mb-4"
>
  {projects.map((project) => (
    <option
      key={project.id}
      value={project.id}
    >
      {project.title}
    </option>
  ))}
</select>



          <button
            onClick={handleCreate}
            className="bg-violet-600 hover:bg-violet-500 px-5 py-3 rounded-lg font-medium"
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
            <DroppableColumn id="TODO" title="TODO">
              {todoTasks.map((task) => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  getProjectName={getProjectName}
                  handleDelete={handleDelete}
                  handleStatusChange={handleStatusChange}
                  columnStatus="TODO"
                />
              ))}
            </DroppableColumn>

            {/* IN PROGRESS */}
            <DroppableColumn id="IN_PROGRESS" title="In Progress">
              {progressTasks.map((task) => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  getProjectName={getProjectName}
                  handleDelete={handleDelete}
                  handleStatusChange={handleStatusChange}
                  columnStatus="IN_PROGRESS"
                />
              ))}
            </DroppableColumn>

            {/* DONE */}
            <DroppableColumn id="DONE" title="Done">
              {doneTasks.map((task) => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  getProjectName={getProjectName}
                  handleDelete={handleDelete}
                  handleStatusChange={handleStatusChange}
                  columnStatus="DONE"
                />
              ))}
            </DroppableColumn>

          </div>

          {/* Drag Overlay – ghost card that follows cursor */}
          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="bg-[#111827] border border-violet-500 rounded-xl p-4 w-80 shadow-[0_0_24px_rgba(139,92,246,0.35)] rotate-[2deg] opacity-90">
                <h3 className="font-semibold text-lg text-white">
                  {activeTask.title}
                </h3>
                <p className="text-slate-400 mt-2 text-sm line-clamp-2">
                  {activeTask.description}
                </p>
                <p className="text-violet-400 text-xs mt-2">
                  Project: {getProjectName(activeTask.project_id)}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

      </div>
    </DashboardLayout>
  );
}