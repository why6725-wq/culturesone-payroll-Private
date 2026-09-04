"use client";
import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addItemType, updateItemType, type ActionState } from "../actions";

type Item = { id: string; name: string; category: "EARNING" | "DEDUCTION"; sort_order: number; is_active: boolean };

function Submit() { const { pending } = useFormStatus(); return <button className="btn-outline" disabled={pending}>{pending ? "추가 중..." : "항목 추가"}</button>; }

// 급여 항목(지급/공제) 관리 — 이름 변경, 순서, 사용 여부. 삭제는 없고 "사용 안 함"으로 숨김(과거 명세서 보존).
export default function ItemTypesManager({ items }: { items: Item[] }) {
  const [state, action] = useFormState<ActionState, FormData>(addItemType, {});
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const save = (it: Item, patch: Partial<Item>) => start(async () => {
    const n = { ...it, ...patch };
    const r = await updateItemType(n.id, n.name, n.is_active, n.sort_order);
    setMsg(r.error ? r.error : "저장했습니다.");
  });
  const group = (c: Item["category"]) => items.filter((i) => i.category === c);

  return (
    <div className="card mt-6 p-5">
      <h2 className="text-[15px] font-semibold">급여 항목 관리</h2>
      <p className="mt-1 text-[13px] text-muted">명세서 항목과 엑셀 템플릿 컬럼이 여기 기준으로 만들어집니다. 과거 명세서는 그대로 유지되므로 삭제 대신 ‘사용 안 함’으로 숨기세요. 순서는 숫자가 작을수록 위.</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {(["EARNING", "DEDUCTION"] as const).map((c) => (
          <div key={c}>
            <h3 className="mb-2 border-b border-ink pb-1 text-[14px] font-semibold">{c === "EARNING" ? "지급 항목" : "공제 항목"}</h3>
            <ul className="space-y-1.5">
              {group(c).map((it) => (
                <li key={it.id} className={`flex items-center gap-2 text-[13px] ${it.is_active ? "" : "opacity-50"}`}>
                  <input className="input w-16 py-1 text-center tabular-nums" defaultValue={it.sort_order} onBlur={(e) => Number(e.target.value) !== it.sort_order && save(it, { sort_order: Number(e.target.value) || it.sort_order })} aria-label="순서" />
                  <input className="input flex-1 py-1" defaultValue={it.name} onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== it.name && save(it, { name: e.target.value.trim() })} aria-label="항목명" />
                  <label className="flex items-center gap-1 whitespace-nowrap text-muted"><input type="checkbox" className="accent-navy" checked={it.is_active} onChange={(e) => save(it, { is_active: e.target.checked })} disabled={pending} />사용</label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <form action={action} className="mt-5 flex flex-wrap items-end gap-2">
        <div><label className="label" htmlFor="it_name">새 항목 이름</label><input id="it_name" name="name" className="input w-48" placeholder="예: 통신비" required /></div>
        <div><label className="label" htmlFor="it_cat">구분</label><select id="it_cat" name="category" className="input w-32"><option value="EARNING">지급</option><option value="DEDUCTION">공제</option></select></div>
        <Submit />
      </form>
      {(state.error || state.ok || msg) && <p className={`mt-2 text-[13px] ${state.error ? "text-red-600" : "text-emerald-800"}`}>{state.error || state.ok || msg}</p>}
    </div>
  );
}
