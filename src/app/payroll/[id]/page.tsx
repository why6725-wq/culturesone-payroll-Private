import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import PayslipViewer from "@/components/PayslipViewer";

// 급여명세서 상세.
// URL의 id를 바꿔 다른 직원 것을 요청해도 RLS 정책(본인+확정+현재본)에 걸려 0건 → 404.
// 관리자는 전체 조회 가능(관리자 화면에서도 같은 페이지를 재사용).
export default async function StatementPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();

  const { data: s } = await supabase
    .from("payroll_statements")
    .select("id, pay_year, pay_month, pay_date, version, status, total_earnings, total_deductions, net_pay, note, employees(name, department, position), payroll_items(amount, sort_order, pay_item_types(name, category, sort_order))")
    .eq("id", params.id)
    .maybeSingle();

  if (!s) notFound();

  const emp = (Array.isArray(s.employees) ? s.employees[0] : s.employees) as any;
  const items = (s.payroll_items ?? []).map((i: any) => ({
    name: i.pay_item_types?.name as string, category: i.pay_item_types?.category as string,
    amount: Number(i.amount), order: i.pay_item_types?.sort_order ?? i.sort_order
  })).sort((a, b) => a.order - b.order);

  if (user.role === "EMPLOYEE") await supabase.rpc("mark_statement_viewed", { p_statement_id: s.id });

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-2 py-4 sm:px-4 sm:py-6">
        <PayslipViewer statementId={s.id} backHref={user.role === "ADMIN" ? "/admin" : "/"} data={{
          showZero: user.role === "ADMIN",
          pay_year: s.pay_year, pay_month: s.pay_month, pay_date: s.pay_date, note: s.note,
          total_earnings: Number(s.total_earnings), total_deductions: Number(s.total_deductions), net_pay: Number(s.net_pay),
          employee: { name: emp?.name ?? "", department: emp?.department ?? null, position: emp?.position ?? null },
          earnings: items.filter((i) => i.category === "EARNING"),
          deductions: items.filter((i) => i.category === "DEDUCTION")
        }} />
      </main>
    </>
  );
}
