import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDb<T>(filename: string, defaultValue: T): T {
  ensureDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, "utf-8");
      return JSON.parse(raw) as T;
    }
  } catch (e) {
    console.error(`[db] Error reading ${filename}:`, e);
  }
  writeDb(filename, defaultValue);
  return defaultValue;
}

export function writeDb<T>(filename: string, data: T): void {
  ensureDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error(`[db] Error writing ${filename}:`, e);
  }
}
