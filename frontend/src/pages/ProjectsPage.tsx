import { useEffect, useState } from "react";
import {
  getProjects,
  createProject,
  deleteProject,
} from "../services/projectService";
import DashboardLayout from "../layouts/DashboardLayout";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const loadProjects = async () => {
    const data = await getProjects();
    setProjects(data);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async () => {
    await createProject({
      title,
      description,
    });

    setTitle("");
    setDescription("");

    await loadProjects();
  };

  const handleDelete = async (id: number) => {
    await deleteProject(id);
    await loadProjects();
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-zinc-100">
              Projects
            </h1>

            <p className="text-slate-500 dark:text-zinc-400 mt-2">
              Manage your projects
            </p>
          </div>
        </div>

        {/* Create Project Form */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 mb-8 shadow-sm text-slate-800 dark:text-zinc-100 transition-colors duration-300">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-zinc-200 mb-4">
            Create New Project
          </h2>

          <input
            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/10 focus:border-violet-500 dark:focus:border-violet-500 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none transition duration-200"
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-violet-500/20 dark:focus:ring-violet-500/10 focus:border-violet-500 dark:focus:border-violet-500 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none transition duration-200"
            placeholder="Project description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            onClick={handleCreate}
            className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg text-white font-medium transition"
          >
            Create Project
          </button>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:border-violet-500 dark:hover:border-violet-400 transition duration-300"
            >
              <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                {project.title}
              </h3>

              <p className="text-slate-600 dark:text-zinc-400 mt-2">
                {project.description}
              </p>

              <button
                onClick={() => handleDelete(project.id)}
                className="mt-4 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}