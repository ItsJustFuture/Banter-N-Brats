// Test script for music room YouTube player functionality
"use strict";

// Helper to extract YouTube video IDs from text
function extractYouTubeIds(text) {
  const s = String(text || "");
  const re = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/gi;
  const hits = [];
  let m;
  while ((m = re.exec(s))) {
    if (m[1]) hits.push(m[1]);
  }
  return hits.filter((id, idx) => hits.indexOf(id) === idx);
}

// Test cases
const testCases = [
  {
    input: "Check out this video https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    expected: ["dQw4w9WgXcQ"]
  },
  {
    input: "https://youtu.be/dQw4w9WgXcQ",
    expected: ["dQw4w9WgXcQ"]
  },
  {
    input: "Multiple videos: https://www.youtube.com/watch?v=abc123 and https://youtu.be/def456",
    expected: ["abc123", "def456"]
  },
  {
    input: "No video here",
    expected: []
  },
  {
    input: "https://www.youtube.com/shorts/shortID123",
    expected: ["shortID123"]
  },
  {
    input: "https://www.youtube.com/embed/embedID456",
    expected: ["embedID456"]
  }
];

console.log("Testing YouTube link extraction...\n");

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = extractYouTubeIds(test.input);
  const isMatch = JSON.stringify(result) === JSON.stringify(test.expected);
  
  if (isMatch) {
    console.log(`✓ Test ${index + 1} passed`);
    passed++;
  } else {
    console.log(`✗ Test ${index + 1} failed`);
    console.log(`  Input: ${test.input}`);
    console.log(`  Expected: ${JSON.stringify(test.expected)}`);
    console.log(`  Got: ${JSON.stringify(result)}`);
    failed++;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log("\n✓ All tests passed!");
  process.exit(0);
} else {
  console.log(`\n✗ ${failed} test(s) failed`);
  process.exit(1);
}
