import Link from "next/link";
import Logo from "./Logo";
import { logout } from "@/app/login/actions";
import type { SessionUser } from "@/lib/auth";

// 얇은 상단 바: 로고 · 이름 · 로그아웃. 메뉴는 직원 탭 / 관리자 메뉴가 담당.
export default function AppHeader({ user }: { user: SessionUser }) {
  const isAdmin = user.role === "ADMIN";
  return (
    <header className="no-print border-b border-line bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href={isAdmin ? "/admin" : "/"} className="flex items-center gap-3">
          <Logo className="h-8" />
          {isAdmin && <span className="rounded bg-navy px-1.5 py-0.5 text-[11px] font-medium text-white">ADMIN</span>}
        </Link>
        <nav className="flex items-center gap-4 text-[13px]">
          <span className="text-muted">{user.employee?.name ?? user.email}</span>
          <Link href="/change-password" className="hidden text-muted hover:text-ink sm:inline">비밀번호 변경</Link>
          <form action={logout}><button className="text-muted hover:text-ink">로그아웃</button></form>
        </nav>
      </div>
    </header>
  );
}
