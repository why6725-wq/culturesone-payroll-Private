/* eslint-disable @next/next/no-img-element */
import { dateDot, won } from "@/lib/format";
import type { CertSnapshot } from "@/lib/certificates";

// 증명서 문서 (발급 시점 스냅샷으로 렌더링 — 이후 직원정보·양식이 바뀌어도 발급본은 그대로)
export default function CertificateDocument({ s, type, issueNo, issuedAt, purpose }:
  { s: CertSnapshot; type: string; issueNo: string; issuedAt: string; purpose: string }) {
  const e = s.employee, c = s.company;
  const period = `${dateDot(e.hire_date)} ~ ${type === "CAREER" && e.resign_date ? dateDot(e.resign_date) : "현재"}`;
  const issued = new Date(issuedAt);
  const dateKo = `${issued.getFullYear()}년 ${issued.getMonth() + 1}월 ${issued.getDate()}일`;
  const totals = s.income.reduce((a, r) => ({ e: a.e + r.total_earnings, d: a.d + r.total_deductions, n: a.n + r.net_pay }), { e: 0, d: 0, n: 0 });

  return (
    <div className="payslip cert">
      <div className="cert-head">
        <img src="/logo-h.png" alt={c.brand_name} className="payslip-logo" />
        <span className="cert-no">발급번호 {issueNo}</span>
      </div>
      <h1 className="cert-title">{s.template.title}</h1>

      <table className="payslip-table cert-table">
        <colgroup><col className="w-[22%]" /><col className="w-[28%]" /><col className="w-[22%]" /><col className="w-[28%]" /></colgroup>
        <tbody>
          <tr className="sec top"><th colSpan={4}>인적사항</th></tr>
          <tr><th>성 명</th><td className="info">{e.name}</td><th>생년월일</th><td className="info">{e.birth_date ? dateDot(e.birth_date) : "-"}</td></tr>
          <tr><th>소 속</th><td className="info">{e.department ?? "-"}</td><th>직 위</th><td className="info">{e.position ?? "-"}</td></tr>
          <tr><th>{type === "CAREER" ? "재직기간" : "재직기간"}</th><td className="info" colSpan={3}>{period}</td></tr>
          <tr><th>용 도</th><td className="info" colSpan={3}>{purpose}</td></tr>
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
      <p className="cert-date">{dateKo}</p>

      <div className="cert-company">
        <p className="cert-company-name">{c.company_name}</p>
        {(c.address || c.biz_no || c.phone) && (
          <p className="cert-company-meta">
            {c.biz_no && <span>사업자등록번호 {c.biz_no}</span>}{c.address && <span>{c.address}</span>}{c.phone && <span>TEL {c.phone}</span>}
          </p>
        )}
        <p className="cert-issuer">{c.issuer_title} {c.ceo_name}<img src="/seal.svg" alt="직인" className="cert-seal" /></p>
      </div>
    </div>
  );
}
