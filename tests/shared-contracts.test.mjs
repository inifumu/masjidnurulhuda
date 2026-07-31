import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_ROLES, TRANSACTION_TYPES, TRANSACTION_STATUSES, APPROVAL_ACTIONS, CATEGORY_FLOWS, isAdminRole, parseBusinessPeriod, parseDirectTransaction, parseProposalTransaction } from "../shared/contracts/index.ts";

test("shared literals menjadi sumber enum operasional", () => {
  assert.deepEqual(ADMIN_ROLES, ["superadmin", "ketua", "bendahara", "pengurus"]);
  assert.deepEqual(TRANSACTION_TYPES, ["pemasukan", "pengeluaran"]);
  assert.deepEqual(TRANSACTION_STATUSES, ["pending_ketua", "pending_bendahara", "approved", "rejected", "void"]);
  assert.deepEqual(APPROVAL_ACTIONS, ["approve", "reject"]);
  assert.deepEqual(CATEGORY_FLOWS, ["pemasukan", "pengeluaran", "general"]);
  assert.equal(isAdminRole("bendahara"), true);
  assert.equal(isAdminRole("owner"), false);
});

test("business period tervalidasi sebagai discriminated result", () => {
  assert.deepEqual(parseBusinessPeriod("7", "2026"), { ok: true, value: { month: 7, year: 2026 } });
  assert.deepEqual(parseBusinessPeriod("13", "2026"), { ok: false, fields: { month: "Bulan harus antara 1 dan 12." } });
  assert.deepEqual(parseBusinessPeriod("7", undefined), { ok: false, fields: { year: "Bulan dan tahun harus dikirim bersamaan." } });
});

const baseTransaction = {
  tipe: "pemasukan",
  jumlah: 125000,
  keperluan: "Infak Jumat",
  keterangan: "",
  tanggal: "2026-07-17",
  kategori_id: 1,
  seksi_id: null,
  metode: "kas_langsung",
};

test("direct mewajibkan keperluan tetapi menerima keterangan kosong", () => {
  const missing = parseDirectTransaction({ ...baseTransaction, keperluan: "" });
  assert.equal(missing.ok, false);
  assert.equal(missing.fields.keperluan, "Keperluan wajib diisi 5-120 karakter.");

  assert.deepEqual(parseDirectTransaction({ ...baseTransaction, keperluan: "  Infak Jumat  ", keterangan: "   " }), {
    ok: true,
    value: { ...baseTransaction, keperluan: "Infak Jumat", keterangan: "" },
  });
});

test("proposal mewajibkan uraian 10-2000 karakter dan seksi", () => {
  const short = parseProposalTransaction({ ...baseTransaction, seksi_id: 2, keterangan: "pendek" });
  assert.equal(short.ok, false);
  assert.equal(short.fields.keterangan, "Keterangan proposal wajib diisi 10-2000 karakter.");

  const valid = parseProposalTransaction({ ...baseTransaction, seksi_id: 2, keterangan: "  Rincian penggunaan dana kegiatan  " });
  assert.equal(valid.ok, true);
  assert.equal(valid.value.keterangan, "Rincian penggunaan dana kegiatan");
});

test("parser mengunci batas exact dan field error machine-readable", () => {
  assert.equal(parseDirectTransaction({ ...baseTransaction, keperluan: "1234" }).ok, false);
  assert.equal(parseDirectTransaction({ ...baseTransaction, keperluan: "x".repeat(120), keterangan: "x".repeat(1000) }).ok, true);
  const tooLong = parseDirectTransaction({ ...baseTransaction, keperluan: "x".repeat(121), keterangan: "x".repeat(1001) });
  assert.equal(tooLong.ok, false);
  assert.deepEqual(Object.keys(tooLong.fields).sort(), ["keperluan", "keterangan"]);
  assert.equal(parseProposalTransaction({ ...baseTransaction, seksi_id: 2, keterangan: "x".repeat(2000) }).ok, true);
  assert.equal(parseProposalTransaction({ ...baseTransaction, seksi_id: 2, keterangan: "x".repeat(2001) }).ok, false);
});
