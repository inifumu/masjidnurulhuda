import { Hono } from "hono";

// Import semua router spesifik
import kasApi from "./kas";
import jadwalApi from "./jadwal";
// import seksiApi from "./seksi"; // Buka komentar ini jika seksi.ts sudah siap
// import galeriApi from "./galeri";

const api = new Hono();

// Daftarkan routing (semua akan memiliki prefix /api/public/...)
api.route("/kas", kasApi);
api.route("/jadwal", jadwalApi);
// api.route("/seksi", seksiApi);
// api.route("/galeri", galeriApi);

export default api;
