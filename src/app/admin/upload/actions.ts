"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseWorkbook, type ParsedRow } from "@/lib/payroll/parse";
import { upsertRegisteredStatement } from "@/lib/payroll/upsert";

export type PreviewResult = { headerErrors: string[]; rows: ParsedRow[]; error?: string };

// 1단계: 파일 분석 → 미리보기 (DB 저장 없음)
export async function previewUpload(form: FormData): Promise<PreviewResult> {
  await requireAdmin();
  const file = form.get("file");
  const year = Number(form.get("year")); const month = Number(form.get("month"));
  if (!(file instanceof File) || !file.size) return { headerErrors: [], rows: [], error: "파일을 선택하세요." };
  if (file.size > 5 * 1024 * 1024) return { headerErrors: [], rows: [], error: "5MB 이하 파일만 업로드할 수 있습니다." };
  if (!year || !month) return { headerErrors: [], rows: [], error: "지급 연월이 올바르지 않습니다." };

  const sb = createAdminClient();
  const [{ data: items }, { data: emps }] = await Promise.all([
    sb.from("pay_item_types").select("id, code, name, category, sort_order").eq("is_active", true),
    sb.from("employees").select("id, email, name, employment_status")
  ]);
  try {
    const { rows, headerErrors } = parseWorkbook(await file.arrayBuffer(), year, month, (items ?? []) as any, emps ?? []);
    // 이미 확정된 직원은 등록 불가 표시
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

// 2단계: 정상 행만 등록(REGISTERED). 오류 행은 건너뛴다.
export async function registerRows(year: number, month: number, rows: ParsedRow[]): Promise<{ ok: number; failed: { email: string; reason: string }[] }> {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  let ok = 0; const failed: { email: string; reason: string }[] = [];
  const { data: types } = await sb.from("pay_item_types").select("id, category").eq("is_active", true);
  const cat = new Map((types ?? []).map((t) => [t.id, t.category]));
  for (const r of rows) {
    if (r.errors.length || !r.employeeId) continue;
    // 클라이언트를 거쳐 돌아온 값이므로 합계를 서버에서 다시 검증한다.
    let sE = 0, sD = 0;
    for (const i of r.items) { if (!cat.has(i.itemTypeId) || !Number.isInteger(i.amount)) { failed.push({ email: r.email, reason: "항목 데이터가 올바르지 않습니다." }); continue; } if (cat.get(i.itemTypeId) === "EARNING") sE += i.amount; else sD += i.amount; }
    if (sE !== r.totalEarnings || sD !== r.totalDeductions || r.netPay !== sE - sD) { failed.push({ email: r.email, reason: "합계 검증 실패" }); continue; }
    try {
      await upsertRegisteredStatement(sb, {
        employeeId: r.employeeId, year, month, payDate: r.payDate,
        items: r.items.map((i) => ({ itemTypeId: i.itemTypeId, amount: i.amount })),
        totalEarnings: r.totalEarnings, totalDeductions: r.totalDeductions, netPay: r.netPay, note: r.note
      }, admin.userId);
      ok++;
    } catch (e: any) { failed.push({ email: r.email, reason: e.message }); }
  }
  await sb.from("audit_logs").insert({
    actor_id: admin.userId, actor_name: admin.employee?.name ?? admin.email, action: "EXCEL_UPLOAD",
    pay_year: year, pay_month: month, detail: { registered: ok, failed: failed.length, skipped: rows.filter((r) => r.errors.length).length }
  });
  revalidatePath("/admin");
  return { ok, failed };
}
