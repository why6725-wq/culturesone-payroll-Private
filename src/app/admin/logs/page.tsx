import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const ACTION_LABEL: Record<string, string> = {
  EMPLOYEE_CREATE: "직원 등록", EMPLOYEE_UPDATE: "직원 수정", EMPLOYEE_DEACTIVATE: "퇴사 처리", EMPLOYEE_ACTIVATE: "재직 복구",
  STATEMENT_CREATE: "급여자료 직접 입력", STATEMENT_UPDATE: "급여자료 수정", STATEMENT_REGISTER: "등록완료",
  STATEMENT_CONFIRM: "확정", STATEMENT_CORRECT: "정정", STATEMENT_CANCEL: "취소", STATEMENT_VOID: "폐기",
  EXCEL_UPLOAD: "엑셀 업로드", ITEM_TYPE_CREATE: "급여 항목 추가", ITEM_TYPE_UPDATE: "급여 항목 수정",
  STATEMENT_PRINT_SEALED: "날인본 출력",
  CERT_REQUEST: "증명서 신청", CERT_ISSUE: "증명서 발급", CERT_REJECT: "증명서 반려", CERT_REVOKE: "증명서 폐기", CERT_PRINT: "증명서 출력", SETTINGS_UPDATE: "설정 변경",
  DOC_UPLOAD: "서류 업로드", DOC_DELETE: "서류 삭제", DOC_DOWNLOAD: "서류 열람"
};

function detailText(a: string, d: any) {
  if (!d) return "";
  if (a === "STATEMENT_PRINT_SEALED") return `용도: ${d.purpose}`;
  if (a === "EXCEL_UPLOAD") return `등록 ${d.registered}건 / 실패 ${d.failed}건 / 오류로 제외 ${d.skipped}건`;
  if (a === "STATEMENT_CORRECT") return `v${d.from_version} → v${d.to_version} · 사유: ${d.reason}`;
  if (a === "STATEMENT_CANCEL") return `사유: ${d.reason}`;
  if (a === "STATEMENT_CONFIRM") return `v${d.version} · 실지급액 ${Number(d.net_pay).toLocaleString()}`;
  if (a === "EMPLOYEE_CREATE") return `${d.email} (${d.role})`;
  if (a.startsWith("DOC_")) return [d.title, d.category, d.reason ? `사유: ${d.reason}` : null].filter(Boolean).join(" · ");
  if (a.startsWith("CERT_")) return [d.issue_no, d.purpose ? `용도: ${d.purpose}` : null, d.reason ? `사유: ${d.reason}` : null].filter(Boolean).join(" · ");
  return "";
}

export default async function LogsPage() {
  const user = await requireAdmin();
  const supabase = createClient();
  const { data } = await supabase.from("audit_logs")
    .select("id, created_at, actor_name, action, target_employee_name, pay_year, pay_month, detail")
    .order("created_at", { ascending: false }).limit(300);

  return (
    <>
      <main className="px-4 py-6 md:px-8">
        <h1 className="text-xl font-semibold">처리 이력</h1>
        <p className="mt-1 text-[14px] text-muted">등록·확정·정정·취소·날인본 출력 기록. 수정하거나 삭제할 수 없습니다. 최근 300건.</p>
        <div className="table-wrap mt-5"><table className="card w-full text-[13px]">
          <thead className="text-left text-[12px] text-muted">
            <tr className="border-b border-line">
              <th className="px-3 py-2 font-normal">일시</th><th className="px-3 py-2 font-normal">처리자</th>
              <th className="px-3 py-2 font-normal">작업</th><th className="px-3 py-2 font-normal">대상</th><th className="px-3 py-2 font-normal">내용</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((l: any) => (
              <tr key={l.id} className="border-b border-line align-top last:border-0">
                <td className="whitespace-nowrap px-3 py-2 text-muted">{new Date(l.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="px-3 py-2">{l.actor_name}</td>
                <td className="px-3 py-2">{ACTION_LABEL[l.action] ?? l.action}</td>
                <td className="px-3 py-2">{l.target_employee_name ?? "-"}{l.pay_year ? <span className="block text-[12px] text-muted">{l.pay_year}년 {l.pay_month}월</span> : null}</td>
                <td className="px-3 py-2 text-muted">{detailText(l.action, l.detail)}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted">기록이 없습니다.</td></tr>}
          </tbody>
        </table></div>
      </main>
    </>
  );
}
