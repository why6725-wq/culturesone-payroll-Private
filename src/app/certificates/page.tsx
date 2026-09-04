import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import { CERT_STATUS_LABEL, CERT_TYPE_LABEL } from "@/lib/certificates";
import RequestForm from "./RequestForm";
import EmployeeTabs from "@/components/EmployeeTabs";

const DOT: Record<string, string> = { REQUESTED: "bg-amber-400", ISSUED: "bg-emerald-500", REJECTED: "bg-red-500", REVOKED: "bg-gray-300" };

export default async function CertificatesPage() {
  const user = await requireUser();
  const { data } = await createClient().from("certificate_requests")
    .select("id, type, purpose, income_months, status, requested_at, issued_at, issue_no, reject_reason")
    .eq("employee_id", user.employeeId).order("requested_at", { ascending: false });

  return (
    <>
      <AppHeader user={user} />
      <EmployeeTabs />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <p className="text-[14px] text-muted">신청하면 담당자가 확인 후 발급합니다. 발급된 증명서는 직인이 찍힌 상태로 인쇄·PDF 저장할 수 있습니다.</p>
        <RequestForm />
        <ul className="card mt-6 divide-y divide-line">
          {(data ?? []).length === 0 && <li className="px-5 py-10 text-center text-[15px] text-muted">신청 내역이 없습니다.</li>}
          {(data ?? []).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[16px] font-medium">{CERT_TYPE_LABEL[r.type]}{r.income_months ? ` (최근 ${r.income_months}개월)` : ""}</p>
                <p className="mt-0.5 truncate text-[13px] text-muted">용도: {r.purpose} · 신청 {new Date(r.requested_at).toLocaleDateString("ko-KR")}</p>
                <p className="mt-0.5 text-[13px]"><span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${DOT[r.status]}`} />{CERT_STATUS_LABEL[r.status]}
                  {r.issue_no && <span className="ml-2 text-muted">{r.issue_no}</span>}
                  {r.status === "REJECTED" && r.reject_reason && <span className="ml-2 text-red-600">사유: {r.reject_reason}</span>}
                </p>
              </div>
              {r.status === "ISSUED" && <Link href={`/certificates/${r.id}`} className="btn-outline shrink-0 py-2 text-[14px]">보기 / 출력</Link>}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
