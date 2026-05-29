import api from "../api/client";

export const getProjects = async () => {
  const response = await api.get("/projects/");
  return response.data;
};

export const getProject = async (id: number) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const createProject = async (data: {
  title: string;
  description?: string;
}) => {
  const response = await api.post("/projects/", data);
  return response.data;
};

export const updateProject = async (
  id: number,
  data: {
    title?: string;
    description?: string;
  }
) => {
  const response = await api.put(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: number) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};