"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type R = { error?: string; data?: any };
async function rpc(name: string, args: Record<string, unknown>): Promise<R> {
  await requireAdmin();
  const { data, error } = await createClient().rpc(name, args);
  revalidatePath("/admin/certificates"); revalidatePath("/certificates");
  return error ? { error: error.message.replace(/^.*?: /, "") } : { data };
}
export async function approveCertificate(id: string) { return rpc("admin_decide_certificate", { p_id: id, p_approve: true, p_reason: null }); }
export async function rejectCertificate(id: string, reason: string) { return rpc("admin_decide_certificate", { p_id: id, p_approve: false, p_reason: reason }); }
export async function revokeCertificate(id: string, reason: string) { return rpc("admin_revoke_certificate", { p_id: id, p_reason: reason }); }
export async function issueDirect(_: { error?: string; ok?: string }, form: FormData) {
  const r = await rpc("admin_issue_certificate", {
    p_employee_id: String(form.get("employee_id")), p_type: String(form.get("type")),
    p_purpose: String(form.get("purpose") ?? "").trim(), p_income_months: Number(form.get("months")) || null,
    p_rrn: String(form.get("rrn") ?? "").replace(/\D/g, "") || null
  });
  return r.error ? { error: r.error } : { ok: "발급되었습니다." , id: r.data as string };
}
export async function updateCompany(_: { error?: string; ok?: string }, form: FormData) {
  const p: Record<string, string> = {};
  for (const k of ["company_name", "brand_name", "ceo_name", "biz_no", "address", "phone", "issuer_title", "issuer_contact"]) p[k] = String(form.get(k) ?? "").trim();
  const r = await rpc("admin_update_company", { p });
  revalidatePath("/admin/settings");
  return r.error ? { error: r.error } : { ok: "회사 정보를 저장했습니다." };
}
export async function updateTemplate(_: { error?: string; ok?: string }, form: FormData) {
  const r = await rpc("admin_update_template", { p_type: String(form.get("type")), p_title: String(form.get("title") ?? "").trim(), p_statement: String(form.get("statement") ?? "").trim() });
  revalidatePath("/admin/settings");
  return r.error ? { error: r.error } : { ok: "양식을 저장했습니다. 이후 발급분부터 적용됩니다." };
}
