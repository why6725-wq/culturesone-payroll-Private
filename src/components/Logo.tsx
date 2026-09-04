/* eslint-disable @next/next/no-img-element */
// 컬처스원(CULTURES ONE) 로고. public/logo*.png
export default function Logo({ variant = "horizontal", className = "" }: { variant?: "horizontal" | "stacked" | "mark"; className?: string }) {
  if (variant === "stacked") return <img src="/logo-h.png" alt="CULTURES ONE" className={`mx-auto h-12 w-auto ${className}`} />;
  if (variant === "mark") return <img src="/logo-h.png" alt="CULTURES ONE" className={`h-8 w-auto ${className}`} />;
  return <img src="/logo-h.png" alt="CULTURES ONE" className={`h-7 w-auto ${className}`} />;
}
