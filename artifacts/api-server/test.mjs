import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(artifactDir, ".test-dist");
const outputFile = path.join(outputDir, "primevora.test.cjs");

try {
  await rm(outputDir, { recursive: true, force: true });
  await build({
    entryPoints: [path.join(artifactDir, "src/routes/primevora.test.ts")],
    bundle: true,
    format: "cjs",
    platform: "node",
    external: ["esbuild"],
    outfile: outputFile,
    sourcemap: "inline",
    logLevel: "warning",
  });

  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--test", outputFile], {
      cwd: artifactDir,
      env: { ...process.env, NODE_ENV: "test" },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });

  process.exitCode = exitCode;
} finally {
  await rm(outputDir, { recursive: true, force: true });
}