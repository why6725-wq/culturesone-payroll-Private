"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/env";

export type AuthState = { error?: string; ok?: boolean };

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "이메일과 비밀번호를 입력하세요." };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };

  // 비활성 계정(퇴사자)은 프로필 단계에서 차단
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", user!.id).maybeSingle();
  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return { error: "사용할 수 없는 계정입니다. 관리자에게 문의하세요." };
  }
  redirect("/");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "이메일을 입력하세요." };
  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/change-password`
  });
  // 계정 존재 여부를 노출하지 않기 위해 항상 동일 메시지
  return { ok: true };
}

export async function changePassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };
  if (password !== confirm) return { error: "비밀번호 확인이 일치하지 않습니다." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "비밀번호를 변경하지 못했습니다. 다시 시도하세요." };

  // must_change_password 해제는 service role로 (profiles에 직원 UPDATE 정책 없음)
  const { createAdminClient } = await import("@/lib/supabase/admin");
  await createAdminClient().from("profiles").update({ must_change_password: false }).eq("id", user!.id);
  redirect("/");
}
