import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";
import { cookies } from "next/headers";

// 서버 컴포넌트/서버 액션용. 로그인 사용자 세션으로 동작하므로 RLS가 그대로 적용된다.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // 서버 컴포넌트에서 호출 시 set 불가 — middleware가 세션을 갱신하므로 무시
          }
        }
      }
    }
  );
}
