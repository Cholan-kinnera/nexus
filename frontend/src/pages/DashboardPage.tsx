import { useEffect, useState } from "react";
import { getProjects } from "../services/projectService";
import DashboardLayout from "../layouts/DashboardLayout";
export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      const data = await getProjects();
      console.log("PROJECTS:", data);
      setProjects(data);
    };

    loadProjects();
  }, []);

  return (
    <DashboardLayout>
  <div className="min-h-screen bg-[#070B1A] text-white p-8">
    
    <div className="mb-10">
      <h1 className="text-4xl font-bold">
        Dashboard
      </h1>

      <p className="text-gray-400 mt-2">
        Manage projects and track progress.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      
      <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800">
        <p className="text-gray-400 text-sm">
          Total Projects
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {projects.length}
        </h2>
      </div>

      <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800">
        <p className="text-gray-400 text-sm">
          Active Projects
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {projects.length}
        </h2>
      </div>

      <div className="bg-[#111827] rounded-2xl p-6 border border-gray-800">
        <p className="text-gray-400 text-sm">
          Completed
        </p>

        <h2 className="text-3xl font-bold mt-2">
          0
        </h2>
      </div>

    </div>

    <div>
      <h2 className="text-2xl font-semibold mb-6">
        Recent Projects
      </h2>

      <div className="grid gap-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-[#111827] border border-gray-800 rounded-2xl p-6 hover:border-violet-500 transition"
          >
            <h3 className="text-xl font-semibold">
              {project.title}
            </h3>

            <p className="text-gray-400 mt-2">
              {project.description}
            </p>
          </div>
        ))}
      </div>
    </div>

  </div>
  </DashboardLayout>
);
}
