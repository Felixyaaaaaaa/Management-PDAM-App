import { api } from "../lib/axios"

type LaporanTagihanParams = {
  bulan: number | string
  tahun: number | string
  status?: string
}

type LaporanPendapatanParams = {
  tahun: number | string
  bulan?: number | string
  mode?: "bulanan" | "tahunan"
}

type LaporanTunggakanParams = {
  bulan?: number | string
  tahun?: number | string
  lebih_dari?: number | string
}

type LaporanLabaRugiParams = {
  bulan?: number | string
  tahun: number | string
}

export const getLaporanDashboard = async (params?: {
  bulan?: number | string
  tahun?: number | string
}) => {
  const res = await api.get("/laporan/dashboard", { params })
  return res.data
}

export const getLaporanTagihan = async (params: LaporanTagihanParams) => {
  const res = await api.get("/laporan/tagihan", { params })
  return res.data
}

export const getLaporanPendapatan = async (params: LaporanPendapatanParams) => {
  const res = await api.get("/laporan/pendapatan", { params })
  return res.data
}

export const getLaporanTunggakan = async (params?: LaporanTunggakanParams) => {
  const res = await api.get("/laporan/tunggakan", { params })
  return res.data
}

export const getLaporanLabaRugi = async (params: LaporanLabaRugiParams) => {
  const res = await api.get("/laporan/laba-rugi", { params })
  return res.data
}
