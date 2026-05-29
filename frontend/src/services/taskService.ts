import api from "../api/client";

export const getTasks = async () => {
  const response = await api.get("/tasks/");
  return response.data;
};

export const getTask = async (id: number) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data: {
  title: string;
  description?: string;
  priority?: string;
  project_id: number;
}) => {
  const response = await api.post("/tasks/", data);
  return response.data;
};

export const updateTask = async (
  id: number,
  data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
  }
) => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: number) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const getTasksByProject = async (
  projectId: number
) => {
  const response = await api.get(
    `/tasks/project/${projectId}`
  );

  return response.data;
};