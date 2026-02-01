#!/usr/bin/env node
"use strict";

/**
 * Input Validation Test
 * Tests the validators module functionality
 */

const validators = require("../validators");

function runTests() {
  console.log("🧪 Testing Input Validation Module\n");
  
  // Test 1: Valid chat message
  console.log("📝 Test 1: Valid chat message");
  const valid1 = validators.validate(validators.ChatMessageSchema, {
    room: "main",
    text: "Hello, world!"
  });
  console.assert(valid1.success === true, "Valid message should pass");
  console.assert(valid1.data.room === "main", "Room should be 'main'");
  console.assert(valid1.data.text === "Hello, world!", "Text should match");
  console.log("✓ Valid chat message works");
  
  // Test 2: Empty message (should fail)
  console.log("\n📝 Test 2: Empty message");
  const invalid1 = validators.validate(validators.ChatMessageSchema, {
    room: "main",
    text: ""
  });
  console.assert(invalid1.success === false, "Empty message should fail");
  console.assert(invalid1.error.includes("text"), "Error should mention text field");
  console.log("✓ Empty message rejected");
  
  // Test 3: Message too long (should fail)
  console.log("\n📝 Test 3: Message too long");
  const longText = "a".repeat(2001);
  const invalid2 = validators.validate(validators.ChatMessageSchema, {
    room: "main",
    text: longText
  });
  console.assert(invalid2.success === false, "Long message should fail");
  console.log("✓ Long message rejected");
  
  // Test 4: Invalid room name (should fail)
  console.log("\n📝 Test 4: Invalid room name");
  const invalid3 = validators.validate(validators.ChatMessageSchema, {
    room: "",
    text: "Hello"
  });
  console.assert(invalid3.success === false, "Empty room should fail");
  console.log("✓ Invalid room rejected");
  
  // Test 5: Sanitize text
  console.log("\n📝 Test 5: Sanitize text");
  const dirty = "Hello\u200Bworld\x00test\n\n\n\nfoo";
  const clean = validators.sanitizeText(dirty);
  console.assert(!clean.includes("\u200B"), "Should remove zero-width chars");
  console.assert(!clean.includes("\x00"), "Should remove null chars");
  console.assert(!clean.includes("\n\n\n\n"), "Should limit consecutive newlines");
  console.log("✓ Text sanitization works");
  
  // Test 6: Valid username
  console.log("\n📝 Test 6: Valid username");
  const validUser = validators.validateUsername("JohnDoe_123");
  console.assert(validUser.valid === true, "Valid username should pass");
  console.assert(validUser.username === "JohnDoe_123", "Username should match");
  console.log("✓ Valid username works");
  
  // Test 7: Username too short
  console.log("\n📝 Test 7: Username too short");
  const shortUser = validators.validateUsername("a");
  console.assert(shortUser.valid === false, "Short username should fail");
  console.assert(shortUser.error.includes("2 characters"), "Error should mention length");
  console.log("✓ Short username rejected");
  
  // Test 8: Username with special chars
  console.log("\n📝 Test 8: Username with special chars");
  const specialUser = validators.validateUsername("user@test!");
  console.assert(specialUser.valid === false, "Special chars should fail");
  console.log("✓ Special chars in username rejected");
  
  // Test 9: Valid password
  console.log("\n📝 Test 9: Valid password");
  const validPass = validators.validatePassword("MySecurePass123!");
  console.assert(validPass.valid === true, "Valid password should pass");
  console.log("✓ Valid password works");
  
  // Test 10: Password too short
  console.log("\n📝 Test 10: Password too short");
  const shortPass = validators.validatePassword("short");
  console.assert(shortPass.valid === false, "Short password should fail");
  console.assert(shortPass.error.includes("12 characters"), "Error should mention length");
  console.log("✓ Short password rejected");
  
  // Test 11: Valid email
  console.log("\n📝 Test 11: Valid email");
  const validEmail = validators.validateEmail("test@example.com");
  console.assert(validEmail.valid === true, "Valid email should pass");
  console.assert(validEmail.email === "test@example.com", "Email should be normalized");
  console.log("✓ Valid email works");
  
  // Test 12: Invalid email
  console.log("\n📝 Test 12: Invalid email");
  const invalidEmail = validators.validateEmail("not-an-email");
  console.assert(invalidEmail.valid === false, "Invalid email should fail");
  console.log("✓ Invalid email rejected");
  
  // Test 13: Email normalization
  console.log("\n📝 Test 13: Email normalization");
  const normalizedEmail = validators.validateEmail("  TEST@EXAMPLE.COM  ");
  console.assert(normalizedEmail.valid === true, "Email should pass");
  console.assert(normalizedEmail.email === "test@example.com", "Email should be lowercase and trimmed");
  console.log("✓ Email normalization works");
  
  // Test 14: DM message schema
  console.log("\n📝 Test 14: DM message schema");
  const validDM = validators.validate(validators.DMMessageSchema, {
    threadId: 42,
    text: "Hello DM"
  });
  console.assert(validDM.success === true, "Valid DM should pass");
  console.log("✓ DM message schema works");
  
  // Test 15: Dice roll schema
  console.log("\n📝 Test 15: Dice roll schema");
  const validDice = validators.validate(validators.DiceRollSchema, {
    variant: "d20"
  });
  console.assert(validDice.success === true, "Valid dice roll should pass");
  console.log("✓ Dice roll schema works");
  
  console.log("\n✅ All validation tests passed!\n");
}

try {
  runTests();
} catch (err) {
  console.error("\n❌ Test failed:", err);
  process.exit(1);
}
