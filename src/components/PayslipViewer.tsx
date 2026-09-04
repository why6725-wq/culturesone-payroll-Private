"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PayslipDocument, { type PayslipData } from "./PayslipDocument";
import PayslipScaler from "./PayslipScaler";
import { createClient } from "@/lib/supabase/client";

type Mode = "plain" | "sealed";

// 명세서 화면 + 인쇄/PDF 저장 대화상자.
// 버튼을 누르면 [일반본 / 날인본] 선택 → 날인본이면 사용용도 입력 → 문서에 날인·용도·발급일을 얹은 뒤 인쇄창을 연다.
export default function PayslipViewer({ statementId, data, backHref }: { statementId: string; data: PayslipData; backHref: string }) {
  const [dialog, setDialog] = useState<null | "print" | "pdf">(null);
  const [mode, setMode] = useState<Mode>("plain");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState<{ purpose: string; issuedAt: string } | null>(null);

  // 인쇄창이 닫히면 날인 표시를 화면에서 제거 (화면 열람용은 항상 일반본)
  useEffect(() => {
    const off = () => setApplied(null);
    window.addEventListener("afterprint", off);
    // 직인 이미지를 미리 받아둔다 — 날인본 선택 직후 인쇄해도 도장이 빠지지 않도록
    const pre = new Image(); pre.src = "/seal.png";
    return () => window.removeEventListener("afterprint", off);
  }, []);

  // 문서 안의 이미지(로고·직인)가 전부 로딩된 뒤 인쇄창을 연다
  const printWhenReady = async () => {
    await new Promise((r) => setTimeout(r, 50));
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(".payslip img"));
    await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : new Promise<void>((res) => { im.onload = () => res(); im.onerror = () => res(); }))));
    await Promise.all(imgs.map((im) => im.decode?.().catch(() => undefined)));
    window.print();
  };

  const run = async () => {
    setError("");
    if (mode === "sealed") {
      const p = purpose.trim();
      if (!p) { setError("사용용도를 입력하세요. (예: 은행 대출 제출용)"); return; }
      setBusy(true);
      const { error } = await createClient().rpc("log_sealed_print", { p_statement_id: statementId, p_purpose: p });
      setBusy(false);
      if (error) { setError("날인본 출력 기록에 실패했습니다. 다시 시도하세요."); return; }
      setApplied({ purpose: p, issuedAt: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "") });
    } else {
      setApplied(null);
    }
    setDialog(null);
    setTimeout(printWhenReady, 100);
  };

  return (
    <>
      <div className="no-print mb-3 flex items-center justify-between px-2 sm:px-0">
        <Link href={backHref} className="btn-outline py-2 text-[14px]">목록으로</Link>
        <div className="flex gap-2">
          {applied && <button onClick={() => setApplied(null)} className="btn-outline py-2 text-[14px] text-muted">날인 해제</button>}
          <button onClick={() => setDialog("print")} className="btn-outline py-2 text-[14px]">인쇄</button>
          <button onClick={() => setDialog("pdf")} className="btn-primary py-2 text-[14px]">PDF 저장</button>
        </div>
      </div>

      <article className="card p-2 sm:p-10">
        <PayslipScaler>
          <PayslipDocument d={{ ...data, seal: applied ?? undefined }} />
        </PayslipScaler>
      </article>

      {dialog && (
        <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => !busy && setDialog(null)}>
          <div className="w-full max-w-sm rounded-t-xl bg-white p-6 sm:rounded-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold">{dialog === "print" ? "인쇄" : "PDF 저장"}</h2>
            <p className="mt-1 text-[13px] text-muted">어떤 형태로 출력할지 선택하세요.</p>

            <div className="mt-4 space-y-2">
              <Choice checked={mode === "plain"} onChange={() => setMode("plain")} title="일반본" desc="본인 확인용. 날인 없이 명세서만 출력됩니다." />
              <Choice checked={mode === "sealed"} onChange={() => setMode("sealed")} title="날인본 (회사 직인)" desc="은행·관공서 등 외부 제출용. 직인과 사용용도, 발급일이 함께 인쇄됩니다." />
            </div>

            {mode === "sealed" && (
              <div className="mt-4">
                <label className="label" htmlFor="purpose">사용용도</label>
                <input id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={100}
                  placeholder="예: 은행 대출 제출용" className="input" autoFocus />
                <p className="mt-1.5 text-[12px] text-muted">날인본 출력 내역(일시·용도)은 회사에 기록됩니다.</p>
              </div>
            )}

            {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

            <div className="mt-5 flex gap-2">
              <button className="btn-outline flex-1" onClick={() => setDialog(null)} disabled={busy}>취소</button>
              <button className="btn-primary flex-1" onClick={run} disabled={busy}>{busy ? "처리 중..." : dialog === "print" ? "인쇄하기" : "PDF로 저장하기"}</button>
            </div>
            {dialog === "pdf" && <p className="mt-3 text-[12px] text-muted">인쇄창에서 대상을 &lsquo;PDF로 저장&rsquo;으로 선택하면 파일로 저장됩니다.</p>}
          </div>
        </div>
      )}
    </>
  );
}

function Choice({ checked, onChange, title, desc }: { checked: boolean; onChange: () => void; title: string; desc: string }) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-md border p-3 ${checked ? "border-navy bg-[#EEF3F8]" : "border-line"}`}>
      <input type="radio" checked={checked} onChange={onChange} className="mt-1 accent-navy" />
      <span><span className="block text-[15px] font-medium">{title}</span><span className="block text-[12px] text-muted">{desc}</span></span>
    </label>
  );
}
