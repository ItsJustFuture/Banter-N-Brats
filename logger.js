"use strict";

function formatMeta(meta) {
  if (!meta) return "";
  if (meta instanceof Error) {
    return `${meta.name}: ${meta.message}`;
  }
  try {
    return JSON.stringify(meta);
  } catch (_err) {
    return String(meta);
  }
}

function write(level, message, meta) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level.toUpperCase()}] ${message}${meta ? ` ${formatMeta(meta)}` : ""}`;
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

const logger = {
  info(message, meta) {
    write("info", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  error(message, meta) {
    write("error", message, meta);
  },
};

module.exports = logger;
