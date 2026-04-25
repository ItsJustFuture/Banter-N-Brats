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
      await execAsync(db, sql);
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
