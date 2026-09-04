"use client";
import { useState, useTransition } from "react";
import { confirmMonth } from "./actions";

export default function ConfirmMonthButton({ year, month, count }: { year: number; month: number; count: number }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <span className="flex items-center gap-3">
      <button className="btn-primary" disabled={pending || count === 0}
        onClick={() => confirm(`${year}년 ${month}월 등록완료 ${count}건을 모두 확정할까요? 확정 즉시 직원에게 보입니다.`) &&
          start(async () => { const r = await confirmMonth(year, month); setMsg(r.error ? r.error : `${r.data}건 확정 완료`); })}>
        {pending ? "확정 중..." : `전체 확정 (${count}건)`}
      </button>
      {msg && <span className="text-[13px] text-muted">{msg}</span>}
    </span>
  );
}
