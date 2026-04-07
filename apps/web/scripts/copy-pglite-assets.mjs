import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const projectRoot = path.resolve(__dirname, "..");
const outDir = path.resolve(projectRoot, "dist-scripts");

const pgliteDist = path.resolve(
  projectRoot,
  "../../node_modules/@electric-sql/pglite/dist"
);

const pgliteLegacyDist = path.resolve(
  projectRoot,
  "../../node_modules/@electric-sql/pglite-legacy/dist"
);

await mkdir(outDir, { recursive: true });

// New PGlite 0.4.x assets
for (const f of ["pglite.data", "pglite.wasm", "initdb.wasm"]) {
  await copyFile(path.join(pgliteDist, f), path.join(outDir, f));
  console.log(`[copy] ${f} -> dist-scripts/${f}`);
}

// Legacy PGlite 0.2.x assets (needed for PG 16 -> 17 data migration)
for (const f of ["postgres.data", "postgres.wasm"]) {
  await copyFile(path.join(pgliteLegacyDist, f), path.join(outDir, f));
  console.log(`[copy legacy] ${f} -> dist-scripts/${f}`);
}
