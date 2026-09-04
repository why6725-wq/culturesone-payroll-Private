"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionState = { error?: string; ok?: string };

async function audit(actor: { userId: string; employee: { name: string } | null; email: string },
  action: string, target?: { id?: string; name?: string }, extra?: Record<string, unknown>) {
  await createAdminClient().from("audit_logs").insert({
    actor_id: actor.userId,
    actor_name: actor.employee?.name ?? actor.email,
    action,
    target_employee_id: target?.id ?? null,
    target_employee_name: target?.name ?? null,
    ...extra
  });
}

// 직원 등록 + 로그인 계정 발급 (관리자만). 초기 비밀번호는 화면에 1회 표시, DB에는 해시만 저장됨(Supabase Auth).
export async function createEmployee(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();               // DB 기준 관리자 검증 — 브라우저 값 신뢰 안 함
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const department = String(form.get("department") ?? "").trim() || null;
  const position = String(form.get("position") ?? "").trim() || null;
  const hire_date = String(form.get("hire_date") ?? "") || null;
  const birth_date = String(form.get("birth_date") ?? "") || null;
  const role = form.get("role") === "ADMIN" ? "ADMIN" : "EMPLOYEE";
  if (!name || !email) return { error: "이름과 이메일은 필수입니다." };

  const sb = createAdminClient();
  const { data: emp, error: e1 } = await sb.from("employees")
    .insert({ name, email, department, position, hire_date, birth_date }).select("id").single();
  if (e1) return { error: e1.code === "23505" ? "이미 등록된 이메일입니다." : e1.message };

  // 임시 비밀번호: 무작위 12자. 코드에 고정값 없음.
  const tempPassword = Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"[b % 54]).join("");
  const { data: u, error: e2 } = await sb.auth.admin.createUser({ email, password: tempPassword, email_confirm: true });
  if (e2 || !u.user) {
    await sb.from("employees").delete().eq("id", emp.id);
    return { error: `계정 생성 실패: ${e2?.message ?? "알 수 없는 오류"}` };
  }
  const { error: e3 } = await sb.from("profiles").insert({ id: u.user.id, employee_id: emp.id, role, must_change_password: true });
  if (e3) {
    await sb.auth.admin.deleteUser(u.user.id);
    await sb.from("employees").delete().eq("id", emp.id);
    return { error: `프로필 생성 실패: ${e3.message}` };
  }

  await audit(admin, "EMPLOYEE_CREATE", { id: emp.id, name }, { detail: { email, role } });
  revalidatePath("/admin/employees");
  return { ok: `${name} 등록 완료. 임시 비밀번호: ${tempPassword} (직원에게 전달 후 최초 로그인 시 변경됩니다)` };
}

// 퇴사 처리 / 재직 복구: 로그인 차단 + 재직상태 변경. 급여 이력은 그대로 유지.
export async function setEmployeeActive(employeeId: string, active: boolean) {
  const admin = await requireAdmin();
  const sb = createAdminClient();
  const { data: emp } = await sb.from("employees").select("id, name").eq("id", employeeId).single();
  if (!emp) return;
  await sb.from("employees").update({ employment_status: active ? "ACTIVE" : "RESIGNED", resign_date: active ? null : new Date().toISOString().slice(0, 10) }).eq("id", employeeId);
  await sb.from("profiles").update({ is_active: active }).eq("employee_id", employeeId);
  await audit(admin, active ? "EMPLOYEE_ACTIVATE" : "EMPLOYEE_DEACTIVATE", emp);
  revalidatePath("/admin/employees");
}

// ---------- 급여명세서 상태 전이 (DB 함수가 관리자 여부를 다시 검증) ----------
import { createClient as createSessionClient } from "@/lib/supabase/server";

async function rpc(name: string, args: Record<string, unknown>) {
  await requireAdmin();
  const { data, error } = await createSessionClient().rpc(name, args);
  revalidatePath("/admin");
  if (error) return { error: error.message.replace(/^.*?: /, "") };
  return { data };
}
export async function confirmStatement(id: string) { return rpc("admin_confirm_statement", { p_id: id }); }
export async function confirmMonth(y: number, m: number) { return rpc("admin_confirm_month", { p_year: y, p_month: m }); }
export async function correctStatement(id: string, reason: string, expectedAt: string | null) { return rpc("admin_correct_statement", { p_id: id, p_reason: reason, p_expected_at: expectedAt }); }
export async function cancelStatement(id: string, reason: string) { return rpc("admin_cancel_statement", { p_id: id, p_reason: reason }); }

// ---------- 급여자료 직접 입력 ----------
export async function saveManualStatement(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const employeeId = String(form.get("employee_id") ?? "");
  const year = Number(form.get("year")); const month = Number(form.get("month"));
  const payDate = String(form.get("pay_date") ?? "");
  const note = String(form.get("note") ?? "").trim() || null;
  if (!employeeId || !year || !month || !payDate) return { error: "직원, 지급 연월, 지급일은 필수입니다." };

  const sb = createAdminClient();
  const { data: types } = await sb.from("pay_item_types").select("id, category").eq("is_active", true);
  const items: { itemTypeId: string; amount: number }[] = [];
  let tE = 0, tD = 0;
  for (const t of types ?? []) {
    const raw = String(form.get(`item_${t.id}`) ?? "").replace(/[,\s]/g, "");
    const n = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(n)) return { error: "금액은 숫자만 입력하세요." };
    items.push({ itemTypeId: t.id, amount: Math.round(n) });
    if (t.category === "EARNING") tE += Math.round(n); else tD += Math.round(n);
  }
  try {
    const { upsertRegisteredStatement } = await import("@/lib/payroll/upsert");
    await upsertRegisteredStatement(sb, { employeeId, year, month, payDate, items, totalEarnings: tE, totalDeductions: tD, netPay: tE - tD, note }, admin.userId);
  } catch (e: any) { return { error: e.message }; }

  const { data: emp } = await sb.from("employees").select("name").eq("id", employeeId).single();
  await sb.from("audit_logs").insert({
    actor_id: admin.userId, actor_name: admin.employee?.name ?? admin.email, action: "STATEMENT_CREATE",
    target_employee_id: employeeId, target_employee_name: emp?.name, pay_year: year, pay_month: month, detail: { manual: true, net_pay: tE - tD }
  });
  revalidatePath("/admin");
  return { ok: `${emp?.name} ${year}년 ${month}월 급여자료 등록 완료 (등록완료 상태). 관리자 화면에서 확정하세요.` };
}
