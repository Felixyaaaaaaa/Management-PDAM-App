import { api } from "../lib/axios";

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export const getUsers = async () => {
  const response = await api.get("/auth/users");
  return response.data;
};

export const getUserById = async (id: number | string) => {
  const response = await api.get(`/auth/users/${id}`);
  return response.data;
};

export const createUser = async (payload: CreateUserPayload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

export const updateUser = async (id: number | string, payload: UpdateUserPayload) => {
  const response = await api.put(`/auth/users/${id}`, payload);
  return response.data;
};

export const deleteUser = async (id: number | string) => {
  const response = await api.delete(`/auth/users/${id}`);
  return response.data;
};
