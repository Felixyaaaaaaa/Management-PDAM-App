import { api } from "../lib/axios"; // sesuaikan path

export const getTagihan = async () => {
  const res = await api.get("/tagihan");
  return res.data.data;
};

export const updateTagihan = async (
  id: number,
  total_tagihan: number
) => {
  return api.put(`/tagihan/${id}`, {
    total_tagihan,
  });
};