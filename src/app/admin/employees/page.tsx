import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateDot } from "@/lib/format";
import EmployeeForm from "./EmployeeForm";
import ActiveToggle from "./ActiveToggle";

export default async function EmployeesPage() {
  const user = await requireAdmin();
  const supabase = createClient();
  const { data } = await supabase
    .from("employees")
    .select("id, name, email, department, position, hire_date, employment_status, profiles(role, is_active)")
    .order("employment_status").order("name");

  return (
    <>
      <main className="px-4 py-6 md:px-8">
        <h1 className="text-xl font-semibold">직원 관리</h1>
        <EmployeeForm />
        <table className="card mt-6 w-full text-[14px]">
          <thead className="text-left text-[12px] text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-2.5 font-normal">이름</th>
              <th className="hidden px-4 py-2.5 font-normal md:table-cell">이메일</th>
              <th className="px-4 py-2.5 font-normal">부서 / 직급</th>
              <th className="hidden px-4 py-2.5 font-normal sm:table-cell">입사일</th>
              <th className="px-4 py-2.5 font-normal">재직 / 계정</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((e: any) => {
              const p = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
              const active = e.employment_status === "ACTIVE";
              return (
                <tr key={e.id} className={`border-b border-line last:border-0 ${active ? "" : "text-muted"}`}>
                  <td className="px-4 py-3">{e.name}<span className="ml-2 text-[12px] text-muted md:hidden">{e.email}</span>{p?.role === "ADMIN" && <span className="ml-2 rounded bg-navy px-1 text-[10px] text-white">ADMIN</span>}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{e.email}</td>
                  <td className="px-4 py-3">{e.department ?? "-"} / {e.position ?? "-"}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{dateDot(e.hire_date)}</td>
                  <td className="px-4 py-3">{active ? "재직" : "퇴사"} / {p ? (p.is_active ? "활성" : "비활성") : "계정없음"}</td>
                  <td className="px-4 py-3 text-right"><ActiveToggle id={e.id} active={active} name={e.name} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </main>
    </>
  );
}
