async function runTests() {
  const mod = await import("./worker.js");
  const worker = mod.default;

  const API_KEY = "test-key-123";

  function makeRequest(path, options = {}) {
    const method = options.method || "POST";
    const headers = new Map();
    if (options.apiKey) headers.set("authorization", "Bearer " + options.apiKey);
    if (options.contentType) headers.set("content-type", options.contentType || "application/json");
    if (options.extraHeaders) {
      for (const [k, v] of Object.entries(options.extraHeaders)) {
        headers.set(k, v);
      }
    }
    return new Request("https://test.dev" + path, {
      method,
      headers,
      body: options.body,
    });
  }

  const env = { API_KEY };
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log("  PASS: " + name);
      passed++;
    } catch (e) {
      console.log("  FAIL: " + name);
      console.log("        " + e.message);
      failed++;
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || "Assertion failed");
  }

  console.log("\n=== Text Length Limit Tests ===\n");

  await test("text at exactly 1200 chars should be accepted (not too long)", async () => {
    const text = "a".repeat(1200);
    const req = makeRequest("/v1/audio/speech", {
      apiKey: API_KEY,
      contentType: "application/json",
      body: JSON.stringify({ input: text, voice: "alloy" }),
    });
    const res = await worker.fetch(req, env);
    assert(res.status !== 400,
      "1200 chars should not trigger 400 error, got " + res.status);
  });

  await test("text at 1201 chars should be rejected", async () => {
    const text = "a".repeat(1201);
    const req = makeRequest("/v1/audio/speech", {
      apiKey: API_KEY,
      contentType: "application/json",
      body: JSON.stringify({ input: text, voice: "alloy" }),
    });
    const res = await worker.fetch(req, env);
    const data = await res.json();
    assert(res.status === 400, "Expected 400 status, got " + res.status);
    assert(data.error.code === "text_too_long", "Expected code text_too_long, got " + data.error.code);
    assert(data.error.message.includes("1200"), "Message should mention 1200 limit");
    assert(data.error.message.includes("1201"), "Message should mention current length 1201");
  });

  await test("text at 2000 chars should be rejected", async () => {
    const text = "b".repeat(2000);
    const req = makeRequest("/v1/audio/speech", {
      apiKey: API_KEY,
      contentType: "application/json",
      body: JSON.stringify({ input: text, voice: "alloy" }),
    });
    const res = await worker.fetch(req, env);
    const data = await res.json();
    assert(res.status === 400, "Expected 400 status");
    assert(data.error.code === "text_too_long", "Expected code text_too_long");
  });

  await test("short text should not be rejected", async () => {
    const text = "Hello world";
    const req = makeRequest("/v1/audio/speech", {
      apiKey: API_KEY,
      contentType: "application/json",
      body: JSON.stringify({ input: text, voice: "alloy" }),
    });
    const res = await worker.fetch(req, env);
    assert(res.status !== 400, "Short text should not get 400, got " + res.status);
  });

  await test("empty text should still return invalid_request_error (not text_too_long)", async () => {
    const req = makeRequest("/v1/audio/speech", {
      apiKey: API_KEY,
      contentType: "application/json",
      body: JSON.stringify({ voice: "alloy" }),
    });
    const res = await worker.fetch(req, env);
    const data = await res.json();
    assert(res.status === 400, "Expected 400");
    assert(data.error.code === "invalid_request_error", "Expected invalid_request_error for missing input");
  });

  console.log("\n=== Environment Variable Override Tests ===\n");

  await test("custom MAX_TEXT_LENGTH=500 via env should reject text > 500", async () => {
    globalThis.MAX_TEXT_LENGTH = undefined;
    const customEnv = { API_KEY, MAX_TEXT_LENGTH: "500" };
    const text = "x".repeat(501);
    const req = makeRequest("/v1/audio/speech", {
      apiKey: API_KEY,
      contentType: "application/json",
      body: JSON.stringify({ input: text, voice: "alloy" }),
    });
    const res = await worker.fetch(req, customEnv);
    const data = await res.json();
    assert(res.status === 400, "Expected 400");
    assert(data.error.code === "text_too_long", "Expected text_too_long");
    assert(data.error.message.includes("500"), "Should mention limit 500");
  });

  await test("custom MAX_TEXT_LENGTH=500 should accept text <= 500", async () => {
    const customEnv = { API_KEY, MAX_TEXT_LENGTH: "500" };
    const text = "x".repeat(500);
    const req = makeRequest("/v1/audio/speech", {
      apiKey: API_KEY,
      contentType: "application/json",
      body: JSON.stringify({ input: text, voice: "alloy" }),
    });
    const res = await worker.fetch(req, customEnv);
    assert(res.status !== 400, "500 chars should be accepted when limit is 500, got " + res.status);
  });

  console.log("\n=== Test Page Removed ===\n");

  await test("root path should return 404", async () => {
    const req = makeRequest("/", { method: "GET" });
    const res = await worker.fetch(req, env);
    const data = await res.json();
    assert(res.status === 404, "Expected 404, got " + res.status);
    assert(data.error.code === "not_found", "Expected not_found");
  });

  await test("/index.html should return 404", async () => {
    const req = makeRequest("/index.html", { method: "GET" });
    const res = await worker.fetch(req, env);
    assert(res.status === 404, "Expected 404");
  });

  console.log("\n=== Edge Cases ===\n");

  await test("text with multibyte chars (Chinese) length check", async () => {
    globalThis.MAX_TEXT_LENGTH = undefined;
    const text = "你".repeat(1200);
    const req = makeRequest("/v1/audio/speech", {
      apiKey: API_KEY,
      contentType: "application/json",
      body: JSON.stringify({ input: text, voice: "alloy" }),
    });
    const res = await worker.fetch(req, env);
    assert(res.status !== 400, "1200 Chinese chars (each 1 JS char) should be accepted, got " + res.status);
  });

  await test("text with multibyte chars (Chinese) over limit", async () => {
    const text = "你".repeat(1201);
    const req = makeRequest("/v1/audio/speech", {
      apiKey: API_KEY,
      contentType: "application/json",
      body: JSON.stringify({ input: text, voice: "alloy" }),
    });
    const res = await worker.fetch(req, env);
    const data = await res.json();
    assert(res.status === 400, "Expected 400");
    assert(data.error.code === "text_too_long", "Expected text_too_long");
  });

  console.log("\n" + "=".repeat(40));
  console.log("Results: " + passed + " passed, " + failed + " failed");
  console.log("=".repeat(40));

  process.exit(failed > 0 ? 1 : 0);
}

async function cloneJson(res) {
  const text = await res.text();
  return JSON.parse(text);
}

runTests().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});
