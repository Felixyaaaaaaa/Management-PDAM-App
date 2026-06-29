import axios from "axios";

export const api = axios.create({
  // baseURL: "https://tirtowening.my.id/api/" // ganti sesuai backend
  baseURL: "http://localhost:3000/api/" // ganti sesuai backend
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});