"use client";
import { Minus, Plus } from "lucide-react";

export default function Stepper({
  label,
  value,
  onMinus,
  onPlus,
  minusDisabled,
  plusDisabled,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled: boolean;
  plusDisabled: boolean;
}) {
  const btn =
    "flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onMinus} disabled={minusDisabled} aria-label={`Retirer des ${label.toLowerCase()}`} className={btn}>
          <Minus size={20} />
        </button>
        <span className="w-10 text-center text-xl font-semibold text-slate-900">{value}</span>
        <button type="button" onClick={onPlus} disabled={plusDisabled} aria-label={`Ajouter des ${label.toLowerCase()}`} className={btn}>
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}