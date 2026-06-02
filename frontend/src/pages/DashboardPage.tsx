import { useEffect, useState } from "react";
import { getProjects } from "../services/projectService";
import { getTasks } from "../services/taskService";
import DashboardLayout from "../layouts/DashboardLayout";
export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      const data = await getProjects();
      console.log("PROJECTS:", data);
      setProjects(data);
    };

    const loadTasks = async () => {
      const data = await getTasks();
      setTasks(data);
    };

    loadProjects();
    loadTasks();
  }, []);
const totalProjects = projects.length;

const totalTasks = tasks.length;

const completedTasks = tasks.filter(
  (task) => task.status === "DONE"
).length;

const todoTasks = tasks.filter(
  (task) => task.status === "TODO"
).length;
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm transition-colors duration-300">
          <h3 className="text-slate-500 dark:text-zinc-400 font-medium">Projects</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
            {totalProjects}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm transition-colors duration-300">
          <h3 className="text-slate-500 dark:text-zinc-400 font-medium">Tasks</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
            {totalTasks}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm transition-colors duration-300">
          <h3 className="text-slate-500 dark:text-zinc-400 font-medium">Todo</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
            {todoTasks}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm transition-colors duration-300">
          <h3 className="text-slate-500 dark:text-zinc-400 font-medium">Done</h3>
          <p className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
            {completedTasks}
          </p>
        </div>

      </div>

      <div className="py-4 text-slate-800 dark:text-zinc-300">
        
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-zinc-100">
            Dashboard
          </h1>

          <p className="text-slate-500 dark:text-zinc-400 mt-2">
            Manage projects and track progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors duration-300">
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">
              Total Projects
            </p>

            <h2 className="text-3xl font-bold mt-2 text-slate-900 dark:text-zinc-100">
              {projects.length}
            </h2>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors duration-300">
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">
              Active Projects
            </p>

            <h2 className="text-3xl font-bold mt-2 text-slate-900 dark:text-zinc-100">
              {projects.length}
            </h2>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-slate-200 dark:border-zinc-800 shadow-sm transition-colors duration-300">
            <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">
              Completed
            </p>

            <h2 className="text-3xl font-bold mt-2 text-slate-900 dark:text-zinc-100">
              0
            </h2>
          </div>

        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-zinc-100">
            Recent Projects
          </h2>

          <div className="grid gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-violet-500 dark:hover:border-violet-400 hover:shadow-md dark:hover:shadow-zinc-950/50 transition duration-300"
              >
                <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                  {project.title}
                </h3>

                <p className="text-slate-600 dark:text-zinc-400 mt-2">
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
