import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET, POST } from "./route";

const ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
];

describe("/api/evidence-sources", () => {
  let saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved = {};
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = saved[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("POST returns 400 when source field is missing", async () => {
    const req = new Request("http://localhost/api/evidence-sources", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" }
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST returns CONFIG_MISSING when Supabase env is unset", async () => {
    const req = new Request("http://localhost/api/evidence-sources", {
      method: "POST",
      body: JSON.stringify({
        source: {
          title: "test",
          owner: "tester",
          url: "https://example.org/report",
          source_type: "url",
          themes: [],
          note: ""
        }
      }),
      headers: { "Content-Type": "application/json" }
    });
    const res = await POST(req);
    const body = (await res.json()) as { code?: string };
    expect(res.status).toBe(500);
    expect(body.code).toBe("CONFIG_MISSING");
  });

  it("GET returns CONFIG_MISSING when Supabase env is unset", async () => {
    const req = new Request("http://localhost/api/evidence-sources");
    const res = await GET(req);
    const body = (await res.json()) as { code?: string };
    expect(res.status).toBe(500);
    expect(body.code).toBe("CONFIG_MISSING");
  });
});
