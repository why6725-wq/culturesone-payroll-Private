"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerDocument } from "./actions";
import { DOC_CATEGORIES } from "@/lib/documents";

export default function UploadForm({ employees, defaultEmployee }: { employees: { id: string; name: string; department: string | null; employment_status: string }[]; defaultEmployee: string }) {
  const router = useRouter();
  const [emp, setEmp] = useState(defaultEmployee);
  const [category, setCategory] = useState<string>(DOC_CATEGORIES[0]);
  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>({});

  const submit = async () => {
    setMsg({});
    if (!emp || !file) { setMsg({ error: "직원과 파일을 선택하세요." }); return; }
    if (file.size > 10 * 1024 * 1024) { setMsg({ error: "10MB 이하 파일만 올릴 수 있습니다." }); return; }
    const finalTitle = title.trim() || `${year ? year + "년 " : ""}${category}`;
    setBusy(true);
    // 파일은 브라우저에서 저장소로 바로 올린다 (관리자 세션 + 저장소 정책으로 보호). 경로 첫 폴더 = 직원 id
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `${emp}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await createClient().storage.from("employee-docs").upload(path, file, { contentType: file.type || "application/pdf", upsert: false });
    if (upErr) { setBusy(false); setMsg({ error: `업로드 실패: ${upErr.message}` }); return; }
    const r = await registerDocument({ employeeId: emp, category, year: year ? Number(year) : null, title: finalTitle, storagePath: path, fileName: file.name, fileSize: file.size });
    setBusy(false);
    if (r.error) { setMsg({ error: r.error }); return; }
    setMsg({ ok: `${finalTitle} 올렸습니다.` }); setFile(null); setTitle("");
    router.refresh();
  };

  return (
    <div className="card mt-4 grid gap-3 p-5 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <label className="label" htmlFor="d_emp">직원</label>
        <select id="d_emp" className="input" value={emp} onChange={(e) => setEmp(e.target.value)}>
          <option value="">선택</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}{e.department ? ` · ${e.department}` : ""}{e.employment_status === "RESIGNED" ? " (퇴사)" : ""}</option>)}
        </select>
      </div>
      <div><label className="label" htmlFor="d_cat">구분</label>
        <select id="d_cat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>{DOC_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div><label className="label" htmlFor="d_year">귀속연도</label><input id="d_year" className="input" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2025" /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="d_title">제목 (비우면 연도+구분으로 자동)</label><input id="d_title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 2025년 근로소득 원천징수영수증" /></div>
      <div className="sm:col-span-2"><label className="label">파일</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-[14px]" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
      <div className="flex items-center gap-3 sm:col-span-4">
        <button className="btn-primary" disabled={busy} onClick={submit}>{busy ? "올리는 중..." : "올리기"}</button>
        {msg.ok && <span className="text-[13px] text-emerald-800">{msg.ok}</span>}
        {msg.error && <span className="text-[13px] text-red-600">{msg.error}</span>}
      </div>
    </div>
  );
}
