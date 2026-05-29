import { useEffect, useState } from "react";
import {
  getProjects,
  createProject,
  deleteProject,
} from "../services/projectService";

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
    <div>
      <h1>Projects</h1>

      <input
        placeholder="Project title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <br />
      <br />

      <textarea
        placeholder="Project description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <br />
      <br />

      <button onClick={handleCreate}>
        Create Project
      </button>

      <hr />

      {projects.map((project) => (
        <div key={project.id}>
          <h3>{project.title}</h3>

          <p>{project.description}</p>

          <button
            onClick={() => handleDelete(project.id)}
          >
            Delete
          </button>

          <hr />
        </div>
      ))}
    </div>
  );
}