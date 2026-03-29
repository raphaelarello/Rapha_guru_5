import { ReactNode } from "react";

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs ${className}`}>
      {children}
    </span>
  );
}
