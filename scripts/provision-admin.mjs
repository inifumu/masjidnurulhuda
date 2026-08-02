import { spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

const KNOWN_WEAK = new Set(["admin123", "password", "password123", "qwerty123"]);

export const assertStrongProvisioningPassword = (password) => {
  const value = String(password ?? "");
  const strong = value.length >= 16 && /[a-z]/.test(value) && /[A-Z]/.test(value)
    && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
  if (!strong || KNOWN_WEAK.has(value.trim().toLowerCase())) {
    throw new Error("Password provisioning harus minimal 16 karakter dan memuat huruf kecil, huruf besar, angka, serta simbol; password default/lemah ditolak.");
  }
};

export const normalizeProvisioningInput = ({ email, name, password }) => {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedName = String(name ?? "").trim();
  if (!normalizedName) throw new Error("Nama admin wajib diisi.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("Email admin tidak valid.");
  assertStrongProvisioningPassword(password);
  return { email: normalizedEmail, name: normalizedName, password: String(password) };
};

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;

export const buildProvisioningSql = ({ email, name, passwordHash, replaceExisting }) => {
  if (replaceExisting) {
    return `UPDATE users SET name = ${quote(name)}, password_hash = ${quote(passwordHash)}, role = 'superadmin', operational_role = 'superadmin', is_active = 1, token_version = COALESCE(token_version, 0) + 1 WHERE email = ${quote(email)};`;
  }
  return `INSERT OR IGNORE INTO users (email, password_hash, name, role, operational_role, is_active) VALUES (${quote(email)}, ${quote(passwordHash)}, ${quote(name)}, 'superadmin', 'superadmin', 1);`;
};

const hashPassword = async (password) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const main = async () => {
  const input = normalizeProvisioningInput({
    email: process.env.PROVISION_ADMIN_EMAIL,
    name: process.env.PROVISION_ADMIN_NAME,
    password: process.env.PROVISION_ADMIN_PASSWORD,
  });
  const replaceExisting = process.argv.includes("--replace-existing");
  const remoteTesting = process.argv.includes("--remote-testing");
  const remoteRevamp = process.argv.includes("--remote-revamp");
  const persistIndex = process.argv.indexOf("--persist-to");
  const persistTo = persistIndex >= 0 ? process.argv[persistIndex + 1] : undefined;
  if (persistIndex >= 0 && !persistTo) throw new Error("--persist-to membutuhkan path.");
  if (remoteTesting && remoteRevamp) throw new Error("Pilih tepat satu target remote provisioning.");
  if ((remoteTesting || remoteRevamp) && persistTo) throw new Error("Mode remote tidak dapat digabung dengan --persist-to.");
  const passwordHash = await hashPassword(input.password);
  const sql = buildProvisioningSql({ ...input, passwordHash, replaceExisting });
  const temporaryDirectory = ".wrangler/provision-admin";
  const temporarySqlPath = `${temporaryDirectory}/${randomUUID()}.sql`;
  await mkdir(temporaryDirectory, { recursive: true });
  try {
    await writeFile(temporarySqlPath, sql, { mode: 0o600, flag: "wx" });
    const databaseName = remoteTesting
      ? "masjidnurulhuda-testing-db"
      : remoteRevamp ? "masjidnurulhuda-revamp-db" : "masjidnurulhuda-db";
    const args = ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", databaseName, "--file", temporarySqlPath];
    if (remoteTesting) args.push("--remote", "--config", "wrangler.testing.toml");
    else if (remoteRevamp) args.push("--remote", "--config", "wrangler.revamp.toml");
    else {
      args.push("--local");
      if (persistTo) args.push("--persist-to", persistTo);
    }
    const result = spawnSync(process.execPath, args, { stdio: ["ignore", "inherit", "inherit"] });
    if (result.status !== 0) process.exitCode = result.status ?? 1;
  } finally {
    await rm(temporarySqlPath, { force: true });
  }
  if (process.exitCode) return;
  const target = remoteTesting ? "testing remote" : remoteRevamp ? "revamp remote" : "lokal";
  console.log(replaceExisting ? `Admin ${target} berhasil dipulihkan.` : `Provisioning ${target} selesai (akun existing tidak diubah).`);
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Provisioning gagal.");
    process.exit(1);
  });
}
