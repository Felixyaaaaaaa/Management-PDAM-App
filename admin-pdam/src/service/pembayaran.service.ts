import { api } from "../lib/axios"; // sesuaikan path

export const bayarTagihan = async (
  tagihan_id: number,
  jumlah_bayar: number,
  metode: string
) => {
  return api.post("/pembayaran", {
    tagihan_id,
    jumlah_bayar,
    metode,
  });
};