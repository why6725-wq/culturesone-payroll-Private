import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import EditForm from "./EditForm";

export default async function EmployeeEditPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const { data: e } = await createClient().from("employees")
    .select("id, name, email, department, position, hire_date, birth_date, address, duties, employment_status, profiles(role)")
    .eq("id", params.id).maybeSingle();
  if (!e) notFound();
  const p = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
  return (
    <main className="max-w-3xl px-4 py-6 md:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">직원 정보 수정</h1>
        <Link href="/admin/employees" className="btn-outline py-1.5 text-[13px]">목록으로</Link>
      </div>
      <p className="mt-1 text-[14px] text-muted">이메일(로그인 ID)은 바꿀 수 없습니다. 변경 내역은 처리 이력에 남습니다.</p>
      <EditForm e={{ ...e, role: (p as any)?.role ?? "EMPLOYEE" }} />
    </main>
  );
}
