"use client";
import { useRouter } from "next/navigation";
export default function MonthPicker({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const y0 = new Date().getFullYear();
  const go = (y: number, m: number) => router.push(`/admin?y=${y}&m=${m}`);
  return (
    <div className="flex gap-2">
      <select value={year} onChange={(e) => go(Number(e.target.value), month)} className="input w-auto py-1.5" aria-label="연도">
        {Array.from({ length: 6 }, (_, i) => y0 + 1 - i).map((y) => <option key={y} value={y}>{y}년</option>)}
      </select>
      <select value={month} onChange={(e) => go(year, Number(e.target.value))} className="input w-auto py-1.5" aria-label="월">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}월</option>)}
      </select>
    </div>
  );
}
