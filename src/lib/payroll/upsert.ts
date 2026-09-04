import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StatementInput = {
  employeeId: string; year: number; month: number; payDate: string;
  items: { itemTypeId: string; amount: number }[];
  totalEarnings: number; totalDeductions: number; netPay: number; note: string | null;
};

// 등록완료(REGISTERED) 상태로 저장. 같은 달에 작성중/등록완료 건이 있으면 덮어쓰고, 확정 건이 있으면 거부.
// service role 클라이언트로 호출되므로 호출 전 requireAdmin() 필수.
export async function upsertRegisteredStatement(sb: SupabaseClient, input: StatementInput, actorId: string) {
  const { data: cur } = await sb.from("payroll_statements").select("id, status, version")
    .eq("employee_id", input.employeeId).eq("pay_year", input.year).eq("pay_month", input.month).eq("is_current", true).maybeSingle();

  if (cur && cur.status === "CONFIRMED") throw new Error("이미 확정된 명세서입니다. 정정 기능을 사용하세요.");

  let statementId: string;
  if (cur) {
    statementId = cur.id;
    const { error } = await sb.from("payroll_statements").update({
      pay_date: input.payDate, total_earnings: input.totalEarnings, total_deductions: input.totalDeductions,
      net_pay: input.netPay, note: input.note, status: "REGISTERED"
    }).eq("id", cur.id);
    if (error) throw new Error(error.message);
    await sb.from("payroll_items").delete().eq("statement_id", cur.id);
  } else {
    const { data: mx } = await sb.from("payroll_statements").select("version")
      .eq("employee_id", input.employeeId).eq("pay_year", input.year).eq("pay_month", input.month)
      .order("version", { ascending: false }).limit(1).maybeSingle();
    const { data: ins, error } = await sb.from("payroll_statements").insert({
      employee_id: input.employeeId, pay_year: input.year, pay_month: input.month, pay_date: input.payDate,
      version: (mx?.version ?? 0) + 1, is_current: true, status: "REGISTERED",
      total_earnings: input.totalEarnings, total_deductions: input.totalDeductions, net_pay: input.netPay,
      note: input.note, created_by: actorId
    }).select("id").single();
    if (error) throw new Error(error.message);
    statementId = ins.id;
  }

  const items = input.items.map((i, idx) => ({ statement_id: statementId, item_type_id: i.itemTypeId, amount: i.amount, sort_order: idx }));
  if (items.length) {
    const { error } = await sb.from("payroll_items").insert(items);
    if (error) throw new Error(error.message);
  }
  return { statementId, replaced: !!cur };
}
