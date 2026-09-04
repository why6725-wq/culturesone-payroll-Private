import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import { dateDot, ym } from "@/lib/format";
import YearSelect from "@/components/YearSelect";
import EmployeeTabs from "@/components/EmployeeTabs";

// 직원 메인: 본인 급여명세서 목록 (확정본만, RLS + 뷰로 보장)
export default async function HomePage({ searchParams }: { searchParams: { year?: string } }) {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");

  const supabase = createClient();
  const { data: all } = await supabase
    .from("v_my_statements")
    .select("id, pay_year, pay_month, pay_date")
    .order("pay_year", { ascending: false })
    .order("pay_month", { ascending: false });

  const { data: corr } = await supabase.rpc("my_corrections");
  const { count: certBadge } = await supabase.from("certificate_requests").select("id", { count: "exact", head: true })
    .eq("employee_id", user.employeeId).eq("status", "ISSUED").eq("print_count", 0);
  const corrections = (corr ?? []) as { pay_year: number; pay_month: number; started_at: string; expected_at: string | null }[];
  const rows = all ?? [];
  const years = Array.from(new Set([...rows.map((r) => r.pay_year), ...corrections.map((c) => c.pay_year)])).sort((a, b) => b - a);
  const year = Number(searchParams.year) || years[0] || new Date().getFullYear();
  const list = rows.filter((r) => r.pay_year === year);
  const corrList = corrections.filter((c) => c.pay_year === year);
  const fmt = (iso: string) => new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <>
      <AppHeader user={user} />
      <EmployeeTabs certBadge={certBadge ?? 0} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px]">안녕하세요, <b>{user.employee?.name}</b>님.</p>
          {years.length > 0 && <YearSelect years={years} value={year} />}
        </div>

        {corrList.length > 0 && (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
            {corrList.map((c) => (
              <p key={`${c.pay_year}-${c.pay_month}`}>
                <b>{ym(c.pay_year, c.pay_month)} 급여명세서는 현재 정정 중입니다.</b>{" "}
                {c.expected_at ? `${fmt(c.expected_at)} 이후에 다시 확인해 주세요.` : "담당자 확인이 끝나면 다시 게시됩니다."}
              </p>
            ))}
          </div>
        )}

        <ul className="card mt-6 divide-y divide-line">
          {list.length === 0 && corrList.length === 0 && (
            <li className="px-5 py-10 text-center text-[15px] text-muted">확정된 급여명세서가 아직 없습니다.</li>
          )}
          {list.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[16px] font-medium">{ym(s.pay_year, s.pay_month)}</p>
                <p className="mt-0.5 text-[13px] text-muted">지급일 {dateDot(s.pay_date)}</p>
              </div>
              <Link href={`/payroll/${s.id}`} className="btn-outline py-2 text-[14px]">급여명세서 보기</Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
