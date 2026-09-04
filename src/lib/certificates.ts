export const CERT_TYPE_LABEL: Record<string, string> = { EMPLOYMENT: "재직증명서", CAREER: "경력증명서", INCOME: "급여증명서" };
export const CERT_STATUS_LABEL: Record<string, string> = { REQUESTED: "승인 대기", ISSUED: "발급 완료", REJECTED: "반려", REVOKED: "폐기" };

export type CertSnapshot = {
  employee: { name: string; email: string; department: string | null; position: string | null; hire_date: string | null; resign_date: string | null; birth_date: string | null; address?: string | null; duties?: string | null; rrn?: string | null; employment_status: string };
  company: { company_name: string; brand_name: string; ceo_name: string; biz_no: string; address: string; phone: string; issuer_title: string; issuer_contact?: string };
  template: { title: string; statement: string };
  income: { year: number; month: number; pay_date: string; total_earnings: number; total_deductions: number; net_pay: number }[];
};
