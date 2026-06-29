export default function hitungTagihan(pemakaian) {
  const biayaTetap = 3000;

  let total = biayaTetap;

  if (pemakaian <= 0) return total;

  if (pemakaian <= 20) {
    total += pemakaian * 1000;
  } else {
    total += (20 * 1000) + ((pemakaian - 20) * 1200);
  }

  return total;
}