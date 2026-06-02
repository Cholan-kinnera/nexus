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
export function TasksPage() {

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");


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

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* TODO */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">
              TODO
            </h2>

            {todoTasks.map((task) => (
              <div
                key={task.id}
                className="bg-[#111827] border border-slate-700 rounded-xl p-4 mb-4"
              >
                <h3 className="font-semibold text-lg">
  {task.title}
</h3>

<p className="text-slate-400 mt-2">
  {task.description}
</p>

<p className="text-violet-400 text-sm mt-2">
  Project: {getProjectName(task.project_id)}
</p>

<button
  onClick={() =>
    handleDelete(task.id)
  }
  className="mt-4 text-red-400"
>
  Delete
</button>
              </div>
            ))}
          </div>

          {/* IN PROGRESS */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">
              In Progress
            </h2>

            {progressTasks.map((task) => (
              <div
                key={task.id}
                className="bg-[#111827] border border-slate-700 rounded-xl p-4 mb-4"
              >
                <h3 className="font-semibold text-lg">
                  {task.title}
                </h3>

                <p className="text-slate-400 mt-2">
                  {task.description}
                </p>
                <p className="text-violet-400 text-sm mt-2">
  Project: {getProjectName(task.project_id)}
</p>

                <button
                  onClick={() =>
                    handleDelete(task.id)
                  }
                  className="mt-4 text-red-400"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          {/* DONE */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">
              Done
            </h2>

            {doneTasks.map((task) => (
              <div
                key={task.id}
                className="bg-[#111827] border border-slate-700 rounded-xl p-4 mb-4"
              >
                <h3 className="font-semibold text-lg">
                  {task.title}
                </h3>

                <p className="text-slate-400 mt-2">
                  {task.description}
                </p>
                <p className="text-violet-400 text-sm mt-2">
  Project: {getProjectName(task.project_id)}
</p>

                <button
                  onClick={() =>
                    handleDelete(task.id)
                  }
                  className="mt-4 text-red-400"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}