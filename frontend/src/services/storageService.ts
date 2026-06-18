import api from "../api/client";

export interface StorageUploadResponse {
  file_key: string;
  url: string;
  filename: string;
  content_type: string;
}

export const uploadFile = async (file: File): Promise<StorageUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<StorageUploadResponse>("/storage/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
