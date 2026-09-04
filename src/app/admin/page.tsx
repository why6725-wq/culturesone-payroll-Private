import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import MonthPicker from "@/components/MonthPicker";
import StatementTable from "./StatementTable";
import ConfirmMonthButton from "./ConfirmMonthButton";

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

        <StatementTable rows={rows} y={y} m={m} />
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
