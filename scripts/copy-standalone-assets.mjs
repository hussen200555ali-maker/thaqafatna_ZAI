import { cpSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const assets = [
  [".next/static", ".next/standalone/.next/static"],
  ["public", ".next/standalone/public"],
];

for (const [source, destination] of assets) {
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
}
