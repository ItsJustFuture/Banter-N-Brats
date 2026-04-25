"use strict";

function resolveDbStrategy({ hasDatabaseUrl }) {
  return hasDatabaseUrl ? "postgres" : "sqlite";
}

async function validateStartupConnection({ strategy, pgPool, sqliteQuery }) {
  if (strategy === "postgres") {
    if (!pgPool) {
      throw new Error("Postgres strategy selected but pgPool is not configured.");
    }
    await pgPool.query("SELECT 1");
    return;
  }

  if (typeof sqliteQuery !== "function") {
    throw new Error("SQLite strategy selected but sqliteQuery helper is missing.");
  }
  await sqliteQuery("SELECT 1");
}

module.exports = {
  resolveDbStrategy,
  validateStartupConnection,
};
