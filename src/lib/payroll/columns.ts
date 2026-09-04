// 엑셀 업로드 템플릿 컬럼 정의. 항목 컬럼은 pay_item_types에서 동적으로 붙는다.
export const FIXED_HEAD = ["이메일", "이름", "지급일"] as const;
export const FIXED_TAIL = ["지급총액", "공제총액", "차감지급액", "비고"] as const;

export type ItemType = { id: string; code: string; name: string; category: "EARNING" | "DEDUCTION"; sort_order: number };

export function buildHeader(items: ItemType[]) {
  const earn = items.filter((i) => i.category === "EARNING").sort((a, b) => a.sort_order - b.sort_order);
  const ded = items.filter((i) => i.category === "DEDUCTION").sort((a, b) => a.sort_order - b.sort_order);
  return [...FIXED_HEAD, ...earn.map((i) => i.name), ...ded.map((i) => i.name), ...FIXED_TAIL];
}

// 매월 말일
export function lastDayOf(year: number, month: number) {
  const d = new Date(Date.UTC(year, month, 0));
  return `${year}-${String(month).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
