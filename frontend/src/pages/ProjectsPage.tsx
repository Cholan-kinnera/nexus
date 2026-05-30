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
            <h1 className="text-4xl font-bold text-white">
              Projects
            </h1>

            <p className="text-slate-400 mt-2">
              Manage your projects
            </p>
          </div>
        </div>

        {/* Create Project Form */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Create New Project
          </h2>

          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mb-4"
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white mb-4"
            placeholder="Project description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            onClick={handleCreate}
            className="bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-white"
          >
            Create Project
          </button>
        </div>

        {/* Projects List */}
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-[#0F172A] border border-slate-800 rounded-xl p-6"
            >
              <h3 className="text-xl font-semibold text-white">
                {project.title}
              </h3>

              <p className="text-slate-400 mt-2">
                {project.description}
              </p>

              <button
                onClick={() => handleDelete(project.id)}
                className="mt-4 text-red-400 hover:text-red-300"
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