import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { ResearchLog, ResearchLogApiError, ResearchLogInput } from "@/lib/types";

type FactCheckSessionRow = {
  id: string;
  created_at: string;
  title: string | null;
  media_type: ResearchLog["media_type"];
  topic: ResearchLog["topic"];
  input_text: string;
  claims: string[];
  ai_memo: string | null;
  sources: string[];
  risks: string[];
  human_rating_accuracy: number | null;
  human_rating_usefulness: number | null;
  human_rating_trust: number | null;
  human_revision: string | null;
  revision_reason: string[];
};

type FactCheckSessionInsert = Omit<FactCheckSessionRow, "created_at"> & {
  created_at?: string;
};

function asApiError(
  code: ResearchLogApiError["code"],
  message: string,
  retryable: boolean
): ResearchLogApiError {
  return { code, message, retryable };
}

function wrapDbError(error: PostgrestError): ResearchLogApiError {
  if (error.code === "42501") {
    return asApiError("DB_UNAVAILABLE", "書き込み権限が不足しています。RLS 設定を確認してください。", false);
  }
  return asApiError("DB_UNAVAILABLE", `DB 操作に失敗しました: ${error.message}`, true);
}

function ensureStringArray(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw Object.assign(new Error(`${fieldName} は string 配列である必要があります。`), {
      apiError: asApiError("SCHEMA_MISMATCH", `${fieldName} の型が不正です。`, false)
    });
  }
  return value;
}

export function toDbRow(input: ResearchLogInput): FactCheckSessionInsert {
  return {
    id: input.id ?? crypto.randomUUID(),
    created_at: input.timestamp ?? new Date().toISOString(),
    title: input.title,
    media_type: input.media_type,
    topic: input.topic,
    input_text: input.input_text,
    claims: input.claims,
    ai_memo: input.ai_memo,
    sources: input.sources,
    risks: input.risks,
    human_rating_accuracy: input.human_rating_accuracy,
    human_rating_usefulness: input.human_rating_usefulness,
    human_rating_trust: input.human_rating_trust,
    human_revision: input.human_revision,
    revision_reason: input.revision_reason
  };
}

export function toResearchLog(row: FactCheckSessionRow): ResearchLog {
  try {
    return {
      id: row.id,
      timestamp: row.created_at,
      title: row.title ?? "",
      media_type: row.media_type,
      topic: row.topic,
      input_text: row.input_text,
      claims: ensureStringArray(row.claims, "claims"),
      ai_memo: row.ai_memo ?? "",
      sources: ensureStringArray(row.sources, "sources"),
      risks: ensureStringArray(row.risks, "risks"),
      human_rating_accuracy: row.human_rating_accuracy ?? 3,
      human_rating_usefulness: row.human_rating_usefulness ?? 3,
      human_rating_trust: row.human_rating_trust ?? 3,
      human_revision: row.human_revision ?? "",
      revision_reason: ensureStringArray(row.revision_reason, "revision_reason")
    };
  } catch (error) {
    throw Object.assign(new Error("Supabase row から ResearchLog へ変換できませんでした。"), {
      apiError:
        (error as { apiError?: ResearchLogApiError }).apiError ??
        asApiError("SCHEMA_MISMATCH", "スキーマ不整合を検知しました。", false)
    });
  }
}

export class ResearchLogRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseServerClient()) {}

  async list(): Promise<ResearchLog[]> {
    const { data, error } = await this.client
      .from("fact_check_sessions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw Object.assign(new Error(error.message), { apiError: wrapDbError(error) });
    return (data as FactCheckSessionRow[]).map(toResearchLog);
  }

  async create(input: ResearchLogInput): Promise<ResearchLog> {
    const row = toDbRow(input);
    const { data, error } = await this.client.from("fact_check_sessions").insert(row).select("*").single();
    if (error) throw Object.assign(new Error(error.message), { apiError: wrapDbError(error) });
    return toResearchLog(data as FactCheckSessionRow);
  }

  async purgeAll(confirmToken: string): Promise<{ deletedCount: number }> {
    if (confirmToken !== "DELETE") {
      throw Object.assign(new Error("確認語句が一致しません。"), {
        apiError: asApiError("DELETE_CONFIRMATION_REQUIRED", "削除するには DELETE の入力が必要です。", false)
      });
    }

    const { count, error } = await this.client
      .from("fact_check_sessions")
      .delete({ count: "exact" })
      .not("id", "is", null);
    if (error) throw Object.assign(new Error(error.message), { apiError: wrapDbError(error) });
    return { deletedCount: count ?? 0 };
  }
}

export function getApiError(error: unknown): ResearchLogApiError {
  return (
    (error as { apiError?: ResearchLogApiError })?.apiError ??
    asApiError("DB_UNAVAILABLE", "予期しないエラーが発生しました。", true)
  );
}

