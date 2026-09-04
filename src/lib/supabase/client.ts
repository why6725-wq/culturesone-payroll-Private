"use client";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";
import { createBrowserClient } from "@supabase/ssr";

// 브라우저용. anon key만 사용. RLS가 적용된다.
export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}
