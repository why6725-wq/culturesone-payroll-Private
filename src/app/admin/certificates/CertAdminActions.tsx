"use client";
import { useState, useTransition } from "react";
import { approveCertificate, rejectCertificate, revokeCertificate } from "./actions";

export default function CertAdminActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const run = (fn: () => Promise<{ error?: string }>) => start(async () => { const r = await fn(); setErr(r.error ?? ""); });
  if (status === "REQUESTED") return (
    <span className="flex items-center gap-2 text-[13px]">
      {err && <span className="text-red-600">{err}</span>}
      <button className="btn-primary py-1.5 text-[13px]" disabled={pending} onClick={() => confirm("승인하면 발급번호가 부여되고 직원이 바로 출력할 수 있습니다. 승인할까요?") && run(() => approveCertificate(id))}>승인 · 발급</button>
      <button className="btn-outline py-1.5 text-[13px]" disabled={pending} onClick={() => { const r = prompt("반려 사유를 입력하세요."); if (r) run(() => rejectCertificate(id, r)); }}>반려</button>
    </span>
  );
  if (status === "ISSUED") return (
    <span className="text-[13px]">{err && <span className="mr-2 text-red-600">{err}</span>}
      <button className="text-muted hover:underline disabled:opacity-50" disabled={pending} onClick={() => { const r = prompt("폐기 사유를 입력하세요. 폐기하면 직원이 더 이상 출력할 수 없습니다."); if (r) run(() => revokeCertificate(id, r)); }}>폐기</button>
    </span>
  );
  return null;
}
