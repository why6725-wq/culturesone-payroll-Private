import "server-only";
import * as XLSX from "xlsx";
import { FIXED_HEAD, FIXED_TAIL, lastDayOf, type ItemType } from "./columns";

export type ParsedRow = {
  rowNo: number;
  email: string;
  name: string;
  payDate: string;
  items: { itemTypeId: string; name: string; amount: number }[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  note: string | null;
  employeeId?: string;
  employeeName?: string;
  errors: string[];
  warnings: string[];
};

const norm = (s: unknown) => String(s ?? "").replace(/\s+/g, "").trim();

function toNumber(v: unknown): number | null {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v) : null;
  const n = Number(String(v).replace(/[,\s원]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

function toDate(v: unknown, fallback: string): string | null {
  if (v == null || v === "") return fallback;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") { // 엑셀 시리얼
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim().replace(/[./]/g, "-");
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

export function parseWorkbook(buf: ArrayBuffer, year: number, month: number, itemTypes: ItemType[],
  employees: { id: string; email: string; name: string; employment_status: string }[]): { rows: ParsedRow[]; headerErrors: string[] } {
  const wb = XLSX.read(buf, { type: "array", cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
  if (aoa.length < 2) return { rows: [], headerErrors: ["데이터 행이 없습니다. 2행부터 직원 급여를 입력하세요."] };

  // 헤더 매핑 (공백 무시)
  const header = aoa[0].map(norm);
  const col = (name: string) => header.indexOf(norm(name));
  const headerErrors: string[] = [];
  for (const h of FIXED_HEAD) if (col(h) < 0) headerErrors.push(`"${h}" 컬럼이 없습니다.`);
  const itemCols = itemTypes.map((t) => ({ t, idx: col(t.name) }));
  const unknownCols = header.filter((h) => h && ![...FIXED_HEAD, ...FIXED_TAIL].map(norm).includes(h) && !itemTypes.some((t) => norm(t.name) === h));
  if (unknownCols.length) headerErrors.push(`알 수 없는 컬럼: ${unknownCols.join(", ")} — 항목을 추가하려면 먼저 관리자 > 급여 항목에서 등록하세요.`);
  if (headerErrors.length) return { rows: [], headerErrors };

  const byEmail = new Map(employees.map((e) => [e.email.toLowerCase(), e]));
  const fallbackDate = lastDayOf(year, month);
  const rows: ParsedRow[] = [];

  aoa.slice(1).forEach((r, i) => {
    const rowNo = i + 2;
    if (r.every((c) => c === "" || c == null)) return; // 빈 행 무시
    const errors: string[] = []; const warnings: string[] = [];
    const email = String(r[col("이메일")] ?? "").trim().toLowerCase();
    const name = String(r[col("이름")] ?? "").trim();
    const emp = byEmail.get(email);
    if (!email) errors.push("이메일이 비어 있습니다.");
    else if (!emp) errors.push("직원정보를 찾을 수 없습니다. (이메일 불일치)");
    else if (emp.employment_status !== "ACTIVE") errors.push("퇴사 처리된 직원입니다.");
    else if (name && emp.name !== name) warnings.push(`이름이 직원정보(${emp.name})와 다릅니다.`);

    const payDate = toDate(r[col("지급일")], fallbackDate);
    if (!payDate) errors.push("지급일 형식이 올바르지 않습니다. (예: 2026-08-31)");

    const items: ParsedRow["items"] = [];
    let sumE = 0, sumD = 0;
    for (const { t, idx } of itemCols) {
      const n = idx >= 0 ? toNumber(r[idx]) : 0;
      if (n == null) { errors.push(`${t.name} 금액이 숫자가 아닙니다.`); continue; }
      if (n < 0) warnings.push(`${t.name} 금액이 음수입니다.`);
      items.push({ itemTypeId: t.id, name: t.name, amount: n });
      if (t.category === "EARNING") sumE += n; else sumD += n;
    }

    const ci = (h: string) => { const c = col(h); return c >= 0 ? toNumber(r[c]) : 0; };
    const tE = ci("지급총액"), tD = ci("공제총액"), tN = ci("차감지급액");
    const hasTotals = [tE, tD, tN].some((v) => v != null && v !== 0);
    // 합계 컬럼이 비어 있으면 항목 합계로 채우고, 값이 있으면 검증만 한다(자동 수정 금지).
    const totalEarnings = hasTotals ? (tE ?? 0) : sumE;
    const totalDeductions = hasTotals ? (tD ?? 0) : sumD;
    const netPay = hasTotals ? (tN ?? 0) : sumE - sumD;
    if (hasTotals) {
      if (totalEarnings !== sumE) errors.push(`지급총액(${totalEarnings.toLocaleString()})이 지급항목 합계(${sumE.toLocaleString()})와 일치하지 않습니다.`);
      if (totalDeductions !== sumD) errors.push(`공제총액(${totalDeductions.toLocaleString()})이 공제항목 합계(${sumD.toLocaleString()})와 일치하지 않습니다.`);
      if (netPay !== totalEarnings - totalDeductions) errors.push(`차감지급액(${netPay.toLocaleString()})이 지급총액-공제총액(${(totalEarnings - totalDeductions).toLocaleString()})과 일치하지 않습니다.`);
    }
    if (sumE === 0) warnings.push("지급항목이 모두 0입니다.");

    const noteCol = col("비고");
    rows.push({ rowNo, email, name, payDate: payDate ?? fallbackDate, items, totalEarnings, totalDeductions, netPay,
      note: noteCol >= 0 && r[noteCol] ? String(r[noteCol]) : null, employeeId: emp?.id, employeeName: emp?.name, errors, warnings });
  });

  // 같은 직원 중복
  const seen = new Map<string, number>();
  for (const row of rows) {
    if (!row.email) continue;
    if (seen.has(row.email)) row.errors.push(`${seen.get(row.email)}행과 이메일이 중복됩니다.`);
    else seen.set(row.email, row.rowNo);
  }
  return { rows, headerErrors: [] };
}
