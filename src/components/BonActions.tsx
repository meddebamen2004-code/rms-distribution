"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { inputCls } from "@/components/ui/styles";

export type ActionDef = {
  action: string;
  label: string;
  variant?: "primary" | "secondary" | "danger";
  needsComment?: boolean;
  disabled?: boolean;
};

export default function BonActions({
  bonId,
  actions,
  hint,
  redirectTo,
}: {
  bonId: number;
  actions: ActionDef[];
  hint?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [commentaire, setCommentaire] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const avecCommentaire = actions.some((a) => a.needsComment);

  async function lancer(a: ActionDef) {
    setError("");
    if (a.needsComment && commentaire.trim().length < 3) {
      setError("Un commentaire est obligatoire pour cette action");
      return;
    }
    setLoading(a.action);
    const res = await fetch(`/api/bons/${bonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: a.action, commentaire }),
    });
    setLoading(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? `Erreur ${res.status}`);
      router.refresh();
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-3">
      {error && <Alert title="Action impossible">{error}</Alert>}
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
      {avecCommentaire && (
        <input
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder="Commentaire (obligatoire pour refuser ou renvoyer)"
          className={inputCls}
        />
      )}
      <div className="flex flex-wrap gap-3">
        {actions.map((a) => (
          <Button
            key={a.action}
            variant={a.variant ?? "primary"}
            disabled={a.disabled || loading !== null}
            onClick={() => lancer(a)}
          >
            {loading === a.action ? "Patientez..." : a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}