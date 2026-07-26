import axios from "axios";
import { setupApiInterceptors } from "@app/services/apiClientSetup";
import { getApiBaseUrl } from "@app/services/apiClientConfig";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  responseType: "json",
  withCredentials: true,
});

// Setup interceptors (core does nothing, proprietary adds JWT auth)
setupApiInterceptors(apiClient);

// ---------- Install error interceptor ----------
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    return Promise.reject(error);
  },
);

// ---------- Exports ----------
export default apiClient;
