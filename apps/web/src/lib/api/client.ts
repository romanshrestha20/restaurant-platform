import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "./config";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshRequest: Promise<void> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status !== 401 || !request || request._retry || request.url === "/auth/refresh") {
      return Promise.reject(error);
    }

    request._retry = true;
    refreshRequest ??= apiClient.post("/auth/refresh").then(() => undefined).finally(() => {
      refreshRequest = null;
    });

    try {
      await refreshRequest;
      return apiClient(request);
    } catch {
      return Promise.reject(error);
    }
  },
);

export { apiClient };
export default apiClient;
