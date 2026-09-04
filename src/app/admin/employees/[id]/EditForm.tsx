"use client";
import { useFormState, useFormStatus } from "react-dom";
import { updateEmployee, type ActionState } from "../../actions";

function Submit() { const { pending } = useFormStatus(); return <button className="btn-primary" disabled={pending}>{pending ? "저장 중..." : "저장"}</button>; }

export default function EditForm({ e }: { e: any }) {
  const [state, action] = useFormState<ActionState, FormData>(updateEmployee, {});
  const F = ({ label, name, type = "text", v }: { label: string; name: string; type?: string; v?: string | null }) => (
    <div><label className="label" htmlFor={name}>{label}</label><input id={name} name={name} type={type} defaultValue={v ?? ""} className="input" /></div>
  );
  return (
    <form action={action} className="card mt-5 grid gap-4 p-5 sm:grid-cols-2">
      <input type="hidden" name="id" value={e.id} />
      <F label="이름" name="name" v={e.name} />
      <div><label className="label">이메일 (로그인 ID)</label><input className="input" value={e.email} disabled /></div>
      <F label="부서" name="department" v={e.department} />
      <F label="직급" name="position" v={e.position} />
      <F label="입사일" name="hire_date" type="date" v={e.hire_date} />
      <F label="생년월일 (증명서용, 선택)" name="birth_date" type="date" v={e.birth_date} />
      <F label="주소 (증명서용, 선택)" name="address" v={e.address} />
      <F label="담당업무 (경력증명서용, 선택)" name="duties" v={e.duties} />
      <div>
        <label className="label" htmlFor="role">권한</label>
        <select id="role" name="role" className="input" defaultValue={e.role}>
          <option value="EMPLOYEE">일반 직원</option><option value="ADMIN">관리자 (경리담당)</option>
        </select>
      </div>
      {state.error && <p className="text-[13px] text-red-600 sm:col-span-2">{state.error}</p>}
      {state.ok && <p className="rounded-md bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800 sm:col-span-2">{state.ok}</p>}
      <div className="sm:col-span-2"><Submit /></div>
    </form>
  );
}
