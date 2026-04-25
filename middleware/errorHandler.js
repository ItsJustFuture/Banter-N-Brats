"use strict";

const logger = require("../logger");

function errorHandler(err, req, res, _next) {
  logger.error("[http] unhandled error", { method: req.method, path: req.originalUrl, err });
  if (res.headersSent) return;
  const status = Number(err?.status || err?.statusCode) || 500;
  const safeMessage =
    status >= 500
      ? "Internal server error."
      : err?.publicMessage || err?.message || "Request failed.";
  res.status(status).json({ message: safeMessage, error: { message: safeMessage } });
}

module.exports = {
  errorHandler,
};
