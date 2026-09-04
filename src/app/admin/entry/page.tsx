import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { lastDayOf } from "@/lib/payroll/columns";
import EntryForm from "./EntryForm";

export default async function EntryPage({ searchParams }: { searchParams: { y?: string; m?: string; e?: string } }) {
  const user = await requireAdmin();
  const now = new Date();
  const y = Number(searchParams.y) || now.getFullYear();
  const m = Number(searchParams.m) || now.getMonth() + 1;
  const supabase = createClient();
  const [{ data: emps }, { data: items }] = await Promise.all([
    supabase.from("employees").select("id, name, department").eq("employment_status", "ACTIVE").order("name"),
    supabase.from("pay_item_types").select("id, name, category, sort_order").eq("is_active", true).order("category").order("sort_order")
  ]);
  // 해당 직원·연월에 확정 전(작성중/등록완료) 자료가 있으면 불러와서 수정 모드로
  let existing: { pay_date: string; note: string | null; items: Record<string, number> } | null = null;
  if (searchParams.e) {
    const { data: s } = await supabase.from("payroll_statements").select("pay_date, note, status, payroll_items(item_type_id, amount)")
      .eq("employee_id", searchParams.e).eq("pay_year", y).eq("pay_month", m).eq("is_current", true).maybeSingle();
    if (s && (s.status === "REGISTERED" || s.status === "DRAFT")) {
      existing = { pay_date: s.pay_date, note: s.note, items: Object.fromEntries((s.payroll_items ?? []).map((i: any) => [i.item_type_id, Number(i.amount)])) };
    }
  }
  return (
    <>
      <main className="max-w-3xl px-4 py-6 md:px-8">
        <h1 className="text-xl font-semibold">{existing ? "급여자료 수정" : "급여자료 직접 입력"}</h1>
        <p className="mt-1 text-[14px] text-muted">
          {existing ? "등록된 값을 불러왔습니다. 고친 뒤 저장하면 덮어씁니다(등록완료 상태 유지)." : "한두 명만 등록하거나 정정할 때 사용합니다. 저장하면 등록완료 상태가 되고, 관리자 화면에서 확정해야 직원에게 보입니다."}
        </p>
        <EntryForm year={y} month={m} defaultEmployee={searchParams.e ?? ""} defaultPayDate={existing?.pay_date ?? lastDayOf(y, m)}
          defaultNote={existing?.note ?? ""} defaultItems={existing?.items ?? {}} lockEmployee={!!existing}
          employees={emps ?? []} items={(items ?? []) as any} />
      </main>
    </>
  );
}
