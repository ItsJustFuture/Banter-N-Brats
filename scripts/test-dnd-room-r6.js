#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

console.log("🧪 Testing DnD room R6 integration...\n");

const appJsPath = path.join(__dirname, "../public/app.js");
const serverJsPath = path.join(__dirname, "../server.js");
const indexHtmlPath = path.join(__dirname, "../public/index.html");
const migrationPath = path.join(__dirname, "../migrations/20260206_dnd_room_r6.sql");

const appJs = fs.readFileSync(appJsPath, "utf8");
const serverJs = fs.readFileSync(serverJsPath, "utf8");
const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
const migrationSql = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, "utf8") : "";

let normalizeRoomCodeWorks = false;
const normalizeRoomKeyMatch = appJs.match(/function\s+normalizeRoomKey\s*\([^)]*\)\s*\{[\s\S]*?\n\}/);
const roomCodePatternMatch = appJs.match(/const\s+ROOM_CODE_PATTERN\s*=\s*[^;]+;/);
const roomCodeFromNormalizedMatch = appJs.match(/function\s+roomCodeFromNormalized\s*\([^)]*\)\s*\{[\s\S]*?\n\}/);
const normalizeRoomCodeMatch = appJs.match(/function\s+normalizeRoomCode\s*\([^)]*\)\s*\{[\s\S]*?\n\}/);
const normalizeRoomCodeDefined = Boolean(
  normalizeRoomKeyMatch && roomCodePatternMatch && roomCodeFromNormalizedMatch && normalizeRoomCodeMatch
);
if (normalizeRoomCodeDefined) {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(
    `${normalizeRoomKeyMatch[0]}\n${roomCodePatternMatch[0]}\n${roomCodeFromNormalizedMatch[0]}\n${normalizeRoomCodeMatch[0]}`,
    sandbox
  );
  const normalizeRoomCode = sandbox.normalizeRoomCode;
  const lowerCode = normalizeRoomCode?.("r6");
  const upperCode = normalizeRoomCode?.("R6");
  const invalidCode = normalizeRoomCode?.("dnd");
  normalizeRoomCodeWorks = lowerCode === "R6" && upperCode === "R6" && invalidCode === null;
}

const checks = [
  {
    name: "DND_ROOM_CODE is R6 (app.js)",
    passed: /const\s+DND_ROOM_CODE\s*=\s*["']R6["']/.test(appJs),
  },
  {
    name: "normalizeRoomCode helper is defined",
    passed: normalizeRoomCodeDefined,
  },
  {
    name: "Room code normalization handles R6 inputs",
    passed: normalizeRoomCodeWorks,
  },
  {
    name: "isDndRoom checks room.id first",
    passed: /function\s+isDndRoom[\s\S]*room\?\.id[\s\S]*DND_ROOM_CODE/.test(appJs),
  },
  {
    name: "DnD button aria-label updated",
    passed: /aria-label=["']Open DnD settings["']/.test(indexHtml),
  },
  {
    name: "Chat message filter uses roomId guard",
    passed: /socket\.on\("chat message"[\s\S]*msgRoomId/.test(appJs),
  },
  {
    name: "History filter uses roomId guard",
    passed: /socket\.on\("history"[\s\S]*msgRoomId/.test(appJs),
  },
  {
    name: "Server message payload includes roomId",
    passed: /roomId:\s*roomId\s*\|\|\s*null/.test(serverJs),
  },
  {
    name: "Migration seeds R6 DnD room",
    passed: /INSERT INTO rooms[\s\S]*'R6'[\s\S]*'DnD room'/.test(migrationSql),
  },
];

checks.forEach((check) => {
  console.log(`  ${check.passed ? "✅" : "❌"} ${check.name}`);
});

const failed = checks.filter((check) => !check.passed);
console.log(`\n${"=".repeat(48)}`);
if (failed.length) {
  console.log(`❌ ${failed.length} checks failed.`);
  failed.forEach((check) => console.log(`  - ${check.name}`));
  process.exit(1);
}

console.log("✅ All DnD room R6 checks passed!");
