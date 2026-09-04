import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CERT_STATUS_LABEL, CERT_TYPE_LABEL } from "@/lib/certificates";
import CertAdminActions from "./CertAdminActions";
import DirectIssueForm from "./DirectIssueForm";

export default async function AdminCertificatesPage() {
  const user = await requireAdmin();
  const sb = createClient();
  const [{ data: reqs }, { data: emps }, { data: company }] = await Promise.all([
    sb.from("certificate_requests").select("id, type, purpose, income_months, status, requested_at, issued_at, issue_no, reject_reason, print_count, employees(name, department, employment_status)")
      .order("requested_at", { ascending: false }).limit(200),
    sb.from("employees").select("id, name, department, employment_status").order("employment_status").order("name"),
    sb.from("company_settings").select("ceo_name").eq("id", 1).maybeSingle()
  ]);
  const rows = (reqs ?? []) as any[];
  const pending = rows.filter((r) => r.status === "REQUESTED");
  const others = rows.filter((r) => r.status !== "REQUESTED");
  const name = (r: any) => (Array.isArray(r.employees) ? r.employees[0] : r.employees)?.name ?? "-";

  return (
    <>
      <main className="px-4 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">증명서 발급 관리</h1>
          <Link href="/admin/settings" className="btn-outline">회사정보 · 양식 설정</Link>
        </div>
        {!company?.ceo_name && (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-[14px] text-amber-900">
            대표자 성명·사업자등록번호가 아직 비어 있습니다. <Link href="/admin/settings" className="underline">회사정보 설정</Link>에서 입력해야 증명서 하단에 표시됩니다.
          </p>
        )}

        <h2 className="mt-6 text-[15px] font-semibold">승인 대기 {pending.length}건</h2>
        <ul className="card mt-2 divide-y divide-line">
          {pending.length === 0 && <li className="px-5 py-6 text-center text-[14px] text-muted">대기 중인 신청이 없습니다.</li>}
          {pending.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-[15px] font-medium">{name(r)} · {CERT_TYPE_LABEL[r.type]}{r.income_months ? ` (최근 ${r.income_months}개월)` : ""}</p>
                <p className="mt-0.5 text-[13px] text-muted">용도: {r.purpose} · 신청 {new Date(r.requested_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
              <CertAdminActions id={r.id} status={r.status} />
            </li>
          ))}
        </ul>

        <h2 className="mt-8 text-[15px] font-semibold">직접 발급 (퇴사자 경력증명서 등)</h2>
        <DirectIssueForm employees={emps ?? []} />

        <h2 className="mt-8 text-[15px] font-semibold">발급 · 처리 내역</h2>
        <table className="card mt-2 w-full text-[13px]">
          <thead className="text-left text-[12px] text-muted"><tr className="border-b border-line">
            <th className="px-3 py-2 font-normal">직원</th><th className="px-3 py-2 font-normal">종류</th><th className="px-3 py-2 font-normal">상태</th>
            <th className="hidden px-3 py-2 font-normal sm:table-cell">발급번호</th><th className="hidden px-3 py-2 font-normal sm:table-cell">출력</th><th className="px-3 py-2" /></tr></thead>
          <tbody>
            {others.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2">{name(r)}</td>
                <td className="px-3 py-2">{CERT_TYPE_LABEL[r.type]}<span className="block text-[11px] text-muted">{r.purpose}</span></td>
                <td className="px-3 py-2">{CERT_STATUS_LABEL[r.status]}{r.reject_reason && <span className="block text-[11px] text-muted">{r.reject_reason}</span>}</td>
                <td className="hidden px-3 py-2 sm:table-cell">{r.issue_no ?? "-"}<span className="block text-[11px] text-muted">{r.issued_at ? new Date(r.issued_at).toLocaleDateString("ko-KR") : ""}</span></td>
                <td className="hidden px-3 py-2 sm:table-cell">{r.print_count}회</td>
                <td className="px-3 py-2 text-right">
                  {r.status === "ISSUED" && <Link href={`/certificates/${r.id}`} className="mr-3 text-navy hover:underline">보기</Link>}
                  <CertAdminActions id={r.id} status={r.status} />
                </td>
              </tr>
            ))}
            {others.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted">내역이 없습니다.</td></tr>}
          </tbody>
        </table>
      </main>
    </>
  );
}
