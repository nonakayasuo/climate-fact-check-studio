import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ResearchLogApiError } from "@/lib/types";

function resolveSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey };
}

export function getSupabaseServerClient(): SupabaseClient {
  const { url, anonKey } = resolveSupabaseConfig();
  if (!url || !anonKey) {
    const error: ResearchLogApiError = {
      code: "CONFIG_MISSING",
      message: "Supabase 接続設定が不足しています。SUPABASE_URL と SUPABASE_ANON_KEY を確認してください。",
      retryable: false
    };
    throw Object.assign(new Error(error.message), { apiError: error });
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

