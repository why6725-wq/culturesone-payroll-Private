"use client";
import { useFormState } from "react-dom";
import Link from "next/link";
import Logo from "@/components/Logo";
import { requestPasswordReset, type AuthState } from "../login/actions";

export default function ResetPasswordPage() {
  const [state, action] = useFormState<AuthState, FormData>(requestPasswordReset, {});
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 text-center"><Logo variant="stacked" /><p className="mt-2 text-[15px] text-muted">비밀번호 재설정</p></div>
        {state.ok ? (
          <p className="text-[15px] leading-relaxed">입력한 주소로 계정이 있으면 재설정 링크를 보냈습니다. 메일함을 확인하세요.</p>
        ) : (
          <form action={action} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">회사 이메일</label>
              <input id="email" name="email" type="email" className="input" required />
            </div>
            {state.error && <p className="text-[13px] text-red-600">{state.error}</p>}
            <button className="btn-primary w-full">재설정 링크 보내기</button>
          </form>
        )}
        <div className="mt-5 text-center text-[13px]"><Link href="/login" className="text-muted hover:text-ink">로그인으로 돌아가기</Link></div>
      </div>
    </main>
  );
}
