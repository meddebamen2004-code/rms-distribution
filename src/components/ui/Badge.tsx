import type { ReactNode } from "react";

const TONES = {
  green: "bg-green-50 text-green-700",
  orange: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
  gray: "bg-slate-100 text-slate-600",
} as const;

export default function Badge({
  tone = "gray",
  children,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}