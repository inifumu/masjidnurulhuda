import test from "node:test";
import assert from "node:assert/strict";
import { parseDirectTransaction, parseProposalTransaction } from "../shared/contracts/index.ts";

const valid = { tipe:"pemasukan", jumlah:1000, keperluan:"Infak Jumat", keterangan:"", tanggal:"2026-07-13", kategori_id:1, metode:"kas_langsung" };
test("direct parser menormalisasi DTO tervalidasi",()=>assert.deepEqual(parseDirectTransaction(valid),{ok:true,value:{...valid,seksi_id:null}}));
test("direct parser mengembalikan field errors",()=>{const r=parseDirectTransaction({...valid,jumlah:0,keperluan:""});assert.equal(r.ok,false);assert.ok(r.fields.jumlah);assert.ok(r.fields.keperluan)});
test("proposal mewajibkan seksi dan detail",()=>{const r=parseProposalTransaction({...valid,tipe:"pengeluaran"});assert.equal(r.ok,false);assert.ok(r.fields.seksi_id);assert.ok(r.fields.keterangan)});
