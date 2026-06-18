import api from "../api/client";

export interface UserProfileResponse {
  id: number;
  full_name: string | null;
  name: string | null;
  email: string;
  role: string | null;
  created_at: string | null;
  avatar_url: string | null;
}

export const getMe = async (): Promise<UserProfileResponse> => {
  const response = await api.get<UserProfileResponse>("/users/me");
  return response.data;
};

export const updateProfile = async (data: { name: string }): Promise<UserProfileResponse> => {
  const response = await api.put<UserProfileResponse>("/users/me", data);
  return response.data;
};

export const updateAvatar = async (file: File): Promise<{ avatar_url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await api.post<{ avatar_url: string }>("/users/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
