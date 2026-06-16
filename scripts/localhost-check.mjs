#!/usr/bin/env node

const targets = [
  { name: "frontend", url: "http://localhost:3000" },
  { name: "frontend-api-health", url: "http://localhost:3000/api/health" },
  { name: "backend-docs", url: "http://localhost:8000/docs" },
];

async function check(target) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(target.url, { signal: controller.signal });
    clearTimeout(timeout);
    return {
      ...target,
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      ...target,
      ok: false,
      status: "offline",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const results = await Promise.all(targets.map(check));

console.log("Localhost check");
for (const result of results) {
  const mark = result.ok ? "OK" : "FAIL";
  const suffix = result.error ? ` — ${result.error}` : "";
  console.log(`${mark} ${result.name}: ${result.url} (${result.status})${suffix}`);
}

if (results.some((result) => !result.ok)) {
  process.exit(1);
}
