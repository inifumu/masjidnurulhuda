<script setup lang="ts">
import FunctionalCashForm from '@/components/admin/FunctionalCashForm.vue';
import FunctionalTransactions from '@/components/admin/FunctionalTransactions.vue';
</script>
<template><section><h1>Proposal</h1><p>Ajukan dana untuk seksi. Pengajuan ditinjau ketua, lalu bendahara.</p><details><summary>Ajukan proposal baru</summary><FunctionalCashForm proposal /></details><h2>Status pengajuan</h2><p>Pengajuan menunggu dan ditolak pada periode terpilih. Proposal yang sudah dicairkan tersedia di Transaksi.</p><FunctionalTransactions mode="proposals" /></section></template>
