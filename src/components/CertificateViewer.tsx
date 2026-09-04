"use client";
import { useState } from "react";
import Link from "next/link";
import CertificateDocument from "./CertificateDocument";
import PayslipScaler from "./PayslipScaler";
import { logCertificatePrint } from "@/app/certificates/actions";
import type { CertSnapshot } from "@/lib/certificates";

export default function CertificateViewer(p: { id: string; type: string; purpose: string; issueNo: string; issuedAt: string; snapshot: CertSnapshot; backHref: string }) {
  const [busy, setBusy] = useState(false);
  const print = async () => {
    setBusy(true);
    await logCertificatePrint(p.id);   // 출력 기록 (누가·언제·발급번호)
    setBusy(false);
    setTimeout(() => window.print(), 100);
  };
  return (
    <>
      <div className="no-print mb-3 flex items-center justify-between px-2 sm:px-0">
        <Link href={p.backHref} className="btn-outline py-2 text-[14px]">목록으로</Link>
        <div className="flex gap-2">
          <button onClick={print} disabled={busy} className="btn-outline py-2 text-[14px]">인쇄</button>
          <button onClick={print} disabled={busy} className="btn-primary py-2 text-[14px]">PDF 저장</button>
        </div>
      </div>
      <article className="card p-2 sm:p-10">
        <PayslipScaler>
          <CertificateDocument s={p.snapshot} type={p.type} issueNo={p.issueNo} issuedAt={p.issuedAt} purpose={p.purpose} />
        </PayslipScaler>
      </article>
      <p className="no-print mt-3 px-2 text-[12px] text-muted sm:px-0">증명서는 직인이 포함된 대외 문서로, 출력 내역이 회사에 기록됩니다.</p>
    </>
  );
}
