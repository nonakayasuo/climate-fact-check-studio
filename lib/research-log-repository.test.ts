import { describe, expect, it } from "vitest";
import { ResearchLogRepository, toDbRow, toResearchLog } from "./research-log-repository";
import type { ResearchLogInput } from "./types";

const input: ResearchLogInput = {
  title: "タイトル",
  media_type: "Web記事",
  topic: "猛暑",
  input_text: "本文",
  claims: ["主張1"],
  ai_memo: "メモ",
  sources: ["IPCC"],
  risks: ["根拠不足"],
  human_rating_accuracy: 4,
  human_rating_usefulness: 3,
  human_rating_trust: 5,
  human_revision: "修正文",
  revision_reason: ["根拠不足"]
};

describe("research-log-repository", () => {
  it("maps ResearchLogInput to DB row and back", () => {
    const row = toDbRow({ ...input, id: "x-id", timestamp: "2026-01-01T00:00:00.000Z" });
    expect(row.id).toBe("x-id");
    expect(row.created_at).toBe("2026-01-01T00:00:00.000Z");

    const log = toResearchLog({
      ...row,
      created_at: row.created_at ?? "2026-01-01T00:00:00.000Z",
      title: row.title ?? "",
      ai_memo: row.ai_memo ?? ""
    });
    expect(log.timestamp).toBe("2026-01-01T00:00:00.000Z");
    expect(log.media_type).toBe("Web記事");
    expect(log.revision_reason).toEqual(["根拠不足"]);
  });

  it("rejects delete without DELETE token", async () => {
    const repository = new ResearchLogRepository({} as never);
    await expect(repository.purgeAll("NOPE")).rejects.toMatchObject({
      apiError: { code: "DELETE_CONFIRMATION_REQUIRED" }
    });
  });
});

