import "server-only";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";

// service role 클라이언트. RLS를 우회하므로 반드시 requireAdmin() 통과 후에만 사용.
// 이 파일은 "server-only" 이므로 클라이언트 번들에 포함되면 빌드가 실패한다.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
