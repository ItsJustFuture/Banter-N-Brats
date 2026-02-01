#!/usr/bin/env node
"use strict";

/**
 * State Persistence Test
 * Tests the state persistence module functionality
 */

const assert = require("assert/strict");
const statePersistence = require("../state-persistence");

// Mock database functions for testing
const testData = new Map();

function mockDbRunAsync(sql, params = []) {
  return new Promise((resolve) => {
    if (sql.includes("CREATE TABLE") || sql.includes("CREATE INDEX")) {
      // Just resolve for schema creation
      return resolve({ changes: 0 });
    } else if (sql.includes("INSERT OR REPLACE")) {
      const [key, value, expiresAt, createdAt, updatedAt] = params;
      testData.set(key, { value, expires_at: expiresAt, created_at: createdAt, updated_at: updatedAt });
      return resolve({ changes: 1 });
    } else if (sql.includes("DELETE")) {
      if (sql.includes("LIKE")) {
        const pattern = params[0];
        // Unescape the pattern: remove ^ escape char and the % wildcard
        const prefix = pattern.replace(/\^\^/g, '\x00').replace(/\^%/g, '%').replace(/\^_/g, '_').replace(/\x00/g, '^').replace(/%$/, '');
        for (const [k] of testData) {
          if (k.startsWith(prefix)) {
            testData.delete(k);
          }
        }
      } else {
        const key = params[0];
        testData.delete(key);
      }
      return resolve({ changes: 1 });
    }
    return resolve({ changes: 0 });
  });
}

function mockDbAllAsync(sql, params = []) {
  return new Promise((resolve) => {
    if (sql.includes("SELECT value, expires_at")) {
      const key = params[0];
      const data = testData.get(key);
      if (data) {
        resolve([data]);
      } else {
        resolve([]);
      }
    } else if (sql.includes("SELECT key")) {
      const pattern = params[0];
      const now = params[1];
      // Unescape the pattern: remove ^ escape char and the % wildcard
      const prefix = pattern.replace(/\^\^/g, '\x00').replace(/\^%/g, '%').replace(/\^_/g, '_').replace(/\x00/g, '^').replace(/%$/, '');
      const keys = [];
      for (const [k, v] of testData) {
        if (k.startsWith(prefix)) {
          if (!v.expires_at || v.expires_at > now) {
            keys.push({ key: k });
          }
        }
      }
      resolve(keys);
    } else {
      resolve([]);
    }
  });
}

async function runTests() {
  console.log("🧪 Testing State Persistence Module\n");
  
  // Initialize
  statePersistence.initStateManagement(mockDbRunAsync, mockDbAllAsync, null);
  await statePersistence.createStateTables();
  console.log("✓ Initialized state persistence");
  
  // Test 1: Basic set/get
  console.log("\n📝 Test 1: Basic set/get");
  await statePersistence.setState("test-key", "test-value");
  const val1 = await statePersistence.getState("test-key");
  assert(val1 === "test-value", "Expected 'test-value', got: " + val1);
  console.log("✓ Basic set/get works");
  
  // Test 2: JSON values
  console.log("\n📝 Test 2: JSON values");
  await statePersistence.setState("json-key", { foo: "bar", num: 42 });
  const val2 = await statePersistence.getState("json-key");
  const parsed = JSON.parse(val2);
  assert(parsed.foo === "bar" && parsed.num === 42, "JSON value mismatch");
  console.log("✓ JSON values work");
  
  // Test 3: hasState
  console.log("\n📝 Test 3: hasState");
  const exists = await statePersistence.hasState("test-key");
  assert(exists === true, "Key should exist");
  const notExists = await statePersistence.hasState("nonexistent");
  assert(notExists === false, "Key should not exist");
  console.log("✓ hasState works");
  
  // Test 4: Delete
  console.log("\n📝 Test 4: Delete");
  await statePersistence.deleteState("test-key");
  const val3 = await statePersistence.getState("test-key");
  assert(val3 === null, "Key should be deleted");
  console.log("✓ Delete works");
  
  // Test 5: TTL expiration (simulated)
  console.log("\n📝 Test 5: TTL expiration");
  await statePersistence.setState("ttl-key", "expires-soon", 1);
  // Manually set the expiration to past
  const data = testData.get("ttl-key");
  if (data) {
    data.expires_at = Date.now() - 1000; // 1 second in the past
    testData.set("ttl-key", data);
  }
  const val4 = await statePersistence.getState("ttl-key");
  assert(val4 === null, "Expired key should return null");
  console.log("✓ TTL expiration works");
  
  // Test 6: Prefix queries
  console.log("\n📝 Test 6: Prefix queries");
  await statePersistence.setState("user:1:online", "1");
  await statePersistence.setState("user:2:online", "1");
  await statePersistence.setState("user:3:online", "1");
  const keys = await statePersistence.getKeysByPrefix("user:");
  assert(keys.length === 3, `Expected 3 keys, got ${keys.length}`);
  console.log("✓ Prefix queries work");
  
  // Test 7: Delete by prefix
  console.log("\n📝 Test 7: Delete by prefix");
  await statePersistence.deleteByPrefix("user:");
  const keys2 = await statePersistence.getKeysByPrefix("user:");
  assert(keys2.length === 0, `Expected 0 keys, got ${keys2.length}`);
  console.log("✓ Delete by prefix works");
  
  // Test 8: Convenience helpers
  console.log("\n📝 Test 8: Convenience helpers");
  await statePersistence.setUserOnline(123, true);
  const isOnline = await statePersistence.isUserOnline(123);
  assert(isOnline === true, "User should be online");
  await statePersistence.setUserOnline(123, false);
  const isOffline = await statePersistence.isUserOnline(123);
  assert(isOffline === false, "User should be offline");
  console.log("✓ Convenience helpers work");
  
  console.log("\n✅ All tests passed!\n");
}

runTests().catch((err) => {
  console.error("\n❌ Test failed:", err);
  process.exit(1);
});
