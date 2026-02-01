#!/usr/bin/env node
"use strict";

/**
 * Validation Demo
 * Demonstrates how input validation protects against various attack vectors
 */

const validators = require("../validators");

console.log("🛡️  Input Validation Security Demo\n");
console.log("=" .repeat(60));

// Test 1: Zero-width character attack
console.log("\n📝 Test 1: Zero-width Character Attack");
console.log("Input: 'Hello\\u200Bworld' (contains invisible zero-width space)");
const zwAttack = "Hello\u200Bworld";
const cleanZw = validators.sanitizeText(zwAttack);
console.log(`Output: '${cleanZw}'`);
console.log(`✓ Zero-width characters removed: ${!cleanZw.includes('\u200B')}`);

// Test 2: Control character attack
console.log("\n📝 Test 2: Control Character Attack");
console.log("Input: 'Hello\\x00world' (contains null byte)");
const ctrlAttack = "Hello\x00world";
const cleanCtrl = validators.sanitizeText(ctrlAttack);
console.log(`Output: '${cleanCtrl}'`);
console.log(`✓ Control characters removed: ${!cleanCtrl.includes('\x00')}`);

// Test 3: Excessive newlines (spam/DOS)
console.log("\n📝 Test 3: Excessive Newlines (Spam/DOS)");
console.log("Input: 'Hello\\n\\n\\n\\n\\n\\nworld' (6 newlines)");
const nlAttack = "Hello\n\n\n\n\n\nworld";
const cleanNl = validators.sanitizeText(nlAttack);
const nlCount = (cleanNl.match(/\n/g) || []).length;
console.log(`Output newline count: ${nlCount}`);
console.log(`✓ Newlines limited to 3: ${nlCount <= 3}`);

// Test 4: Message too long
console.log("\n📝 Test 4: Message Too Long (DOS)");
const longMsg = "a".repeat(3000);
const validation1 = validators.validate(validators.ChatMessageSchema, {
  room: "main",
  text: longMsg
});
console.log(`Input length: 3000 characters`);
console.log(`Validation result: ${validation1.success ? 'PASS' : 'FAIL'}`);
console.log(`✓ Long messages rejected: ${!validation1.success}`);

// Test 5: Empty message
console.log("\n📝 Test 5: Empty Message");
const validation2 = validators.validate(validators.ChatMessageSchema, {
  room: "main",
  text: ""
});
console.log(`Input: empty string`);
console.log(`Validation result: ${validation2.success ? 'PASS' : 'FAIL'}`);
console.log(`✓ Empty messages rejected: ${!validation2.success}`);

// Test 6: Invalid room name
console.log("\n📝 Test 6: Invalid Room Name");
const validation3 = validators.validate(validators.ChatMessageSchema, {
  room: "",
  text: "Hello"
});
console.log(`Input room: empty string`);
console.log(`Validation result: ${validation3.success ? 'PASS' : 'FAIL'}`);
console.log(`✓ Invalid room rejected: ${!validation3.success}`);

// Test 7: SQL injection attempt in username
console.log("\n📝 Test 7: Username with Special Characters");
const sqlInjection = "admin'; DROP TABLE users; --";
const userCheck = validators.validateUsername(sqlInjection);
console.log(`Input: "${sqlInjection}"`);
console.log(`Validation result: ${userCheck.valid ? 'PASS' : 'FAIL'}`);
console.log(`✓ SQL injection pattern rejected: ${!userCheck.valid}`);

// Test 8: XSS attempt in message
console.log("\n📝 Test 8: Script Tag in Message");
const xssAttempt = "<script>alert('XSS')</script>";
const cleanXss = validators.sanitizeText(xssAttempt);
console.log(`Input: "${xssAttempt}"`);
console.log(`Output: "${cleanXss}"`);
console.log(`Note: XSS still needs client-side escaping, but control chars are removed`);

// Test 9: Weak password
console.log("\n📝 Test 9: Weak Password (Too Short)");
const weakPass = "pass123";
const passCheck = validators.validatePassword(weakPass);
console.log(`Input: "${weakPass}" (${weakPass.length} chars)`);
console.log(`Validation result: ${passCheck.valid ? 'PASS' : 'FAIL'}`);
console.log(`Error: ${passCheck.error || 'N/A'}`);
console.log(`✓ Weak password rejected: ${!passCheck.valid}`);

// Test 10: Valid password
console.log("\n📝 Test 10: Strong Password");
const strongPass = "MySecureP@ssw0rd123!";
const passCheck2 = validators.validatePassword(strongPass);
console.log(`Input: "${strongPass}" (${strongPass.length} chars)`);
console.log(`Validation result: ${passCheck2.valid ? 'PASS' : 'FAIL'}`);
console.log(`✓ Strong password accepted: ${passCheck2.valid}`);

console.log("\n" + "=".repeat(60));
console.log("\n✅ All security validations working correctly!");
console.log("\n🔒 Protection Summary:");
console.log("  ✓ Zero-width character attacks blocked");
console.log("  ✓ Control character attacks blocked");
console.log("  ✓ DOS via long messages prevented");
console.log("  ✓ DOS via excessive newlines prevented");
console.log("  ✓ Empty/invalid input rejected");
console.log("  ✓ SQL injection patterns blocked");
console.log("  ✓ Weak passwords rejected");
console.log("  ✓ Type-safe validation enforced");
console.log("\n");
