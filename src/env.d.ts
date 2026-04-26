// Header Doc:
// Tujuan: Deklarasi tipe global untuk build Vite/Vue.
// Caller: TypeScript compiler (`vue-tsc`) saat validasi aplikasi.
// Dependensi: Vite client type declarations dan paket font side-effect import.
// Main Functions: Not applicable.
// Side Effects: Tidak ada runtime effect; hanya type declarations.
/// <reference types="vite/client" />

declare module "@fontsource-variable/inter";
