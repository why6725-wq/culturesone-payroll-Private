export const DOC_CATEGORIES = ["원천징수영수증", "근로계약서", "연봉계약서", "기타"] as const;
export const fmtSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`);
