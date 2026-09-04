"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import StatementActions from "./StatementActions";
import { bulkStatements } from "./actions";
import { STATUS_LABEL, dateDot, won } from "@/lib/format";

const DOT: Record<string, string> = {
  NONE: "bg-red-500", DRAFT: "bg-gray-400", REGISTERED: "bg-amber-400",
  CONFIRMED: "bg-emerald-500", CORRECTED: "bg-blue-400", CANCELLED: "bg-gray-300", VOID: "bg-gray-300"
};

export type Row = {
  employee_id: string; email: string; name: string; department: string | null;
  statement_id: string | null; status: string | null; version: number | null;
  net_pay: number | null; first_viewed_at: string | null; correction_expected_at: string | null;
};

// 관리자 월별 표: 체크박스 일괄 처리 + 행별 [수정]/[확정]/[취소]/[정정]
export default function StatementTable({ rows, y, m }: { rows: Row[]; y: number; m: number }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const selectable = rows.filter((r) => r.statement_id && (r.status === "REGISTERED" || r.status === "DRAFT"));
  const allChecked = selectable.length > 0 && selectable.every((r) => sel.has(r.statement_id!));
  const toggleAll = () => setSel(allChecked ? new Set() : new Set(selectable.map((r) => r.statement_id!)));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const run = (action: "confirm" | "cancel") => {
    const ids = Array.from(sel);
    if (!ids.length) return;
    let reason: string | null = null;
    if (action === "confirm") { if (!confirm(`선택한 ${ids.length}건을 확정할까요? 확정 즉시 직원에게 보입니다.`)) return; }
    else { reason = prompt(`선택한 ${ids.length}건을 취소합니다. 사유를 입력하세요. (기록은 처리 이력에 남습니다)`); if (!reason) return; }
    start(async () => {
      const r = await bulkStatements(ids, action, reason ?? undefined);
      setMsg(`${action === "confirm" ? "확정" : "취소"} ${r.ok}건 완료${r.failed.length ? ` / 실패 ${r.failed.length}건: ${r.failed[0]}` : ""}`);
      setSel(new Set());
    });
  };

  return (
    <>
      {selectable.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-muted">선택 {sel.size}건</span>
          <button className="btn-primary py-1.5 text-[13px]" disabled={pending || !sel.size} onClick={() => run("confirm")}>선택 확정</button>
          <button className="btn-outline py-1.5 text-[13px]" disabled={pending || !sel.size} onClick={() => run("cancel")}>선택 취소</button>
          {msg && <span className="text-muted">{msg}</span>}
        </div>
      )}
      <div className="table-wrap mt-3"><table className="card w-full text-[14px]">
        <thead className="text-left text-[12px] text-muted">
          <tr className="border-b border-line">
            <th className="w-8 px-3 py-2.5">{selectable.length > 0 && <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-navy" aria-label="전체 선택" />}</th>
            <th className="px-3 py-2.5 font-normal">직원</th>
            <th className="px-3 py-2.5 font-normal">부서</th>
            <th className="px-3 py-2.5 font-normal">상태</th>
            <th className="hidden px-3 py-2.5 text-right font-normal sm:table-cell">실지급액</th>
            <th className="hidden px-3 py-2.5 font-normal sm:table-cell">최초열람</th>
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">재직 중인 직원이 없습니다. 먼저 직원을 등록하세요.</td></tr>}
          {rows.map((r) => {
            const st = r.status ?? "NONE";
            const editable = r.statement_id && (st === "REGISTERED" || st === "DRAFT");
            const overdue = r.correction_expected_at && new Date(r.correction_expected_at) < new Date();
            return (
              <tr key={r.employee_id} className="border-b border-line last:border-0">
                <td className="px-3 py-3">{editable && <input type="checkbox" checked={sel.has(r.statement_id!)} onChange={() => toggle(r.statement_id!)} className="accent-navy" aria-label={`${r.name} 선택`} />}</td>
                <td className="px-3 py-3">
                  {r.statement_id ? <Link href={`/payroll/${r.statement_id}`} className="hover:underline">{r.name}</Link> : r.name}
                  <span className="ml-2 hidden text-[12px] text-muted sm:inline">{r.email}</span>
                </td>
                <td className="px-3 py-3 text-muted">{r.department ?? "-"}</td>
                <td className="px-3 py-3">
                  <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${DOT[st]}`} />{STATUS_LABEL[st]}
                  {(r.version ?? 0) > 1 && <span className="ml-1 text-[11px] text-muted">v{r.version}</span>}
                  {st === "REGISTERED" && (r.version ?? 0) > 1 && (
                    <span className={`block text-[11px] ${overdue ? "text-red-600" : "text-muted"}`}>
                      정정 중{r.correction_expected_at ? ` · 예정 ${new Date(r.correction_expected_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}{overdue ? " (지남)" : ""}
                    </span>
                  )}
                </td>
                <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell">{r.net_pay != null ? won(r.net_pay) : "-"}</td>
                <td className="hidden px-3 py-3 text-muted sm:table-cell">{r.first_viewed_at ? dateDot(r.first_viewed_at) : "-"}</td>
                <td className="px-3 py-3">
                  <span className="flex items-center justify-end gap-3 whitespace-nowrap text-[13px]">
                    {editable && <Link href={`/admin/entry?y=${y}&m=${m}&e=${r.employee_id}`} className="text-navy hover:underline">수정</Link>}
                    {r.statement_id
                      ? <StatementActions id={r.statement_id} status={st} />
                      : <Link href={`/admin/entry?y=${y}&m=${m}&e=${r.employee_id}`} className="text-muted hover:underline">입력</Link>}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table></div>
    </>
  );
}
