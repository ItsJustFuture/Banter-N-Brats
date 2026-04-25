#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(repoRoot, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const scripts = packageJson.scripts || {};

const npmTestScripts = Object.keys(scripts)
  .filter((name) => /^test:/.test(name))
  .sort((a, b) => a.localeCompare(b));

if (!npmTestScripts.length) {
  console.error("[test-runner] No test:* scripts were found in package.json");
  process.exit(1);
}

const scriptCommands = npmTestScripts.map((name) => String(scripts[name] || ""));
const scriptDir = path.join(repoRoot, "scripts");
const discoveredFiles = fs.existsSync(scriptDir)
  ? fs
      .readdirSync(scriptDir)
      .filter((file) => /^test-.*\.js$/i.test(file))
      .map((file) => `scripts/${file}`)
      .sort((a, b) => a.localeCompare(b))
  : [];

const unscriptedFileTests = discoveredFiles.filter((file) => {
  const normalized = file.replace(/\\/g, "/");
  return !scriptCommands.some((command) => command.includes(normalized));
});

const strictMode = process.env.STRICT_TESTS === "1";
const pgRequiredScripts = ["test:couples"];
const missingPgForScripts = pgRequiredScripts.filter((name) => npmTestScripts.includes(name) && !process.env.DATABASE_URL);
if (missingPgForScripts.length) {
  const msg = `[test-runner] Skipping Postgres tests (no DATABASE_URL): ${missingPgForScripts.join(", ")}`;
  if (strictMode) {
    console.error(`${msg}. Set DATABASE_URL or disable STRICT_TESTS.`);
    process.exit(1);
  }
  console.warn(msg);
}

const tmpDir = path.join(repoRoot, ".tmp");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
const sqlitePath = path.join(tmpDir, `test-suite-${Date.now()}.sqlite`);
if (fs.existsSync(sqlitePath)) fs.rmSync(sqlitePath, { force: true });

const testEnv = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || "test",
  LOCAL_DEV: process.env.LOCAL_DEV || "1",
  SESSION_SECRET: process.env.SESSION_SECRET || "local-dev-session-secret",
  CAPTCHA_PROVIDER: "none",
  SQLITE_PATH: process.env.SQLITE_PATH || sqlitePath,
  TEST_MODE: "1",
};

function run(command, args) {
  const printable = [command, ...args].join(" ");
  console.log(`\n[test-runner] ▶ ${printable}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: testEnv,
  });
  if (result.status !== 0) {
    console.error(`[test-runner] ✗ failed: ${printable}`);
    process.exit(result.status || 1);
  }
}

if (strictMode) console.log("[test-runner] strict mode enabled");
console.log(`[test-runner] Running ${npmTestScripts.length} package test scripts...`);
for (const scriptName of npmTestScripts) {
  if (missingPgForScripts.includes(scriptName)) continue;
  run("npm", ["run", scriptName]);
}

if (unscriptedFileTests.length) {
  console.log(`\n[test-runner] Found ${unscriptedFileTests.length} discovered test files not mapped to package scripts.`);
  console.log("[test-runner] Skipping discovered files by default to avoid duplicate or non-CI execution.");
  if (strictMode) {
    console.error("[test-runner] STRICT_TESTS=1 requires discovered files to be mapped or RUN_UNSCRIPTED_TEST_FILES=1.");
    process.exit(1);
  }
  if (process.env.RUN_UNSCRIPTED_TEST_FILES === "1") {
    console.log("[test-runner] RUN_UNSCRIPTED_TEST_FILES=1 set, executing discovered files...");
    for (const file of unscriptedFileTests) {
      run("node", [file]);
    }
  }
}

console.log("\n[test-runner] ✓ all tests passed");
