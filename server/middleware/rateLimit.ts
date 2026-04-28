import type { Context } from "hono";

// Menyimpan data memori dengan Key = "IP:Email"
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

const MAX_ATTEMPTS = 5; // Maksimal 5x percobaan gagal
const WINDOW_MS = 15 * 60 * 1000; // Waktu blokir: 15 Menit

// Helper untuk mengambil IP dan membuat Key
const getClientIp = (c: Context) =>
  c.req.header("cf-connecting-ip") || "unknown-ip";
const getKey = (ip: string, email: string) => `${ip}:${email.toLowerCase()}`;

// 🛡️ 1. Fungsi untuk Mengecek Apakah Boleh Login
export const checkLoginRateLimit = (c: Context, email: string) => {
  const ip = getClientIp(c);
  const key = getKey(ip, email);
  const now = Date.now();
  const record = rateLimitCache.get(key);

  if (record && now < record.resetTime && record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    c.header("Retry-After", String(retryAfterSeconds)); // Beritahu browser kapan boleh coba lagi

    return {
      allowed: false,
      message: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${Math.ceil(retryAfterSeconds / 60)} menit.`,
    };
  }
  return { allowed: true };
};

// 🔴 2. Fungsi untuk Mencatat Jika Password Salah
export const recordFailedLogin = (c: Context, email: string) => {
  const ip = getClientIp(c);
  const key = getKey(ip, email);
  const now = Date.now();
  const record = rateLimitCache.get(key);

  if (record && now < record.resetTime) {
    record.count += 1;
  } else {
    rateLimitCache.set(key, { count: 1, resetTime: now + WINDOW_MS });
  }

  // --- Garbage Collection Sederhana ---
  if (Math.random() < 0.05) {
    for (const [k, v] of rateLimitCache.entries()) {
      if (now > v.resetTime) rateLimitCache.delete(k);
    }
  }
};

// 🟢 3. Fungsi untuk Menghapus Dosa (Jika Login Berhasil)
export const clearLoginAttempts = (c: Context, email: string) => {
  const ip = getClientIp(c);
  const key = getKey(ip, email);
  rateLimitCache.delete(key);
};
