"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// 직원 화면 상단 탭: 내 급여명세서 / 증명서 발급
export default function EmployeeTabs({ certBadge = 0 }: { certBadge?: number }) {
  const path = usePathname();
  const tabs = [
    { href: "/", label: "내 급여명세서", active: path === "/" },
    { href: "/certificates", label: "증명서 발급", active: path.startsWith("/certificates"), badge: certBadge },
    { href: "/documents", label: "서류함", active: path.startsWith("/documents") }
  ];
  return (
    <nav className="no-print border-b border-line bg-white">
      <div className="mx-auto flex max-w-4xl px-4">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href}
            className={`relative -mb-px flex-1 py-3.5 text-center text-[15px] sm:flex-none sm:px-6 ${t.active ? "border-b-2 border-navy font-semibold text-navy" : "text-muted hover:text-ink"}`}>
            {t.label}
            {!!t.badge && <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-navy px-1.5 text-[11px] font-medium text-white">{t.badge}</span>}
          </Link>
        ))}
      </div>
    </nav>
  );
}
