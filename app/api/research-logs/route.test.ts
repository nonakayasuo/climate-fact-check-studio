import { describe, expect, it } from "vitest";
import { DELETE, GET, POST } from "./route";

describe("/api/research-logs", () => {
  it("returns validation error when POST payload misses log", async () => {
    const req = new Request("http://localhost/api/research-logs", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" }
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns delete confirmation required when token missing", async () => {
    const req = new Request("http://localhost/api/research-logs", {
      method: "DELETE",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" }
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("returns config missing when Supabase env is not set", async () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevKey = process.env.SUPABASE_ANON_KEY;
    const prevPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevPublicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const res = await GET();
    const body = (await res.json()) as { code?: string };

    expect(res.status).toBe(500);
    expect(body.code).toBe("CONFIG_MISSING");

    if (prevUrl) process.env.SUPABASE_URL = prevUrl;
    if (prevKey) process.env.SUPABASE_ANON_KEY = prevKey;
    if (prevPublicUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = prevPublicUrl;
    if (prevPublicKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevPublicKey;
  });
});

