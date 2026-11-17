import type { ReactNode } from "react";

const TONES = {
  red: "border-red-200 bg-red-50 text-red-800",
  yellow: "border-amber-200 bg-amber-50 text-amber-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
} as const;

export default function Alert({
  tone = "red",
  title,
  children,
}: {
  tone?: keyof typeof TONES;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-4 ${TONES[tone]}`}>
      <p className="text-sm font-semibold">{title}</p>
      {children && <p className="mt-1 text-sm">{children}</p>}
    </div>
  );
}