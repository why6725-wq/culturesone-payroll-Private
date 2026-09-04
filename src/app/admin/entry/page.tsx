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
  return (
    <>
      <main className="max-w-3xl px-4 py-6 md:px-8">
        <h1 className="text-xl font-semibold">급여자료 직접 입력</h1>
        <p className="mt-1 text-[14px] text-muted">한두 명만 등록하거나 정정할 때 사용합니다. 저장하면 등록완료 상태가 되고, 관리자 화면에서 확정해야 직원에게 보입니다.</p>
        <EntryForm year={y} month={m} defaultEmployee={searchParams.e ?? ""} defaultPayDate={lastDayOf(y, m)}
          employees={emps ?? []} items={(items ?? []) as any} />
      </main>
    </>
  );
}
