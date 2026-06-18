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

export interface StorageFile {
  file_key: string;
  filename: string;
  size: number;
  content_type: string;
  url: string;
  updated_at: string;
}

export const getFiles = async (): Promise<StorageFile[]> => {
  const response = await api.get<StorageFile[]>("/storage");
  return response.data;
};

export const deleteFile = async (fileKey: string): Promise<any> => {
  const response = await api.delete(`/storage/delete/${fileKey}`);
  return response.data;
};
