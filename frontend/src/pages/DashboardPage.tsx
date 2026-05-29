import { useEffect, useState } from "react";
import { getProjects } from "../services/projectService";

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
    <div>
      <h1>Dashboard</h1>

      {projects.map((project) => (
        <div key={project.id}>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
}
