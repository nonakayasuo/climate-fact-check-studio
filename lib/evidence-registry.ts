import type {
  EvidenceRegistryApiError,
  EvidenceRegistryEntry,
  EvidenceRegistryInput,
  EvidenceSource,
  EvidenceSourceType,
  Topic
} from "@/lib/types";

export type ValidatedRegistryInput = Omit<EvidenceRegistryInput, "url"> & {
  url: string;
  normalized_url: string;
};

const TRACKING_PARAM_PREFIXES = ["utm_", "fbclid", "gclid", "yclid", "_hsenc", "_hsmi"];
const ALLOWED_SOURCE_TYPES: EvidenceSourceType[] = ["url", "pdf", "report", "dataset"];

export function normalizeUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.hash = "";

  const filteredParams = new URLSearchParams();
  for (const [key, value] of parsed.searchParams.entries()) {
    const isTracking = TRACKING_PARAM_PREFIXES.some((prefix) => key.toLowerCase().startsWith(prefix));
    if (!isTracking) filteredParams.append(key, value);
  }
  parsed.search = filteredParams.toString();

  let normalized = parsed.toString();
  if (normalized.endsWith("/") && parsed.pathname !== "/") {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export function validateRegistryInput(
  input: EvidenceRegistryInput
): { ok: true; value: ValidatedRegistryInput } | { ok: false; error: EvidenceRegistryApiError } {
  if (!input.title?.trim()) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "title は必須です。", retryable: false }
    };
  }
  if (!input.owner?.trim()) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "owner は必須です。", retryable: false }
    };
  }
  if (!ALLOWED_SOURCE_TYPES.includes(input.source_type)) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "source_type は url / pdf / report / dataset のいずれかを指定してください。",
        retryable: false
      }
    };
  }

  const normalized = normalizeUrl(input.url ?? "");
  if (!normalized) {
    return {
      ok: false,
      error: {
        code: "EVIDENCE_INVALID_URL",
        message: "URL の形式が不正です。http または https の URL を指定してください。",
        retryable: false
      }
    };
  }

  const themes = Array.isArray(input.themes) ? (input.themes.filter(Boolean) as Topic[]) : [];

  return {
    ok: true,
    value: {
      ...input,
      themes,
      note: input.note ?? "",
      url: input.url.trim(),
      normalized_url: normalized
    }
  };
}

export function findDuplicate(
  entries: EvidenceRegistryEntry[],
  normalizedUrl: string,
  ignoreId?: string
): EvidenceRegistryEntry | null {
  for (const entry of entries) {
    if (ignoreId && entry.id === ignoreId) continue;
    const candidate = normalizeUrl(entry.url);
    if (candidate && candidate === normalizedUrl) return entry;
  }
  return null;
}

export function toEvidenceSource(entry: EvidenceRegistryEntry): EvidenceSource {
  return {
    name: entry.title,
    owner: entry.owner,
    themes: entry.themes,
    note: entry.note,
    url: entry.url
  };
}

export function mergeActiveSources(
  seed: EvidenceSource[],
  registered: EvidenceRegistryEntry[]
): { source: EvidenceSource; sourceId: string }[] {
  const merged: { source: EvidenceSource; sourceId: string }[] = [];

  seed.forEach((source, index) => {
    merged.push({ source, sourceId: `seed:${index}:${source.url}` });
  });

  for (const entry of registered) {
    if (entry.status !== "active") continue;
    merged.push({ source: toEvidenceSource(entry), sourceId: `registry:${entry.id}` });
  }

  return merged;
}
