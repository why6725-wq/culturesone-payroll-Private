"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CertState = { error?: string; ok?: string };

export async function requestCertificate(_: CertState, form: FormData): Promise<CertState> {
  await requireUser();
  const type = String(form.get("type") ?? "");
  const purpose = String(form.get("purpose") ?? "").trim();
  const months = Number(form.get("months")) || null;
  if (!["EMPLOYMENT", "CAREER", "INCOME"].includes(type)) return { error: "증명서 종류를 선택하세요." };
  if (!purpose) return { error: "사용용도를 입력하세요." };
  let rrn: string | null = null;
  if (form.get("full_rrn")) {
    const front = String(form.get("rrn_front") ?? "").replace(/\D/g, ""), back = String(form.get("rrn_back") ?? "").replace(/\D/g, "");
    if (front.length !== 6 || back.length !== 7) return { error: "주민등록번호는 앞 6자리, 뒤 7자리 숫자로 입력하세요." };
    rrn = front + back;
  }
  const { error } = await createClient().rpc("request_certificate", { p_type: type, p_purpose: purpose, p_income_months: type === "INCOME" ? months : null, p_rrn: rrn });
  if (error) return { error: error.message.replace(/^.*?: /, "") };
  revalidatePath("/certificates");
  return { ok: "신청되었습니다. 담당자 승인 후 발급됩니다." };
}

export async function logCertificatePrint(id: string) {
  await requireUser();
  const { error } = await createClient().rpc("log_certificate_print", { p_id: id });
  return { error: error?.message };
}
