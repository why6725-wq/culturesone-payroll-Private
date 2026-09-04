import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// 이용 현황: 누가 언제 들어왔고, 확정 명세서를 봤는지
export default async function UsagePage() {
  await requireAdmin();
  const { data } = await createClient().rpc("admin_usage_overview");
  const rows = (data ?? []) as any[];
  const f = (d: string | null) => (d ? new Date(d).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "-");
  const active = rows.filter((r) => r.last_sign_in_at).length;
  return (
    <main className="px-4 py-6 md:px-8">
      <h1 className="text-xl font-semibold">이용 현황</h1>
      <p className="mt-1 text-[14px] text-muted">재직 직원 {rows.length}명 중 {active}명이 로그인한 적 있음. 로그인 최근 순.</p>
      <div className="table-wrap mt-4"><table className="card w-full text-[13px]">
        <thead className="text-left text-[12px] text-muted"><tr className="border-b border-line">
          <th className="px-3 py-2 font-normal">직원</th><th className="px-3 py-2 font-normal">부서</th><th className="px-3 py-2 font-normal">최근 로그인</th>
          <th className="px-3 py-2 font-normal">명세서 열람</th><th className="px-3 py-2 font-normal">최근 열람</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.employee_id} className="border-b border-line last:border-0">
              <td className="px-3 py-2">{r.name}</td>
              <td className="px-3 py-2 text-muted">{r.department ?? "-"}</td>
              <td className={`px-3 py-2 ${r.last_sign_in_at ? "" : "text-red-600"}`}>{r.last_sign_in_at ? f(r.last_sign_in_at) : "로그인한 적 없음"}</td>
              <td className="px-3 py-2">{r.statements_confirmed ? `${r.statements_viewed}/${r.statements_confirmed}건` : "-"}</td>
              <td className="px-3 py-2 text-muted">{f(r.last_viewed_at)}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </main>
  );
}
