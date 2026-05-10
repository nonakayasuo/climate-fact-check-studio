import { describe, expect, it } from "vitest";
import { PATCH } from "./route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/evidence-sources/abc", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
  });
}

const params = Promise.resolve({ id: "abc" });

describe("/api/evidence-sources/[id]", () => {
  it("rejects when status is missing", async () => {
    const res = await PATCH(makeRequest({}), { params });
    expect(res.status).toBe(400);
  });

  it("rejects when status is invalid", async () => {
    const res = await PATCH(makeRequest({ status: "purged" }), { params });
    expect(res.status).toBe(400);
  });
});
