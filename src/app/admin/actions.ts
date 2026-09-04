"use server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: string };

// 모든 관리자 쓰기 작업은 DB 함수(security definer + is_admin 재검증)로 처리한다.
// 서버에는 service_role 같은 비밀 키가 없다 — 로그인 세션 토큰만 사용.
async function rpc(name: string, args: Record<string, unknown>) {
  await requireAdmin();
  const { data, error } = await createClient().rpc(name, args);
  return error ? { error: error.message.replace(/^.*?: /, "") } : { data };
}
const clean = (e?: string) => e ?? "";

// 임시 비밀번호: 읽기 쉬운 문자 12자, 코드에 고정값 없음
function tempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(randomBytes(12), (b) => chars[b % chars.length]).join("") + "!";
}

// ---------- 직원 등록 + 계정 발급 ----------
export async function createEmployee(_: ActionState, form: FormData): Promise<ActionState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!name || !email) return { error: "이름과 이메일은 필수입니다." };
  const pw = tempPassword();
  const r = await rpc("admin_create_employee", {
    p_name: name, p_email: email,
    p_department: String(form.get("department") ?? "").trim() || null,
    p_position: String(form.get("position") ?? "").trim() || null,
    p_hire_date: String(form.get("hire_date") ?? "") || null,
    p_birth_date: String(form.get("birth_date") ?? "") || null,
    p_address: String(form.get("address") ?? "").trim() || null,
    p_duties: String(form.get("duties") ?? "").trim() || null,
    p_role: form.get("role") === "ADMIN" ? "ADMIN" : "EMPLOYEE",
    p_temp_password: pw
  });
  if (r.error) return { error: clean(r.error) };
  revalidatePath("/admin/employees");
  return { ok: `${name} 등록 완료. 임시 비밀번호: ${pw} (직원에게 전달하세요. 최초 로그인 시 변경됩니다)` };
}

// ---------- 퇴사 처리 / 재직 복구 ----------
export async function setEmployeeActive(employeeId: string, active: boolean) {
  await rpc("admin_set_employee_active", { p_employee_id: employeeId, p_active: active });
  revalidatePath("/admin/employees");
}

// ---------- 급여명세서 상태 전이 ----------
async function statementRpc(name: string, args: Record<string, unknown>) {
  const r = await rpc(name, args); revalidatePath("/admin"); return r;
}
export async function confirmStatement(id: string) { return statementRpc("admin_confirm_statement", { p_id: id }); }
export async function confirmMonth(y: number, m: number) { return statementRpc("admin_confirm_month", { p_year: y, p_month: m }); }
export async function correctStatement(id: string, reason: string, expectedAt: string | null) { return statementRpc("admin_correct_statement", { p_id: id, p_reason: reason, p_expected_at: expectedAt }); }
export async function cancelStatement(id: string, reason: string) { return statementRpc("admin_cancel_statement", { p_id: id, p_reason: reason }); }

// ---------- 급여자료 직접 입력 ----------
export async function saveManualStatement(_: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin();
  const employeeId = String(form.get("employee_id") ?? "");
  const year = Number(form.get("year")); const month = Number(form.get("month"));
  const payDate = String(form.get("pay_date") ?? "");
  const note = String(form.get("note") ?? "").trim() || null;
  if (!employeeId || !year || !month || !payDate) return { error: "직원, 지급 연월, 지급일은 필수입니다." };

  const supabase = createClient();
  const { data: types } = await supabase.from("pay_item_types").select("id, category").eq("is_active", true);
  const items: { item_type_id: string; amount: number }[] = [];
  let tE = 0, tD = 0;
  for (const t of types ?? []) {
    const raw = String(form.get(`item_${t.id}`) ?? "").replace(/[,\s]/g, "");
    const n = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(n)) return { error: "금액은 숫자만 입력하세요." };
    items.push({ item_type_id: t.id, amount: Math.round(n) });
    if (t.category === "EARNING") tE += Math.round(n); else tD += Math.round(n);
  }
  const r = await rpc("admin_upsert_statement", {
    p_employee_id: employeeId, p_year: year, p_month: month, p_pay_date: payDate, p_items: items,
    p_total_earnings: tE, p_total_deductions: tD, p_net_pay: tE - tD, p_note: note, p_source: "manual"
  });
  if (r.error) return { error: clean(r.error) };
  revalidatePath("/admin");
  return { ok: `${year}년 ${month}월 급여자료 등록 완료 (등록완료 상태). 관리자 화면에서 확정하세요.` };
}

// ---------- 일괄 처리 (체크박스 선택) ----------
export async function bulkStatements(ids: string[], action: "confirm" | "cancel", reason?: string): Promise<{ ok: number; failed: string[] }> {
  await requireAdmin();
  const sb = createClient();
  let ok = 0; const failed: string[] = [];
  for (const id of ids) {
    const { error } = action === "confirm"
      ? await sb.rpc("admin_confirm_statement", { p_id: id })
      : await sb.rpc("admin_cancel_statement", { p_id: id, p_reason: reason ?? "" });
    if (error) failed.push(error.message.replace(/^.*?: /, "")); else ok++;
  }
  revalidatePath("/admin");
  return { ok, failed };
}
