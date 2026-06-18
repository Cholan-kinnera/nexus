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

export interface TaskAttachment {
  id: number;
  task_id: number;
  user_id: number | null;
  file_name: string;
  file_key: string;
  file_size: number;
  mime_type: string;
  file_url: string;
  created_at: string;
  user?: {
    id: number;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export const getTaskAttachments = async (taskId: number): Promise<TaskAttachment[]> => {
  const response = await api.get<any>(`/tasks/${taskId}/attachments`);
  const data = response.data;
  return Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
};

export const uploadTaskAttachment = async (
  taskId: number,
  file: File,
  onUploadProgress?: (progressEvent: any) => void
): Promise<TaskAttachment> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<TaskAttachment>(`/tasks/${taskId}/attachments`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });
  return response.data;
};

export const deleteTaskAttachment = async (attachmentId: number): Promise<any> => {
  const response = await api.delete(`/tasks/attachments/${attachmentId}`);
  return response.data;
};