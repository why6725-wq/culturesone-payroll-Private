"use client";
import { useState, useTransition } from "react";
import { cancelStatement, confirmStatement, correctStatement } from "./actions";

// 관리자 대시보드 행별 버튼: 확정 / 취소(확정 전) / 정정(확정 후)
export default function StatementActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const run = (fn: () => Promise<{ error?: string }>) => start(async () => { const r = await fn(); setErr(r.error ?? ""); if (!r.error) setCorrecting(false); });

  if (status === "REGISTERED" || status === "DRAFT") return (
    <span className="flex justify-end gap-3 text-[13px]">
      {err && <span className="text-red-600">{err}</span>}
      <button disabled={pending} onClick={() => confirm("이 명세서를 확정할까요? 확정하면 직원에게 보입니다.") && run(() => confirmStatement(id))} className="text-navy hover:underline disabled:opacity-50">확정</button>
      <button disabled={pending} onClick={() => { const r = prompt("취소 사유를 입력하세요."); if (r) run(() => cancelStatement(id, r)); }} className="text-muted hover:underline disabled:opacity-50">취소</button>
    </span>
  );
  if (status === "CONFIRMED") return (
    <>
      <span className="flex justify-end gap-3 text-[13px]">
        {err && <span className="text-red-600">{err}</span>}
        <button disabled={pending} onClick={() => setCorrecting(true)} className="text-muted hover:underline disabled:opacity-50">정정</button>
      </span>
      {correcting && <CorrectDialog pending={pending} onClose={() => setCorrecting(false)} onSubmit={(reason, at) => run(() => correctStatement(id, reason, at))} />}
    </>
  );
  return null;
}

function CorrectDialog({ pending, onClose, onSubmit }: { pending: boolean; onClose: () => void; onSubmit: (reason: string, expectedAt: string | null) => void }) {
  const [reason, setReason] = useState("");
  const [at, setAt] = useState("");
  const [e, setE] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-xl bg-white p-6 text-left sm:rounded-lg" onClick={(ev) => ev.stopPropagation()}>
        <h2 className="text-[17px] font-semibold">급여명세서 정정</h2>
        <p className="mt-1 text-[13px] text-muted">기존 확정본은 기록으로 남고 새 버전이 만들어집니다. 새 버전을 확정할 때까지 직원에게는 이 달 명세서가 ‘정정 중’으로 표시됩니다.</p>
        <div className="mt-4">
          <label className="label" htmlFor="c_reason">정정 사유 (필수)</label>
          <input id="c_reason" className="input" value={reason} onChange={(ev) => setReason(ev.target.value)} placeholder="예: 식대 누락" autoFocus />
        </div>
        <div className="mt-3">
          <label className="label" htmlFor="c_at">다시 열람 가능 예정 시각 (선택)</label>
          <input id="c_at" type="datetime-local" className="input" value={at} onChange={(ev) => setAt(ev.target.value)} />
          <p className="mt-1.5 text-[12px] text-muted">입력하면 직원 화면에 ‘○월 ○일 ○시 이후 확인 가능’으로 안내됩니다. 비워두면 ‘담당자 확인 후 다시 게시’로만 안내됩니다.</p>
        </div>
        {e && <p className="mt-2 text-[13px] text-red-600">{e}</p>}
        <div className="mt-5 flex gap-2">
          <button className="btn-outline flex-1" onClick={onClose} disabled={pending}>취소</button>
          <button className="btn-primary flex-1" disabled={pending} onClick={() => {
            if (!reason.trim()) { setE("정정 사유를 입력하세요."); return; }
            if (at && new Date(at).getTime() < Date.now()) { setE("예정 시각이 이미 지났습니다."); return; }
            onSubmit(reason.trim(), at ? new Date(at).toISOString() : null);
          }}>{pending ? "처리 중..." : "정정 시작"}</button>
        </div>
      </div>
    </div>
  );
}
