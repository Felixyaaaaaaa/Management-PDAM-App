import { api } from "../lib/axios"

// GET ALL
export const getPencatatan = async () => {
  const res = await api.get("/pencatatan")
  return res.data
}

// GET BY ID
export const getPencatatanById = async (id: number) => {
  const res = await api.get(`/pencatatan/${id}`)
  return res.data
}

// GENERATE BULAN & TAHUN
export const generatePencatatan = async (
  bulan: number,
  tahun: number
) => {
  const res = await api.post("/pencatatan/generate", {
    bulan,
    tahun,
  })
  return res.data
}

// UPDATE METER AKHIR
export const updateMeter = async (
  id: number,
  meter_akhir: number
) => {
  const res = await api.put(
    `/pencatatan/${id}/update-meter`,
    {
      meter_akhir,
    }
  )

  return res.data
}