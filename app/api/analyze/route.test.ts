import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/analyze", () => {
  it("returns 400 when required fields are missing", async () => {
    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ title: "x" }),
      headers: { "Content-Type": "application/json" }
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns missing key error when OPENAI_API_KEY is not set", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({
        title: "test",
        mediaType: "Web記事",
        topic: "猛暑",
        body: "今年の猛暑はすべて温暖化が原因だ。"
      }),
      headers: { "Content-Type": "application/json" }
    });

    const res = await POST(req);
    const body = (await res.json()) as { code?: string };

    expect(res.status).toBe(500);
    expect(body.code).toBe("MISSING_API_KEY");

    if (prev) process.env.OPENAI_API_KEY = prev;
  });
});
