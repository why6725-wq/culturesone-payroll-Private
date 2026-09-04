"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { issueDirect } from "./actions";

function Submit() { const { pending } = useFormStatus(); return <button className="btn-primary" disabled={pending}>{pending ? "발급 중..." : "즉시 발급"}</button>; }

export default function DirectIssueForm({ employees }: { employees: { id: string; name: string; department: string | null; employment_status: string }[] }) {
  const [type, setType] = useState("CAREER");
  const [state, action] = useFormState<{ error?: string; ok?: string; id?: string }, FormData>(issueDirect as any, {});
  return (
    <form action={action} className="card mt-2 grid gap-3 p-5 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="d_emp">직원</label>
        <select id="d_emp" name="employee_id" className="input" required defaultValue="">
          <option value="">선택</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}{e.department ? ` · ${e.department}` : ""}{e.employment_status === "RESIGNED" ? " (퇴사)" : ""}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="d_type">종류</label>
        <select id="d_type" name="type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="CAREER">경력증명서</option><option value="EMPLOYMENT">재직증명서</option><option value="INCOME">급여증명서</option>
        </select>
      </div>
      {type === "INCOME" ? (
        <div><label className="label" htmlFor="d_m">기간</label>
          <select id="d_m" name="months" className="input" defaultValue="3"><option value="3">3개월</option><option value="6">6개월</option><option value="12">12개월</option></select></div>
      ) : <div />}
      <div className="sm:col-span-2"><label className="label" htmlFor="d_p">사용용도</label><input id="d_p" name="purpose" className="input" required maxLength={100} placeholder="예: 이직 제출용" /></div>
      <div><label className="label" htmlFor="d_r">주민등록번호 전체 (선택)</label><input id="d_r" name="rrn" className="input tabular-nums" inputMode="numeric" maxLength={14} placeholder="비우면 생년월일만" autoComplete="off" /></div>
      <div className="flex items-end"><Submit /></div>
      {state.error && <p className="text-[13px] text-red-600 sm:col-span-4">{state.error}</p>}
      {state.ok && <p className="text-[13px] text-emerald-800 sm:col-span-4">{state.ok} {state.id && <Link href={`/certificates/${state.id}`} className="underline">바로 보기 / 출력</Link>}</p>}
    </form>
  );
}
