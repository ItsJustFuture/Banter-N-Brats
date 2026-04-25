"use strict";

const express = require("express");

function createHealthRoutes(getDbBackend) {
  const router = express.Router();
  router.get("/health", (_req, res) => {
    res.json({ status: "ok", db: getDbBackend() });
  });
  return router;
}

module.exports = {
  createHealthRoutes,
};
