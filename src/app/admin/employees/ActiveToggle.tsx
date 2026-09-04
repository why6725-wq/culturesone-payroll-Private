"use client";
import { useTransition } from "react";
import { setEmployeeActive } from "../actions";

export default function ActiveToggle({ id, active, name }: { id: string; active: boolean; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="text-[13px] text-muted hover:text-ink disabled:opacity-50"
      disabled={pending}
      onClick={() => {
        const msg = active ? `${name}님을 퇴사 처리하고 로그인을 차단할까요? 급여 이력은 유지됩니다.` : `${name}님을 재직 상태로 되돌리고 로그인을 허용할까요?`;
        if (confirm(msg)) start(() => setEmployeeActive(id, !active));
      }}
    >
      {active ? "퇴사 처리" : "재직 복구"}
    </button>
  );
}
