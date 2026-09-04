import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import EmployeeTabs from "@/components/EmployeeTabs";
import DownloadButton from "./DownloadButton";
import { fmtSize } from "@/lib/documents";

export default async function DocumentsPage() {
  const user = await requireUser();
  const { data } = await createClient().from("employee_documents")
    .select("id, category, doc_year, title, file_name, file_size, uploaded_at")
    .eq("employee_id", user.employeeId).is("deleted_at", null).order("doc_year", { ascending: false }).order("uploaded_at", { ascending: false });
  return (
    <>
      <AppHeader user={user} />
      <EmployeeTabs />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <p className="text-[14px] text-muted">회사에서 올려준 서류입니다. 원천징수영수증·계약서 등 본인 것만 보입니다.</p>
        <ul className="card mt-4 divide-y divide-line">
          {(data ?? []).length === 0 && <li className="px-5 py-10 text-center text-[15px] text-muted">아직 올라온 서류가 없습니다.</li>}
          {(data ?? []).map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[16px] font-medium">{d.title}</p>
                <p className="mt-0.5 truncate text-[13px] text-muted">{d.category}{d.doc_year ? ` · ${d.doc_year}년` : ""} · {fmtSize(d.file_size)} · {new Date(d.uploaded_at).toLocaleDateString("ko-KR")}</p>
              </div>
              <DownloadButton id={d.id} />
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
