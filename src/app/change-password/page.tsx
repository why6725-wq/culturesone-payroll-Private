"use client";
import { Suspense } from "react";
import { useFormState } from "react-dom";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { changePassword, type AuthState } from "../login/actions";

function ChangePasswordForm() {
  const [state, action] = useFormState<AuthState, FormData>(changePassword, {});
  const first = useSearchParams().get("first") === "1";
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 text-center"><Logo variant="stacked" /><p className="mt-2 text-[15px] text-muted">비밀번호 변경</p></div>
        {first && <p className="mb-4 rounded-md bg-[#EEF3F8] px-3 py-2 text-[13px] text-navy">처음 로그인하셨습니다. 사용할 비밀번호를 설정하세요.</p>}
        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="password">새 비밀번호 (8자 이상)</label>
            <input id="password" name="password" type="password" autoComplete="new-password" className="input" minLength={8} required />
          </div>
          <div>
            <label className="label" htmlFor="confirm">새 비밀번호 확인</label>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="input" minLength={8} required />
          </div>
          {state.error && <p className="text-[13px] text-red-600">{state.error}</p>}
          <button className="btn-primary w-full">비밀번호 변경</button>
        </form>
      </div>
    </main>
  );
}

export default function ChangePasswordPage() {
  return <Suspense><ChangePasswordForm /></Suspense>;
}
