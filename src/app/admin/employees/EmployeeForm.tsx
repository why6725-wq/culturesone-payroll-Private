"use client";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createEmployee, type ActionState } from "../actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn-primary" disabled={pending}>{pending ? "등록 중..." : "직원 등록 및 계정 발급"}</button>;
}

export default function EmployeeForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<ActionState, FormData>(createEmployee, {});
  return (
    <div className="mt-4">
      {!open && <button className="btn-outline" onClick={() => setOpen(true)}>직원 추가</button>}
      {open && (
        <form action={action} className="card grid gap-3 p-5 sm:grid-cols-3">
          <Field label="이름" name="name" required />
          <Field label="회사 이메일 (직원 ID로 사용)" name="email" type="email" required placeholder="name@ninemc.com" />
          <Field label="부서" name="department" />
          <Field label="직급" name="position" />
          <Field label="입사일" name="hire_date" type="date" />
          <Field label="생년월일 (증명서용, 선택)" name="birth_date" type="date" />
          <div>
            <label className="label">권한</label>
            <select name="role" className="input" defaultValue="EMPLOYEE">
              <option value="EMPLOYEE">일반 직원</option>
              <option value="ADMIN">관리자 (경리담당)</option>
            </select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <Submit />
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>닫기</button>
          </div>
          {state.error && <p className="text-[13px] text-red-600 sm:col-span-3">{state.error}</p>}
          {state.ok && <p className="rounded-md bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800 sm:col-span-3">{state.ok}</p>}
        </form>
      )}
    </div>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} required={required} placeholder={placeholder} className="input" />
    </div>
  );
}
