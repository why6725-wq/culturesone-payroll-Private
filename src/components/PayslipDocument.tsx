import { dateDot, won } from "@/lib/format";

// 컬처스원 실제 급여명세서 양식(엑셀)을 그대로 옮긴 문서 컴포넌트. 화면·인쇄 공용.
export type PayslipData = {
  showZero?: boolean;   // 관리자 미리보기: 0원도 표시. 직원용 문서는 빈칸(기본).
  seal?: { purpose: string; issuedAt: string }; // 날인본: 직인 + 사용용도 + 발급일
  pay_year: number; pay_month: number; pay_date: string; note?: string | null;
  total_earnings: number; total_deductions: number; net_pay: number;
  employee: { name: string; department: string | null; position: string | null };
  earnings: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
};

const ROWS = 13; // 원본 양식의 항목 행 수 (빈 칸 포함) — 인쇄 시 항상 같은 높이 유지

export default function PayslipDocument({ d }: { d: PayslipData }) {
  const rows = Math.max(ROWS, d.earnings.length, d.deductions.length);
  const e = (i: number) => d.earnings[i];
  const x = (i: number) => d.deductions[i];
  const amt = (v?: number) => (v == null ? "" : v === 0 && !d.showZero ? "" : won(v));

  return (
    <div className="payslip">
      <img src="/logo-h.png" alt="NineMC" className="payslip-logo" /> {/* eslint-disable-line @next/next/no-img-element */}
      <h1 className="payslip-title">{d.pay_year}년 {d.pay_month}월 급여명세서</h1>

      <table className="payslip-table">
        <colgroup>
          <col className="w-[6%]" /><col className="w-[22%]" /><col className="w-[22%]" />
          <col className="w-[6%]" /><col className="w-[22%]" /><col className="w-[22%]" />
        </colgroup>
        <tbody>
          <tr className="sec top"><th colSpan={6}>직원정보</th></tr>
          <tr>
            <th colSpan={2}>성 명</th><td className="info">{d.employee.name}</td>
            <th colSpan={2}>부 서</th><td className="info">{d.employee.department ?? ""}</td>
          </tr>
          <tr>
            <th colSpan={2}>직 책</th><td className="info">{d.employee.position ?? ""}</td>
            <th colSpan={2}>지급일</th><td className="info">{dateDot(d.pay_date)}</td>
          </tr>
          <tr className="sec"><th colSpan={6}>급여 및 공제내역</th></tr>

          {Array.from({ length: rows }, (_, i) => (
            <tr key={i} className="item">
              {i === 0 && <th rowSpan={rows} className="vert">급여내역</th>}
              <th>{e(i)?.name ?? ""}</th>
              <td className="num">{amt(e(i)?.amount)}</td>
              {i === 0 && <th rowSpan={rows} className="vert">공제내역</th>}
              <th>{x(i)?.name ?? ""}</th>
              <td className="num">{amt(x(i)?.amount)}</td>
            </tr>
          ))}

          <tr className="total">
            <th colSpan={2}>지급총액</th><td className="num">{won(d.total_earnings)}</td>
            <th colSpan={2}>공제총액</th><td className="num">{won(d.total_deductions)}</td>
          </tr>
          <tr className="net">
            <th colSpan={3}>차감지급액</th><td colSpan={3} className="num">{won(d.net_pay)}</td>
          </tr>
        </tbody>
      </table>

      {d.note && <p className="payslip-note">{d.note}</p>}

      <p className="payslip-thanks">귀하의 노고에 감사드립니다.</p>

      {d.seal && (
        <div className="payslip-issue">
          <span>용도: {d.seal.purpose}</span>
          <span>발급일: {d.seal.issuedAt}</span>
        </div>
      )}
      <p className="payslip-company">
        주식회사 컬처스원
        {d.seal && <img src="/seal.png" /* 직인은 인쇄 정확도를 위해 원본 그대로 사용 */ // eslint-disable-line @next/next/no-img-element
           alt="직인" className="payslip-seal" />}
      </p>
    </div>
  );
}
