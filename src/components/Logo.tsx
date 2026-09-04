/* eslint-disable @next/next/no-img-element */
// 나인엠씨(NineMC) — 컬처스원의 브랜드 로고. public/logo*.png
export default function Logo({ variant = "horizontal", className = "" }: { variant?: "horizontal" | "stacked" | "mark"; className?: string }) {
  if (variant === "stacked") return <img src="/logo-h.png" alt="NineMC" className={`mx-auto h-12 w-auto ${className}`} />;
  if (variant === "mark") return <img src="/logo-h.png" alt="NineMC" className={`h-8 w-auto ${className}`} />;
  return <img src="/logo-h.png" alt="NineMC" className={`h-7 w-auto ${className}`} />;
}
