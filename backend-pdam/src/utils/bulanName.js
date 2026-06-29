export default function getNamaBulan(bulan) {
  const bulanIndonesia = {
    1: "Jan",
    2: "Feb",
    3: "Mar",
    4: "Apr",
    5: "Mei",
    6: "Jun",
    7: "Jul",
    8: "Agu",
    9: "Sep",
    10: "Okt",
    11: "Nov",
    12: "Des",
  };

  return bulanIndonesia[bulan] || "-";
}