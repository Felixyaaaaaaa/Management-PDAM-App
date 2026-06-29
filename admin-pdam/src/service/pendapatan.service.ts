import { api } from "../lib/axios"

export interface PendapatanPayload {
  tanggal: string
  kategori: string
  deskripsi: string
  jumlah: number
}

export const getPendapatan = async () => {
  const response = await api.get("/pendapatan")
  return response.data
}

export const createPendapatan = async (payload: PendapatanPayload) => {
  const response = await api.post("/pendapatan", payload)
  return response.data
}

export const updatePendapatan = async (
  id: number | string,
  payload: Partial<PendapatanPayload>,
) => {
  const response = await api.put(`/pendapatan/${id}`, payload)
  return response.data
}

export const deletePendapatan = async (id: number | string) => {
  const response = await api.delete(`/pendapatan/${id}`)
  return response.data
}
