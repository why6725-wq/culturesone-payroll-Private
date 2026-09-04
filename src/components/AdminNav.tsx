"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 관리자 메뉴: PC는 왼쪽 세로, 모바일은 상단 가로 스크롤
export default function AdminNav({ certPending = 0 }: { certPending?: number }) {
  const path = usePathname();
  const items = [
    { href: "/admin", label: "월별 급여", active: path === "/admin" || path.startsWith("/admin/upload") || path.startsWith("/admin/entry") },
    { href: "/admin/employees", label: "직원 관리", active: path.startsWith("/admin/employees") },
    { href: "/admin/certificates", label: "증명서", active: path.startsWith("/admin/certificates"), badge: certPending },
    { href: "/admin/documents", label: "서류함", active: path.startsWith("/admin/documents") },
    { href: "/admin/logs", label: "처리 이력", active: path.startsWith("/admin/logs") },
    { href: "/admin/usage", label: "이용 현황", active: path.startsWith("/admin/usage") },
    { href: "/admin/settings", label: "설정", active: path.startsWith("/admin/settings") }
  ];
  return (
    <nav className="no-print border-b border-line bg-white md:w-48 md:shrink-0 md:border-b-0 md:border-r md:bg-transparent">
      <ul className="mx-auto flex max-w-6xl overflow-x-auto px-2 md:flex-col md:gap-0.5 md:px-3 md:py-6">
        {items.map((i) => (
          <li key={i.href} className="shrink-0">
            <Link href={i.href}
              className={`flex items-center gap-2 whitespace-nowrap px-3 py-3 text-[14px] md:rounded-md md:py-2 ${i.active ? "border-b-2 border-navy font-semibold text-navy md:border-b-0 md:bg-white md:shadow-sm" : "text-muted hover:text-ink"}`}>
              {i.label}
              {!!i.badge && <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-medium text-white">{i.badge}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
