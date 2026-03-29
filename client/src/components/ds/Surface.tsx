import { ReactNode } from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
};

export function Surface({ children, className = "", ...props }: Props) {
  return (
    <div
      {...props}
      className={`rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
