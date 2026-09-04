"use client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import Logo from "@/components/Logo";
import { login, type AuthState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full" disabled={pending}>{pending ? "확인 중..." : "로그인"}</button>;
}

export default function LoginPage() {
  const [state, action] = useFormState<AuthState, FormData>(login, {});
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-8 text-center">
          <Logo variant="stacked" />
          <p className="mt-2 text-[15px] text-muted">컬처스원 급여명세서</p>
        </div>
        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">이메일</label>
            <input id="email" name="email" type="email" autoComplete="username" className="input" placeholder="name@ninemc.com" required />
          </div>
          <div>
            <label className="label" htmlFor="password">비밀번호</label>
            <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
          </div>
          {state.error && <p className="text-[13px] text-red-600">{state.error}</p>}
          <Submit />
        </form>
        <div className="mt-5 text-center text-[13px]">
          <Link href="/reset-password" className="text-muted hover:text-ink">비밀번호를 잊으셨나요?</Link>
        </div>
      </div>
    </main>
  );
}
