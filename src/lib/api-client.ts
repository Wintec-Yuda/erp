import axios from "axios";

/**
 * Shared axios instance for client-side API calls to our own Next.js API
 * routes. Keeps a single place to configure base URL, headers, and
 * response/error interceptors.
 */
export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ?? error.message ?? "Unexpected error";
    return Promise.reject(new Error(message));
  }
);
