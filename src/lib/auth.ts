import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  userId: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  employeeId: string | null;
  mustChangePassword: boolean;
  employee: { id: string; email: string; name: string; department: string | null; position: string | null } | null;
};

// 서버에서 세션 + 프로필을 확인한다. 브라우저 값은 신뢰하지 않는다.
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser(); // getSession()이 아니라 getUser(): 토큰을 서버에서 재검증
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, employee_id, is_active, must_change_password, employees(id, email, name, department, position)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) return null;

  const emp = Array.isArray(profile.employees) ? profile.employees[0] : profile.employees;
  return {
    userId: user.id,
    email: user.email ?? "",
    role: profile.role,
    employeeId: profile.employee_id,
    mustChangePassword: profile.must_change_password,
    employee: emp ?? null
  };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  if (u.mustChangePassword) redirect("/change-password?first=1");
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect("/");
  return u;
}
