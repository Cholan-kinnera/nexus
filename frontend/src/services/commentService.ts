import api from "../api/client";

export interface Comment {
  id: number;
  content: string;
  task_id: number;
  user_id: number;
  created_at: string;
}

export const getComments = async (taskId: number): Promise<Comment[]> => {
  const response = await api.get(`/tasks/${taskId}/comments`);
  return Array.isArray(response.data?.items) ? response.data.items : (Array.isArray(response.data) ? response.data : []);
};

export const createComment = async (taskId: number, content: string): Promise<Comment> => {
  const response = await api.post(`/tasks/${taskId}/comments`, { content });
  return response.data;
};

export const deleteComment = async (commentId: number): Promise<void> => {
  await api.delete(`/comments/${commentId}`);
};
