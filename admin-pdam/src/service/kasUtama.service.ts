import { api } from "../lib/axios"

export interface KasUtamaPayload {
  tanggal: string
  jenis: "masuk" | "keluar"
  kategori: string
  deskripsi: string
  jumlah: number
}

export const getKasUtama = async () => {
  const response = await api.get("/kas-utama")
  return response.data
}

export const getKasUtamaById = async (id: number | string) => {
  const response = await api.get(`/kas-utama?id=${id}`)
  return response.data
}

export const createKasUtama = async (payload: KasUtamaPayload) => {
  const response = await api.post("/kas-utama", payload)
  return response.data
}

export const updateKasUtama = async (
  id: number | string,
  payload: Partial<KasUtamaPayload>,
) => {
  const response = await api.put(`/kas-utama/${id}`, payload)
  return response.data
}

export const deleteKasUtama = async (id: number | string) => {
  const response = await api.delete(`/kas-utama/${id}`)
  return response.data
}

export const getKasUtamaDashboard = async () => {
  const response = await api.get("/kas-utama/dashboard")
  return response.data
}
