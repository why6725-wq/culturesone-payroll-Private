"use client";
import { useEffect, useRef, useState } from "react";

// 문서를 항상 A4 비율의 고정 폭(DOC_WIDTH)으로 그리고, 화면이 좁으면 전체를 비율 그대로 축소한다.
// 모바일에서도 PC/인쇄물과 동일한 배치가 유지되며, 인쇄 시에는 축소를 해제한다.
const DOC_WIDTH = 700;

export default function PayslipScaler({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>();

  useEffect(() => {
    const update = () => {
      if (!outer.current || !inner.current) return;
      const s = Math.min(1, outer.current.clientWidth / DOC_WIDTH);
      setScale(s);
      setHeight(inner.current.offsetHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outer} className="payslip-scaler" style={{ height }}>
      <div ref={inner} className="payslip-scaler-inner" style={{ width: DOC_WIDTH, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
