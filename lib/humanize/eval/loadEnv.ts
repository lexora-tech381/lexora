import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

export function loadEvalEnvFiles(rootDir: string) {
  const candidates = [
    path.join(rootDir, "app", ".env.local"),
    path.join(rootDir, ".env.local"),
    path.join(rootDir, ".env"),
  ];

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}
