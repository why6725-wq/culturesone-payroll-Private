/* eslint-disable @next/next/no-img-element */
import { dateDot, won } from "@/lib/format";
import type { CertSnapshot } from "@/lib/certificates";

// 컬처스원 실제 재직·경력증명서(HWP) 양식을 그대로 옮긴 문서. 발급 시점 스냅샷으로 렌더링.
const K = (d: string | null | undefined) => {
  if (!d) return null;
  const [y, m, dd] = d.slice(0, 10).split("-");
  return `${y}년 ${Number(m)}월 ${Number(dd)}일`;
};

export default function CertificateDocument({ s, type, issueNo, issuedAt, purpose }:
  { s: CertSnapshot; type: string; issueNo: string; issuedAt: string; purpose: string }) {
  const e = s.employee, c = s.company;
  const issued = new Date(issuedAt);
  const dateKo = `${issued.getFullYear()} 년 ${issued.getMonth() + 1} 월 ${issued.getDate()} 일`;
  const isCareer = type === "CAREER";
  const period = `${K(e.hire_date) ?? "        년    월    일"}부터  ~  ${isCareer && e.resign_date ? `${K(e.resign_date)}까지` : "현재까지"}`;
  const totals = s.income.reduce((a, r) => ({ e: a.e + r.total_earnings, d: a.d + r.total_deductions, n: a.n + r.net_pay }), { e: 0, d: 0, n: 0 });
  const spaced = (t: string) => t.split("").join("  ");
  // 주민등록번호: 신청 시 전체 입력했으면 13자리, 아니면 생년월일 앞 6자리 + 뒷자리 마스킹
  const rrnText = e.rrn && e.rrn.length === 13
    ? `${e.rrn.slice(0, 6)}-${e.rrn.slice(6)}`
    : e.birth_date ? `${e.birth_date.slice(2, 4)}${e.birth_date.slice(5, 7)}${e.birth_date.slice(8, 10)}-*******` : "";

  return (
    <div className="payslip cert">
      <div className="cert-head">
        <img src="/logo-h.png" alt={c.brand_name} className="payslip-logo" />
        <span className="cert-no">발급번호 {issueNo}</span>
      </div>
      <h1 className="cert-title">{spaced(s.template.title)}</h1>

      {/* 인적사항 */}
      <table className="payslip-table cert-table">
        <colgroup><col className="w-[12%]" /><col className="w-[18%]" /><col className="w-[25%]" /><col className="w-[20%]" /><col className="w-[25%]" /></colgroup>
        <tbody>
          <tr>
            <th rowSpan={2} className="vert-label">인 적<br />사 항</th>
            <th>성    명</th><td className="info">{e.name}</td>
            <th>주민등록번호</th><td className="info tabular-nums">{rrnText}</td>
          </tr>
          <tr>
            <th>주    소</th><td className="info" colSpan={3}>{e.address ?? ""}</td>
          </tr>
        </tbody>
      </table>

      {/* 재직사항 */}
      <table className="payslip-table cert-table">
        <colgroup><col className="w-[12%]" /><col className="w-[18%]" /><col className="w-[70%]" /></colgroup>
        <tbody>
          <tr><th rowSpan={3} className="vert-label">재 직<br />사 항</th><th>소    속</th><td className="info">{e.department ?? ""}</td></tr>
          <tr><th>직    위</th><td className="info">{e.position ?? ""}</td></tr>
          <tr><th>재직기간</th><td className="info">{period}</td></tr>
        </tbody>
      </table>

      {/* 용도 / 담당업무 */}
      <table className="payslip-table cert-table">
        <colgroup><col className="w-[30%]" /><col className="w-[70%]" /></colgroup>
        <tbody>
          {isCareer && <tr><th>담당업무</th><td className="info">{e.duties ?? ""}</td></tr>}
          <tr><th>용    도</th><td className="info">{purpose}</td></tr>
        </tbody>
      </table>

      {type === "INCOME" && (
        <table className="payslip-table cert-table cert-income">
          <thead>
            <tr className="sec"><th colSpan={5}>급여 지급 내역 (최근 {s.income.length}개월)</th></tr>
            <tr><th>지급년월</th><th>지급일</th><th>지급총액</th><th>공제총액</th><th>실지급액</th></tr>
          </thead>
          <tbody>
            {s.income.map((r) => (
              <tr key={`${r.year}-${r.month}`}>
                <td className="info">{r.year}년 {String(r.month).padStart(2, "0")}월</td><td className="info">{dateDot(r.pay_date)}</td>
                <td className="num">{won(r.total_earnings)}</td><td className="num">{won(r.total_deductions)}</td><td className="num">{won(r.net_pay)}</td>
              </tr>
            ))}
            <tr className="total"><th colSpan={2}>합 계</th><td className="num">{won(totals.e)}</td><td className="num">{won(totals.d)}</td><td className="num">{won(totals.n)}</td></tr>
          </tbody>
        </table>
      )}

      <p className="cert-statement">{s.template.statement}</p>
      {isCareer && c.issuer_contact && <p className="cert-contact">발급 담당자 : {c.issuer_contact}</p>}
      <p className="cert-date">{dateKo}</p>

      <div className="cert-company">
        <p className="cert-company-name">{c.company_name}</p>
        {(c.address || c.biz_no || c.phone) && (
          <p className="cert-company-meta">
            {c.biz_no && <span>사업자등록번호 {c.biz_no}</span>}{c.address && <span>{c.address}</span>}{c.phone && <span>TEL {c.phone}</span>}
          </p>
        )}
        <p className="cert-issuer">{c.ceo_name ? spaced(c.ceo_name) : c.issuer_title}<span className="cert-in">(인)</span><img src="/seal.png" alt="직인" className="cert-seal" /></p>
      </div>
    </div>
  );
}
