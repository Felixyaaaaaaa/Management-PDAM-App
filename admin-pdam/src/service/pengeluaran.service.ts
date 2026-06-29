import { api } from "../lib/axios"

export interface PengeluaranPayload {
  tanggal: string
  kategori: string
  deskripsi: string
  jumlah: number
}

export const getPengeluaran = async () => {
  const response = await api.get("/pengeluaran")
  return response.data
}

export const createPengeluaran = async (payload: PengeluaranPayload) => {
  const response = await api.post("/pengeluaran", payload)
  return response.data
}

export const updatePengeluaran = async (
  id: number | string,
  payload: Partial<PengeluaranPayload>,
) => {
  const response = await api.put(`/pengeluaran/${id}`, payload)
  return response.data
}

export const deletePengeluaran = async (id: number | string) => {
  const response = await api.delete(`/pengeluaran/${id}`)
  return response.data
}
