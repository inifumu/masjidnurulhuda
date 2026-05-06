/**
 * Tujuan: Helper format/parse mata uang Rupiah untuk input dan tampilan nominal kas.
 * Caller: useKas composable, komponen KasInput/KasProposal, dan unit test currency.
 * Dependensi: Intl.NumberFormat bawaan JavaScript.
 * Main Functions: formatRupiah, formatInputRupiah, parseInputRupiah.
 * Side Effects: Tidak ada (pure functions).
 */

export const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);

export const formatInputRupiah = (val: string | number): string => {
  const clean = String(val).replace(/\D/g, "");
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseInputRupiah = (val: string | number): number => {
  const clean = String(val).replace(/\D/g, "");
  if (!clean) return 0;
  return Number(clean);
};
