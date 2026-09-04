import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Logo from "@/components/Logo";
import MfaClient from "./MfaClient";

// 관리자 2단계 인증: 등록(QR) 또는 코드 입력
export default async function MfaPage({ searchParams }: { searchParams: { setup?: string } }) {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  if (u.role !== "ADMIN") redirect("/");
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 text-center"><Logo variant="stacked" /><p className="mt-2 text-[15px] text-muted">관리자 2단계 인증</p></div>
        <Suspense><MfaClient setup={searchParams.setup === "1"} /></Suspense>
      </div>
    </main>
  );
}
