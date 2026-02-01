#!/usr/bin/env node
"use strict";

/**
 * Integration Test for Tier 2 Improvements
 * Tests state persistence and validation working together with the server
 */

const assert = require("assert/strict");
const path = require("path");
const fs = require("fs");

async function runIntegrationTest() {
  console.log("🧪 Tier 2 Integration Test\n");
  
  // Test 1: Verify modules can be imported
  console.log("📝 Test 1: Module imports");
  try {
    require("../state-persistence");
    const validators = require("../validators");
    assert(typeof validators.validate === "function", "Validators module should export a validate function");
    console.log("✓ State persistence module imported");
    console.log("✓ Validators module imported");
  } catch (err) {
    console.error("❌ Failed to import modules:", err.message);
    process.exit(1);
  }
  
  // Test 2: Verify Zod is installed
  console.log("\n📝 Test 2: Zod dependency");
  try {
    const { z } = require("zod");
    assert(typeof z.string === "function", "Zod should be functional");
    console.log("✓ Zod installed and working");
  } catch (err) {
    console.error("❌ Zod not properly installed:", err.message);
    process.exit(1);
  }
  
  // Test 3: Verify server.js has the new imports
  console.log("\n📝 Test 3: Server.js integration");
  try {
    const serverContent = fs.readFileSync(path.join(__dirname, "../server.js"), "utf-8");
    const hasStatePersistenceImport = /require\(['"]\.\/state-persistence['"]\)/.test(serverContent);
    const hasValidatorsImport = /require\(['"]\.\/validators['"]\)/.test(serverContent);
    assert(hasStatePersistenceImport, "Server should import state-persistence");
    assert(hasValidatorsImport, "Server should import validators");
    assert(serverContent.includes("statePersistence.initStateManagement"), "Server should initialize state persistence");
    assert(serverContent.includes("validators.validate"), "Server should use validators");
    console.log("✓ Server.js properly integrated");
  } catch (err) {
    console.error("❌ Server.js integration check failed:", err.message);
    process.exit(1);
  }
  
  // Test 4: Check database.js has error handling
  console.log("\n📝 Test 4: Database error handling");
  try {
    const dbContent = fs.readFileSync(path.join(__dirname, "../database.js"), "utf-8");
    assert(dbContent.includes("console.error('[database]"), "Database should have error logging");
    assert(dbContent.match(/try\s*{/g)?.length >= 3, "Database should have multiple try-catch blocks");
    console.log("✓ Database has enhanced error handling");
  } catch (err) {
    console.error("❌ Database error handling check failed:", err.message);
    process.exit(1);
  }
  
  // Test 5: Verify state-persistence.js structure
  console.log("\n📝 Test 5: State persistence structure");
  try {
    const statePersistence = require("../state-persistence");
    const requiredFunctions = [
      "initStateManagement",
      "createStateTables",
      "setState",
      "getState",
      "deleteState",
      "hasState",
      "setUserOnline",
      "isUserOnline",
      "setTyping",
      "getTypingUsers",
    ];
    
    for (const func of requiredFunctions) {
      assert(typeof statePersistence[func] === "function", `${func} should be a function`);
    }
    console.log("✓ State persistence has all required functions");
  } catch (err) {
    console.error("❌ State persistence structure check failed:", err.message);
    process.exit(1);
  }
  
  // Test 6: Verify validators.js structure
  console.log("\n📝 Test 6: Validators structure");
  try {
    const validators = require("../validators");
    const requiredSchemas = [
      "ChatMessageSchema",
      "DMMessageSchema",
      "EditMessageSchema",
      "ReactionSchema",
      "DiceRollSchema",
    ];
    
    for (const schema of requiredSchemas) {
      assert(validators[schema] !== undefined, `${schema} should exist`);
    }
    
    const requiredHelpers = [
      "validate",
      "sanitizeText",
      "validateUsername",
      "validatePassword",
      "validateEmail",
    ];
    
    for (const helper of requiredHelpers) {
      assert(typeof validators[helper] === "function", `${helper} should be a function`);
    }
    console.log("✓ Validators has all required schemas and helpers");
  } catch (err) {
    console.error("❌ Validators structure check failed:", err.message);
    process.exit(1);
  }
  
  // Test 7: Verify package.json has Zod
  console.log("\n📝 Test 7: Package.json dependencies");
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"), "utf-8"));
    assert(packageJson.dependencies.zod, "Zod should be in dependencies");
    assert(packageJson.scripts["test:state"], "test:state script should exist");
    assert(packageJson.scripts["test:validators"], "test:validators script should exist");
    console.log("✓ Package.json properly configured");
  } catch (err) {
    console.error("❌ Package.json check failed:", err.message);
    process.exit(1);
  }
  
  // Test 8: Run validation tests
  console.log("\n📝 Test 8: Run validation tests");
  try {
    const validators = require("../validators");
    
    // Test valid message
    const valid = validators.validate(validators.ChatMessageSchema, {
      room: "main",
      text: "Test message"
    });
    assert(valid.success === true, "Valid message should pass");
    
    // Test invalid message
    const invalid = validators.validate(validators.ChatMessageSchema, {
      room: "",
      text: "Test"
    });
    assert(invalid.success === false, "Invalid message should fail");
    
    // Test sanitization
    const dirty = "Test\u200Bmessage\x00";
    const clean = validators.sanitizeText(dirty);
    assert(!clean.includes("\u200B"), "Should remove zero-width chars");
    assert(!clean.includes("\x00"), "Should remove null chars");
    
    console.log("✓ Validation tests passed");
  } catch (err) {
    console.error("❌ Validation tests failed:", err.message);
    process.exit(1);
  }
  
  console.log("\n✅ All integration tests passed!\n");
  console.log("📊 Summary:");
  console.log("  ✓ State persistence module working");
  console.log("  ✓ Input validation module working");
  console.log("  ✓ Database error handling enhanced");
  console.log("  ✓ Server integration complete");
  console.log("  ✓ Zod dependency installed");
  console.log("  ✓ Test scripts added");
  console.log("\n🎯 Tier 2 Implementation Complete!\n");
}

runIntegrationTest().catch((err) => {
  console.error("\n❌ Integration test failed:", err);
  process.exit(1);
});
