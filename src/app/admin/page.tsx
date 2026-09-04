import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import MonthPicker from "@/components/MonthPicker";
import StatementActions from "./StatementActions";
import ConfirmMonthButton from "./ConfirmMonthButton";
import { STATUS_LABEL, dateDot, won } from "@/lib/format";

const DOT: Record<string, string> = {
  NONE: "bg-red-500", DRAFT: "bg-gray-400", REGISTERED: "bg-amber-400",
  CONFIRMED: "bg-emerald-500", CORRECTED: "bg-blue-400", CANCELLED: "bg-gray-300", VOID: "bg-gray-300"
};

export default async function AdminHome({ searchParams }: { searchParams: { y?: string; m?: string } }) {
  const user = await requireAdmin();
  const now = new Date();
  const y = Number(searchParams.y) || now.getFullYear();
  const m = Number(searchParams.m) || now.getMonth() + 1;

  const supabase = createClient();
  const { data } = await supabase.rpc("admin_month_overview", { p_year: y, p_month: m });
  const rows = (data ?? []) as any[];

  const total = rows.length;
  const registered = rows.filter((r) => r.status && !["CANCELLED", "VOID"].includes(r.status)).length;
  const confirmed = rows.filter((r) => r.status === "CONFIRMED").length;
  const missing = total - registered;
  const toConfirm = rows.filter((r) => r.status === "REGISTERED").length;

  return (
    <>
      <main className="px-4 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">{y}년 {m}월 급여명세서</h1>
          <MonthPicker year={y} month={m} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="전체 직원" value={`${total}명`} />
          <Stat label="등록 완료" value={`${registered}명`} />
          <Stat label="미등록" value={`${missing}명`} warn={missing > 0} />
          <Stat label="확정" value={`${confirmed}명`} />
        </div>

        {missing > 0 ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-[14px] text-red-700">
            미등록 직원 {missing}명이 있습니다. 전원 등록·확정 전에는 이번 달 처리가 완료되지 않습니다.
          </p>
        ) : confirmed === total && total > 0 ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[14px] text-emerald-700">
            {y}년 {m}월 전체 처리 완료
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link href={`/admin/upload?y=${y}&m=${m}`} className="btn-primary">엑셀 일괄 업로드</Link>
          <Link href={`/admin/entry?y=${y}&m=${m}`} className="btn-outline">급여자료 직접 입력</Link>
          <span className="ml-auto"><ConfirmMonthButton year={y} month={m} count={toConfirm} /></span>
        </div>

        <table className="card mt-6 w-full text-[14px]">
          <thead className="text-left text-[12px] text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-2.5 font-normal">직원</th>
              <th className="px-4 py-2.5 font-normal">부서</th>
              <th className="px-4 py-2.5 font-normal">상태</th>
              <th className="hidden px-4 py-2.5 text-right font-normal sm:table-cell">실지급액</th>
              <th className="hidden px-4 py-2.5 font-normal sm:table-cell">최초열람</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">재직 중인 직원이 없습니다. 먼저 직원을 등록하세요.</td></tr>}
            {rows.map((r) => {
              const st = r.status ?? "NONE";
              return (
                <tr key={r.employee_id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    {r.statement_id ? <Link href={`/payroll/${r.statement_id}`} className="hover:underline">{r.name}</Link> : r.name}
                    <span className="ml-2 hidden text-[12px] text-muted sm:inline">{r.email}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{r.department ?? "-"}</td>
                  <td className="px-4 py-3"><span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${DOT[st]}`} />{STATUS_LABEL[st]}{r.version > 1 && <span className="ml-1 text-[11px] text-muted">v{r.version}</span>}
                    {st === "REGISTERED" && r.version > 1 && (
                      <span className={`block text-[11px] ${r.correction_expected_at && new Date(r.correction_expected_at) < new Date() ? "text-red-600" : "text-muted"}`}>
                        정정 중{r.correction_expected_at ? ` · 예정 ${new Date(r.correction_expected_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}
                        {r.correction_expected_at && new Date(r.correction_expected_at) < new Date() ? " (지남)" : ""}
                      </span>
                    )}</td>
                  <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{r.net_pay != null ? won(r.net_pay) : "-"}</td>
                  <td className="hidden px-4 py-3 text-muted sm:table-cell">{r.first_viewed_at ? dateDot(r.first_viewed_at) : "-"}</td>
                  <td className="px-4 py-3">{r.statement_id ? <StatementActions id={r.statement_id} status={st} /> : <Link href={`/admin/entry?y=${y}&m=${m}&e=${r.employee_id}`} className="block text-right text-[13px] text-muted hover:underline">입력</Link>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-[12px] text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${warn ? "text-red-600" : ""}`}>{value}</p>
    </div>
  );
}
