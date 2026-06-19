import api from "../api/client";

export interface ProjectMemberResponse {
  id: number;
  user_id: number;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
  role: string;
  joined_at: string;
  invited_by: number | null;
}

export const getProjectMembers = async (projectId: number): Promise<ProjectMemberResponse[]> => {
  const response = await api.get(`/projects/${projectId}/members`);
  return response.data;
};

export const addProjectMember = async (
  projectId: number,
  userId: number,
  role: string
): Promise<ProjectMemberResponse> => {
  const response = await api.post(`/projects/${projectId}/members`, {
    user_id: userId,
    role,
  });
  return response.data;
};

export const updateProjectMemberRole = async (
  projectId: number,
  userId: number,
  role: string
): Promise<ProjectMemberResponse> => {
  const response = await api.patch(`/projects/${projectId}/members/${userId}`, {
    role,
  });
  return response.data;
};

export const removeProjectMember = async (
  projectId: number,
  userId: number
): Promise<{ message: string }> => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data;
};

export const lookupUserByEmail = async (
  email: string
): Promise<{ id: number; email: string; full_name: string | null; role: string | null }> => {
  const response = await api.get(`/users/lookup`, {
    params: { email },
  });
  return response.data;
};
