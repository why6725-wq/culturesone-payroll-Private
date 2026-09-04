"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { previewUpload, registerRows, type PreviewResult } from "./actions";
import type { ParsedRow } from "@/lib/payroll/parse";
import { won } from "@/lib/format";

export default function UploadClient({ year, month }: { year: number; month: number }) {
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<{ ok: number; failed: { email: string; reason: string }[] } | null>(null);
  const [pending, start] = useTransition();
  const [fileName, setFileName] = useState("");

  const okRows = preview?.rows.filter((r) => !r.errors.length) ?? [];
  const badRows = preview?.rows.filter((r) => r.errors.length) ?? [];
  const warnCount = preview?.rows.filter((r) => !r.errors.length && r.warnings.length).length ?? 0;

  return (
    <div className="mt-5 space-y-5">
      <section className="card p-5">
        <ol className="grid gap-3 text-[14px] sm:grid-cols-3">
          <li className="flex gap-2"><Step n={1} />템플릿을 내려받아 숫자를 채웁니다.<br /><span className="text-muted">재직 직원 명단과 지급일(말일)이 미리 들어 있습니다.</span></li>
          <li className="flex gap-2"><Step n={2} />파일을 올리면 내용을 검증해 미리보기를 보여줍니다. 이 단계에서는 저장되지 않습니다.</li>
          <li className="flex gap-2"><Step n={3} />정상 건만 등록 → 관리자 화면에서 검토 후 [전체 확정].</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`/admin/upload/template?y=${year}&m=${month}`} className="btn-outline">템플릿 내려받기 ({year}년 {month}월)</a>
          <Link href={`/admin?y=${year}&m=${month}`} className="btn-outline">관리자 화면으로</Link>
        </div>
      </section>

      {!result && (
        <form
          className="card p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => setPreview(await previewUpload(fd)));
          }}
        >
          <input type="hidden" name="year" value={year} /><input type="hidden" name="month" value={month} />
          <label className="label">급여 엑셀 파일 (.xlsx)</label>
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" name="file" accept=".xlsx,.xls" required className="text-[14px]" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
            <button className="btn-primary" disabled={pending || !fileName}>{pending ? "분석 중..." : "내용 분석"}</button>
          </div>
        </form>
      )}

      {preview?.error && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{preview.error}</p>}
      {preview && preview.headerErrors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
          <p className="font-medium">엑셀 컬럼을 확인하세요.</p>
          <ul className="mt-1 list-disc pl-5">{preview.headerErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {preview && preview.rows.length > 0 && !result && (
        <section className="card p-5">
          <div className="flex flex-wrap items-center gap-4 text-[15px]">
            <span>정상 <b className="text-emerald-700">{okRows.length}명</b></span>
            <span>오류 <b className={badRows.length ? "text-red-600" : ""}>{badRows.length}명</b></span>
            {warnCount > 0 && <span className="text-amber-700">경고 {warnCount}명 (등록은 가능)</span>}
          </div>

          {badRows.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[14px] font-medium text-red-700">오류 내용 — 아래 행은 등록되지 않습니다</p>
              <ul className="divide-y divide-line rounded-md border border-red-200 text-[14px]">
                {badRows.map((r) => (
                  <li key={r.rowNo} className="px-3 py-2">
                    <span className="font-medium">{r.rowNo}행 {r.name || r.email}</span>
                    <ul className="mt-0.5 text-red-700">{r.errors.map((e, i) => <li key={i}>· {e}</li>)}</ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="text-left text-[12px] text-muted">
                <tr className="border-b border-line">
                  <th className="px-2 py-2 font-normal">행</th><th className="px-2 py-2 font-normal">직원</th><th className="px-2 py-2 font-normal">지급일</th>
                  <th className="px-2 py-2 text-right font-normal">지급총액</th><th className="px-2 py-2 text-right font-normal">공제총액</th><th className="px-2 py-2 text-right font-normal">차감지급액</th>
                  <th className="px-2 py-2 font-normal">비고/경고</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.rowNo} className={`border-b border-line ${r.errors.length ? "bg-red-50 text-muted" : ""}`}>
                    <td className="px-2 py-2">{r.rowNo}</td>
                    <td className="px-2 py-2">{r.employeeName ?? r.name}<span className="ml-1 text-[11px] text-muted">{r.email}</span></td>
                    <td className="px-2 py-2">{r.payDate}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{won(r.totalEarnings)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{won(r.totalDeductions)}</td>
                    <td className="px-2 py-2 text-right font-medium tabular-nums">{won(r.netPay)}</td>
                    <td className="px-2 py-2 text-amber-700">{r.warnings.join(" / ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-primary" disabled={pending || okRows.length === 0}
              onClick={() => start(async () => setResult(await registerRows(year, month, okRows)))}>
              {pending ? "등록 중..." : `정상자료 ${okRows.length}건 등록`}
            </button>
            <button className="btn-outline" onClick={() => { setPreview(null); setFileName(""); }}>다른 파일 선택</button>
          </div>
        </section>
      )}

      {result && (
        <section className="card p-5">
          <p className="text-[16px] font-medium">{year}년 {month}월 급여자료 {result.ok}건 등록 완료</p>
          {result.failed.length > 0 && (
            <ul className="mt-2 text-[14px] text-red-700">{result.failed.map((f, i) => <li key={i}>· {f.email}: {f.reason}</li>)}</ul>
          )}
          <p className="mt-2 text-[14px] text-muted">직원에게는 아직 보이지 않습니다. 관리자 화면에서 직원별 명세서를 확인한 뒤 [전체 확정]을 누르세요.</p>
          <div className="mt-4 flex gap-2">
            <Link href={`/admin?y=${year}&m=${month}`} className="btn-primary">관리자 화면에서 검토·확정</Link>
            <button className="btn-outline" onClick={() => { setResult(null); setPreview(null); setFileName(""); }}>추가 업로드</button>
          </div>
        </section>
      )}
    </div>
  );
}

function Step({ n }: { n: number }) {
  return <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] text-white">{n}</span>;
}
