"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseWorkbook, type ParsedRow } from "@/lib/payroll/parse";

export type PreviewResult = { headerErrors: string[]; rows: ParsedRow[]; error?: string };

// 1단계: 파일 분석 → 미리보기 (DB 저장 없음). 관리자 세션으로 조회(RLS: 관리자 전체 조회 허용)
export async function previewUpload(form: FormData): Promise<PreviewResult> {
  await requireAdmin();
  const file = form.get("file");
  const year = Number(form.get("year")); const month = Number(form.get("month"));
  if (!(file instanceof File) || !file.size) return { headerErrors: [], rows: [], error: "파일을 선택하세요." };
  if (file.size > 5 * 1024 * 1024) return { headerErrors: [], rows: [], error: "5MB 이하 파일만 업로드할 수 있습니다." };
  if (!year || !month) return { headerErrors: [], rows: [], error: "지급 연월이 올바르지 않습니다." };

  const sb = createClient();
  const [{ data: items }, { data: emps }] = await Promise.all([
    sb.from("pay_item_types").select("id, code, name, category, sort_order").eq("is_active", true),
    sb.from("employees").select("id, email, name, employment_status")
  ]);
  try {
    const { rows, headerErrors } = parseWorkbook(await file.arrayBuffer(), year, month, (items ?? []) as any, emps ?? []);
    const ids = rows.map((r) => r.employeeId).filter(Boolean) as string[];
    if (ids.length) {
      const { data: confirmed } = await sb.from("payroll_statements").select("employee_id")
        .in("employee_id", ids).eq("pay_year", year).eq("pay_month", month).eq("is_current", true).eq("status", "CONFIRMED");
      const set = new Set((confirmed ?? []).map((c) => c.employee_id));
      rows.forEach((r) => { if (r.employeeId && set.has(r.employeeId)) r.errors.push("이미 확정된 명세서가 있습니다. 관리자 화면에서 [정정] 후 다시 업로드하세요."); });
    }
    return { rows, headerErrors };
  } catch (e: any) {
    return { headerErrors: [], rows: [], error: `파일을 읽을 수 없습니다: ${e.message ?? e}` };
  }
}

// 2단계: 정상 행만 등록(REGISTERED). 합계는 DB 함수가 다시 검증한다.
export async function registerRows(year: number, month: number, rows: ParsedRow[]): Promise<{ ok: number; failed: { email: string; reason: string }[] }> {
  await requireAdmin();
  const sb = createClient();
  let ok = 0; const failed: { email: string; reason: string }[] = [];
  for (const r of rows) {
    if (r.errors.length || !r.employeeId) continue;
    const { error } = await sb.rpc("admin_upsert_statement", {
      p_employee_id: r.employeeId, p_year: year, p_month: month, p_pay_date: r.payDate,
      p_items: r.items.map((i) => ({ item_type_id: i.itemTypeId, amount: i.amount })),
      p_total_earnings: r.totalEarnings, p_total_deductions: r.totalDeductions, p_net_pay: r.netPay, p_note: r.note, p_source: "excel"
    });
    if (error) failed.push({ email: r.email, reason: error.message.replace(/^.*?: /, "") }); else ok++;
  }
  await sb.rpc("admin_log_excel_upload", { p_year: year, p_month: month, p_registered: ok, p_failed: failed.length, p_skipped: rows.filter((r) => r.errors.length).length });
  revalidatePath("/admin");
  return { ok, failed };
}
