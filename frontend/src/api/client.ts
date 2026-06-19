import axios from "axios";

// Determine API base URL dynamically from Vite environment parameters, ensuring it has the '/api' suffix
const rawBaseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const baseURL = rawBaseURL.endsWith("/api") ? rawBaseURL : `${rawBaseURL}/api`;

const api = axios.create({
  baseURL,
  withCredentials: true, // Auto-send and receive cookies for cross-origin preflights
});

// Request Interceptor: Attach short-lived JWT access token in authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response Interceptor: Catch 401 errors, silently refresh access token, and retry request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Trigger token refresh only on 401 HTTP codes and prevent endless loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      const urlPath = originalRequest.url || "";
      if (urlPath.includes("/auth/login") || urlPath.includes("/auth/refresh") || urlPath.includes("/auth/google")) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Trigger token rotation (cookies automatically sent by browser)
        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.access_token;
        localStorage.setItem("token", newToken);

        // Update headers for retry and future requests
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails (session expired), log out the user
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("hasBooted");
        window.location.href = "/auth";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;