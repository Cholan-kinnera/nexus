import api from "../api/client";

export const loginUser = async (
  email: string,
  password: string
) => {
  const response = await api.post(
    "/auth/login",
    {
      email,
      password,
    }
  );

  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const verifyResetOtp = async (email: string, otp: string) => {
  const response = await api.post("/auth/verify-reset-otp", { email, otp });
  return response.data;
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
  const response = await api.post("/auth/reset-password", {
    email,
    otp,
    new_password: newPassword,
  });
  return response.data;
};