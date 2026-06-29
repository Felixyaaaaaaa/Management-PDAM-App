import { api } from "../lib/axios"

export interface KasKonsumenPayload {
  tanggal: string
  jenis: "masuk" | "keluar"
  kategori: string
  deskripsi: string
  jumlah: number
}

export const getKasKonsumen = async () => {
  const response = await api.get("/kas-konsumen")
  return response.data
}

export const getKasKonsumenById = async (id: number | string) => {
  const response = await api.get(`/kas-konsumen?id=${id}`)
  return response.data
}

export const createKasKonsumen = async (payload: KasKonsumenPayload) => {
  const response = await api.post("/kas-konsumen", payload)
  return response.data
}

export const updateKasKonsumen = async (
  id: number | string,
  payload: Partial<KasKonsumenPayload>,
) => {
  const response = await api.put(`/kas-konsumen/${id}`, payload)
  return response.data
}

export const deleteKasKonsumen = async (id: number | string) => {
  const response = await api.delete(`/kas-konsumen/${id}`)
  return response.data
}

export const getKasKonsumenDashboard = async () => {
  const response = await api.get("/kas-konsumen/dashboard")
  return response.data
}
