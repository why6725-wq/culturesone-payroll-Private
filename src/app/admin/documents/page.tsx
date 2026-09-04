import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import UploadForm from "./UploadForm";
import DocRow from "./DocRow";
import { fmtSize } from "@/lib/documents";

export default async function AdminDocumentsPage({ searchParams }: { searchParams: { e?: string } }) {
  await requireAdmin();
  const sb = createClient();
  const [{ data: emps }, { data: docs }] = await Promise.all([
    sb.from("employees").select("id, name, department, employment_status").order("employment_status").order("name"),
    sb.from("employee_documents").select("id, employee_id, category, doc_year, title, file_name, file_size, uploaded_at, download_count, first_downloaded_at, employees(name)")
      .is("deleted_at", null).order("uploaded_at", { ascending: false }).limit(300)
  ]);
  const list = (docs ?? []).filter((d: any) => !searchParams.e || d.employee_id === searchParams.e);
  return (
    <main className="px-4 py-6 md:px-8">
      <h1 className="text-xl font-semibold">직원 서류함</h1>
      <p className="mt-1 text-[14px] text-muted">원천징수영수증·근로계약서 같은 PDF를 직원별로 올려두면 직원이 본인 것만 내려받습니다. PDF·JPG·PNG, 10MB 이하.</p>
      <UploadForm employees={emps ?? []} defaultEmployee={searchParams.e ?? ""} />

      <h2 className="mt-8 text-[15px] font-semibold">올린 서류 {list.length}건</h2>
      <div className="table-wrap mt-2"><table className="card w-full text-[13px]">
        <thead className="text-left text-[12px] text-muted"><tr className="border-b border-line">
          <th className="px-3 py-2 font-normal">직원</th><th className="px-3 py-2 font-normal">구분</th><th className="px-3 py-2 font-normal">제목</th>
          <th className="px-3 py-2 font-normal">파일</th><th className="px-3 py-2 font-normal">올린 날짜</th><th className="px-3 py-2 font-normal">열람</th><th className="px-3 py-2" /></tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted">올린 서류가 없습니다.</td></tr>}
          {list.map((d: any) => (
            <tr key={d.id} className="border-b border-line last:border-0">
              <td className="px-3 py-2">{(Array.isArray(d.employees) ? d.employees[0] : d.employees)?.name}</td>
              <td className="px-3 py-2">{d.category}{d.doc_year ? ` (${d.doc_year})` : ""}</td>
              <td className="px-3 py-2">{d.title}</td>
              <td className="px-3 py-2 text-muted">{d.file_name} · {fmtSize(d.file_size)}</td>
              <td className="px-3 py-2 text-muted">{new Date(d.uploaded_at).toLocaleDateString("ko-KR")}</td>
              <td className="px-3 py-2 text-muted">{d.download_count ? `${d.download_count}회` : "미열람"}</td>
              <td className="px-3 py-2 text-right"><DocRow id={d.id} title={d.title} /></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </main>
  );
}
