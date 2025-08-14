import { BaseUrl } from "@/constant";
import axios from "axios";

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: BaseUrl,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const NetworkServices = () => {
  // Request interceptor - Add token to headers
  axiosInstance.interceptors.request.use(
    (config) => {
      // Exclude certain URLs from authentication headers
      const excludedUrls = [
        "/api/auth/refresh",
        "/api/auth/login",
        "/api/auth/register",
      ];

      const shouldExclude = excludedUrls.some((url) => 
        config.url?.includes(url)
      );

      if (!shouldExclude) {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle token refresh
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue the request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          const response = await axios.post(`${BaseUrl}/api/auth/refresh`, {
            refreshToken,
          });

          if (response.data?.data) {
            const { accessToken, user } = response.data.data;
            
            // Update localStorage
            localStorage.setItem("token", accessToken);
            localStorage.setItem("user", JSON.stringify(user));
            
            // Update default headers
            axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
            
            // Process queued requests
            processQueue(null, accessToken);
            
            // Retry original request
            originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Token refresh failed - logout user
          processQueue(refreshError, null);
          
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("refreshToken");
          
          // Redirect to login
          window.location.replace("/login");
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Handle 403 forbidden errors
      if (error.response?.status === 403) {
        if (error.response?.data?.message === "Unauthorized: Invalid token.") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("refreshToken");
          window.location.replace("/login");
        }
      }

      return Promise.reject(error);
    }
  );
};

// Initialize interceptors
NetworkServices();

export default axiosInstance;