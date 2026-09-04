"use client";
import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveManualStatement, type ActionState } from "../actions";
import { won } from "@/lib/format";

type Item = { id: string; name: string; category: "EARNING" | "DEDUCTION"; sort_order: number };

function Submit() { const { pending } = useFormStatus(); return <button className="btn-primary" disabled={pending}>{pending ? "저장 중..." : "등록완료로 저장"}</button>; }

export default function EntryForm({ year, month, defaultEmployee, defaultPayDate, employees, items }:
  { year: number; month: number; defaultEmployee: string; defaultPayDate: string; employees: { id: string; name: string; department: string | null }[]; items: Item[] }) {
  const [state, action] = useFormState<ActionState, FormData>(saveManualStatement, {});
  const [vals, setVals] = useState<Record<string, string>>({});
  const num = (s?: string) => Number((s ?? "").replace(/[,\s]/g, "")) || 0;
  const [tE, tD] = useMemo(() => {
    let e = 0, d = 0;
    for (const it of items) { const n = num(vals[it.id]); if (it.category === "EARNING") e += n; else d += n; }
    return [e, d];
  }, [vals, items]);
  const group = (c: Item["category"]) => items.filter((i) => i.category === c);

  return (
    <form action={action} className="card mt-5 p-5">
      <input type="hidden" name="year" value={year} /><input type="hidden" name="month" value={month} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="employee_id">직원</label>
          <select id="employee_id" name="employee_id" className="input" defaultValue={defaultEmployee} required>
            <option value="">선택</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}{e.department ? ` · ${e.department}` : ""}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pay_date">지급일 ({year}년 {month}월)</label>
          <input id="pay_date" name="pay_date" type="date" className="input" defaultValue={defaultPayDate} required />
        </div>
      </div>

      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        {(["EARNING", "DEDUCTION"] as const).map((c) => (
          <div key={c}>
            <h2 className="mb-2 border-b border-ink pb-1 text-[15px] font-semibold">{c === "EARNING" ? "지급내역" : "공제내역"}</h2>
            {group(c).map((it) => (
              <div key={it.id} className="flex items-center gap-3 py-1">
                <label className="w-28 shrink-0 text-[14px]" htmlFor={`item_${it.id}`}>{it.name}</label>
                <input id={`item_${it.id}`} name={`item_${it.id}`} inputMode="numeric" className="input py-1.5 text-right tabular-nums"
                  value={vals[it.id] ?? ""} onChange={(e) => setVals({ ...vals, [it.id]: e.target.value })} placeholder="0" />
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-line pt-2 text-[14px] font-semibold">
              <span>{c === "EARNING" ? "지급총액" : "공제총액"}</span><span className="tabular-nums">{won(c === "EARNING" ? tE : tD)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t-2 border-ink pt-3">
        <span className="font-semibold">차감지급액</span><span className="text-xl font-semibold tabular-nums">{won(tE - tD)}원</span>
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="note">계산 방법 또는 비고 (선택)</label>
        <textarea id="note" name="note" rows={2} className="input" placeholder="예: 연장근로 10시간 × 통상시급 15,000원" />
      </div>

      {state.error && <p className="mt-3 text-[13px] text-red-600">{state.error}</p>}
      {state.ok && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">{state.ok}</p>}

      <div className="mt-5 flex gap-2">
        <Submit />
        <Link href={`/admin?y=${year}&m=${month}`} className="btn-outline">관리자 화면으로</Link>
      </div>
    </form>
  );
}
