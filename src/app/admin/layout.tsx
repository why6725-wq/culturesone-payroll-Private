import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import AdminNav from "@/components/AdminNav";

// 관리자 영역 공통: 상단 바 + 메뉴. 각 페이지는 본문만 렌더링.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const { count } = await createClient().from("certificate_requests").select("id", { count: "exact", head: true }).eq("status", "REQUESTED");
  return (
    <>
      <AppHeader user={user} />
      <div className="mx-auto flex max-w-6xl flex-col md:flex-row">
        <AdminNav certPending={count ?? 0} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}
