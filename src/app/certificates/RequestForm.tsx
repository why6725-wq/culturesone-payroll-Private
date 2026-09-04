"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { requestCertificate, type CertState } from "./actions";

function Submit() { const { pending } = useFormStatus(); return <button className="btn-primary" disabled={pending}>{pending ? "신청 중..." : "신청하기"}</button>; }

export default function RequestForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("EMPLOYMENT");
  const [state, action] = useFormState<CertState, FormData>(requestCertificate, {});
  return (
    <div className="mt-4">
      {!open && <button className="btn-primary" onClick={() => setOpen(true)}>증명서 신청</button>}
      {open && (
        <form action={action} className="card grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="type">증명서 종류</label>
            <select id="type" name="type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="EMPLOYMENT">재직증명서</option>
              <option value="CAREER">경력증명서</option>
              <option value="INCOME">급여증명서</option>
            </select>
          </div>
          {type === "INCOME" && (
            <div>
              <label className="label" htmlFor="months">급여 내역 기간</label>
              <select id="months" name="months" className="input" defaultValue="3">
                <option value="3">최근 3개월</option><option value="6">최근 6개월</option><option value="12">최근 12개월</option>
              </select>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="purpose">사용용도</label>
            <input id="purpose" name="purpose" className="input" maxLength={100} placeholder="예: 은행 대출 제출용, 비자 발급용" required />
          </div>
          {state.error && <p className="text-[13px] text-red-600 sm:col-span-2">{state.error}</p>}
          {state.ok && <p className="rounded-md bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800 sm:col-span-2">{state.ok}</p>}
          <div className="flex gap-2 sm:col-span-2"><Submit /><button type="button" className="btn-outline" onClick={() => setOpen(false)}>닫기</button></div>
        </form>
      )}
    </div>
  );
}
