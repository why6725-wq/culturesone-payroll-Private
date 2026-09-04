"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument } from "./actions";

export default function DocRow({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();
  return (
    <span className="whitespace-nowrap text-[13px]">
      {err && <span className="mr-2 text-red-600">{err}</span>}
      <button className="text-muted hover:underline disabled:opacity-50" disabled={pending}
        onClick={() => { const r = prompt(`"${title}" 을(를) 삭제합니다. 사유를 입력하세요.`); if (r) start(async () => { const x = await deleteDocument(id, r); setErr(x.error ?? ""); router.refresh(); }); }}>삭제</button>
    </span>
  );
}
