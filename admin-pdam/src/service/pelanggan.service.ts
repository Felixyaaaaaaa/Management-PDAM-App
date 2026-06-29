import { api } from "../lib/axios"

export interface Pelanggan {
  id?: number
  kode_pelanggan: string
  nama: string
  alamat: string
  no_hp: string
  nomor_meter: string
  status: string
  note: string
  created_at?: string
  updated_at?: string
}

export const getPelanggan = async () => {
  const response = await api.get("/pelanggan")
  return response.data
}

export const getPelangganById = async (id: number | string) => {
  const response = await api.get(`/pelanggan/${id}`)
  return response.data
}

export const createPelanggan = async (payload: Pelanggan) => {
  const response = await api.post("/pelanggan", payload)
  return response.data
}

export const updatePelanggan = async (
  id: number | string,
  payload: Partial<Pelanggan>
) => {
  const response = await api.put(`/pelanggan/${id}`, payload)
  return response.data
}

export const deletePelanggan = async (id: number | string) => {
  const response = await api.delete(`/pelanggan/${id}`)
  return response.data
}

export const resetMeterPelanggan = async (id: number | string) => {
  const response = await api.put(`/pelanggan/${id}/reset-meter`)
  return response.data
}
