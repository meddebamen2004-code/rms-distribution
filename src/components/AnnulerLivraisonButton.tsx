"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function AnnulerLivraisonButton({ id, client }: { id: number; client: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function annuler() {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/livraisons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ANNULER" }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? `Erreur ${res.status}`);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-red-600 hover:underline"
      >
        Annuler
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Annuler cette livraison ?"
        subtitle={`Livraison chez ${client}. Le stock du camion sera remis à jour et l’annulation restera tracée.`}
        size="sm"
      >
        {error && (
          <div className="mb-4">
            <Alert title="Annulation impossible">{error}</Alert>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Retour
          </Button>
          <Button variant="danger" onClick={annuler} disabled={loading}>
            {loading ? "Patientez..." : "Annuler la livraison"}
          </Button>
        </div>
      </Modal>
    </>
  );
}