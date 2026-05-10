import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { findDuplicate, normalizeUrl, validateRegistryInput } from "@/lib/evidence-registry";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type {
  EvidenceRegistryApiError,
  EvidenceRegistryEntry,
  EvidenceRegistryInput,
  EvidenceSourceStatus,
  EvidenceSourceType,
  Topic
} from "@/lib/types";

const TABLE = "fact_check_evidence_sources";

type EvidenceRow = {
  id: string;
  title: string;
  owner: string;
  url: string;
  source_type: EvidenceSourceType;
  themes: unknown;
  note: string | null;
  status: EvidenceSourceStatus;
  registered_at: string;
  updated_at: string;
};

function asApiError(
  code: EvidenceRegistryApiError["code"],
  message: string,
  retryable: boolean
): EvidenceRegistryApiError {
  return { code, message, retryable };
}

function wrapDbError(error: PostgrestError): EvidenceRegistryApiError {
  if (error.code === "23505") {
    return asApiError("EVIDENCE_DUPLICATE", "同一 URL の根拠資料は既に登録されています。", false);
  }
  if (error.code === "42501") {
    return asApiError("DB_UNAVAILABLE", "書き込み権限が不足しています。RLS 設定を確認してください。", false);
  }
  return asApiError("DB_UNAVAILABLE", `DB 操作に失敗しました: ${error.message}`, true);
}

function ensureThemeArray(value: unknown): Topic[] {
  if (!Array.isArray(value)) {
    throw Object.assign(new Error("themes must be an array"), {
      apiError: asApiError("SCHEMA_MISMATCH", "themes の型が不正です。", false)
    });
  }
  for (const item of value) {
    if (typeof item !== "string") {
      throw Object.assign(new Error("themes must be string array"), {
        apiError: asApiError("SCHEMA_MISMATCH", "themes は string 配列である必要があります。", false)
      });
    }
  }
  return value as Topic[];
}

export function toEvidenceEntry(row: EvidenceRow): EvidenceRegistryEntry {
  try {
    return {
      id: row.id,
      title: row.title,
      owner: row.owner,
      url: row.url,
      source_type: row.source_type,
      themes: ensureThemeArray(row.themes),
      note: row.note ?? "",
      status: row.status,
      registered_at: row.registered_at,
      updated_at: row.updated_at
    };
  } catch (error) {
    throw Object.assign(new Error("Supabase row から EvidenceRegistryEntry へ変換できませんでした。"), {
      apiError:
        (error as { apiError?: EvidenceRegistryApiError }).apiError ??
        asApiError("SCHEMA_MISMATCH", "スキーマ不整合を検知しました。", false)
    });
  }
}

export function toInsertRow(input: EvidenceRegistryInput): Omit<EvidenceRow, "themes"> & { themes: Topic[] } {
  const now = new Date().toISOString();
  return {
    id: input.id ?? crypto.randomUUID(),
    title: input.title.trim(),
    owner: input.owner.trim(),
    url: input.url.trim(),
    source_type: input.source_type,
    themes: input.themes,
    note: input.note ?? "",
    status: input.status ?? "active",
    registered_at: input.registered_at ?? now,
    updated_at: input.updated_at ?? now
  };
}

export class EvidenceSourceRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseServerClient()) {}

  async list(options: { includeInactive?: boolean } = {}): Promise<EvidenceRegistryEntry[]> {
    let query = this.client.from(TABLE).select("*").order("registered_at", { ascending: false });
    if (!options.includeInactive) {
      query = query.eq("status", "active");
    }
    const { data, error } = await query;
    if (error) throw Object.assign(new Error(error.message), { apiError: wrapDbError(error) });
    return (data as EvidenceRow[]).map(toEvidenceEntry);
  }

  async create(input: EvidenceRegistryInput): Promise<EvidenceRegistryEntry> {
    const validation = validateRegistryInput(input);
    if (!validation.ok) {
      throw Object.assign(new Error(validation.error.message), { apiError: validation.error });
    }

    const existing = await this.list({ includeInactive: true });
    const normalized = normalizeUrl(validation.value.url);
    if (normalized) {
      const duplicate = findDuplicate(existing, normalized);
      if (duplicate) {
        throw Object.assign(new Error("duplicate"), {
          apiError: asApiError(
            "EVIDENCE_DUPLICATE",
            `この URL は ${duplicate.title} として登録済みです。`,
            false
          )
        });
      }
    }

    const row = toInsertRow(validation.value);
    const { data, error } = await this.client.from(TABLE).insert(row).select("*").single();
    if (error) throw Object.assign(new Error(error.message), { apiError: wrapDbError(error) });
    return toEvidenceEntry(data as EvidenceRow);
  }

  async updateStatus(id: string, status: EvidenceSourceStatus): Promise<EvidenceRegistryEntry> {
    const { data, error } = await this.client
      .from(TABLE)
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      if (error.code === "PGRST116") {
        throw Object.assign(new Error("not found"), {
          apiError: asApiError("EVIDENCE_NOT_FOUND", "指定された根拠資料が見つかりません。", false)
        });
      }
      throw Object.assign(new Error(error.message), { apiError: wrapDbError(error) });
    }
    return toEvidenceEntry(data as EvidenceRow);
  }
}

export function getApiError(error: unknown): EvidenceRegistryApiError {
  return (
    (error as { apiError?: EvidenceRegistryApiError })?.apiError ??
    asApiError("DB_UNAVAILABLE", "予期しないエラーが発生しました。", true)
  );
}
