import { useEffect, useState } from "react";
import {
  getTasks,
  createTask,
  deleteTask,
} from "../services/taskService";
import DashboardLayout from "../layouts/DashboardLayout";
export  function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreate = async () => {
    await createTask({
      title,
      description,
      priority: "MEDIUM",
      project_id: 11,
    });

    setTitle("");
    setDescription("");

    await loadTasks();
  };

  const handleDelete = async (id: number) => {
    await deleteTask(id);
    await loadTasks();
  };

  return (
    <DashboardLayout>
      <div>
        <h1>Tasks</h1>

      <input
        placeholder="Task title"
        value={title}
        onChange={(e) =>
          setTitle(e.target.value)
        }
      />

      <br />
      <br />

      <textarea
        placeholder="Task description"
        value={description}
        onChange={(e) =>
          setDescription(e.target.value)
        }
      />

      <br />
      <br />

      <button onClick={handleCreate}>
        Create Task
      </button>

      <hr />

      {tasks.map((task) => (
        <div key={task.id}>
          <h3>{task.title}</h3>

          <p>{task.description}</p>

          <p>Status: {task.status}</p>

          <p>Priority: {task.priority}</p>

          <button
            onClick={() =>
              handleDelete(task.id)
            }
          >
            Delete
          </button>

          <hr />
        </div>
      ))}
    </div>
    </DashboardLayout>
  );
}