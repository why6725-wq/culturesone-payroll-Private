export const won = (n: number | bigint | null | undefined) =>
  n == null ? "-" : Number(n).toLocaleString("ko-KR");

export const ym = (y: number, m: number) => `${y}년 ${String(m).padStart(2, "0")}월`;

export const dateDot = (d: string | null | undefined) =>
  d ? d.slice(0, 10).replaceAll("-", ".") : "-";

export const STATUS_LABEL: Record<string, string> = {
  NONE: "미등록",
  DRAFT: "작성중",
  REGISTERED: "등록완료",
  CONFIRMED: "확정",
  CORRECTED: "정정됨",
  CANCELLED: "취소",
  VOID: "폐기"
};
