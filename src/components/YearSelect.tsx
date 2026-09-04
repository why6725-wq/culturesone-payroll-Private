"use client";
import { useRouter } from "next/navigation";
export default function YearSelect({ years, value }: { years: number[]; value: number }) {
  const router = useRouter();
  return (
    <select value={value} onChange={(e) => router.push(`/?year=${e.target.value}`)} className="input w-auto py-1.5" aria-label="연도 선택">
      {years.map((y) => <option key={y} value={y}>{y}년</option>)}
    </select>
  );
}
