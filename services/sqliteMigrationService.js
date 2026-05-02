"use strict";

const fs = require("fs");
const path = require("path");

function execAsync(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function tableExists(db, tableName) {
  const row = await new Promise((resolve, reject) => {
    db.get("SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1", [tableName], (err, result) => {
      if (err) return reject(err);
      resolve(result || null);
    });
  });
  return Boolean(row);
}

async function columnExists(db, tableName, columnName) {
  const rows = await new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, result) => {
      if (err) return reject(err);
      resolve(result || []);
    });
  });
  return rows.some((row) => row.name === columnName);
}

function splitSqlStatements(sql) {
  return String(sql || "")
    .split(/;\s*(?:\n|$)/g)
    .map((stmt) => stmt.trim())
    .filter(Boolean);
}

async function runSqliteStatementWithCompatibility({ db, sql }) {
  const addColMatch = sql.match(/^ALTER\s+TABLE\s+([`"\[]?[a-zA-Z0-9_]+[`"\]]?)\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+([`"\[]?[a-zA-Z0-9_]+[`"\]]?)\s+(.+)$/i);
  if (addColMatch) {
    const tableName = addColMatch[1].replace(/[`"\[\]]/g, "");
    const columnName = addColMatch[2].replace(/[`"\[\]]/g, "");
    const columnDef = addColMatch[3].trim();
    if (!(await tableExists(db, tableName))) return;
    if (await columnExists(db, tableName, columnName)) return;
    await execAsync(db, `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
    return;
  }

  await execAsync(db, sql);
}

async function applySqliteFileMigrations({ db, run, migrationsDir }) {
  await run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);

  if (!fs.existsSync(migrationsDir)) {
    return { applied: [] };
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const applied = [];
  for (const file of files) {
    const existing = await new Promise((resolve, reject) => {
      db.get(
        "SELECT filename FROM schema_migrations WHERE filename = ? LIMIT 1",
        [file],
        (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        }
      );
    });
    if (existing) continue;

    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");
    await execAsync(db, "BEGIN");
    try {
      const statements = splitSqlStatements(sql);
      for (const statement of statements) {
        await runSqliteStatementWithCompatibility({ db, sql: statement });
      }
      await run(
        "INSERT INTO schema_migrations (filename, applied_at) VALUES (?, ?)",
        [file, Date.now()]
      );
      await execAsync(db, "COMMIT");
      applied.push(file);
    } catch (err) {
      await execAsync(db, "ROLLBACK");
      throw new Error(`Failed applying migration ${file}: ${err.message}`);
    }
  }

  return { applied };
}

module.exports = {
  applySqliteFileMigrations,
};
