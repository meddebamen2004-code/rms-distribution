"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { inputCls, labelCls } from "@/components/ui/styles";

type Secteur = { id: number; label: string };

export default function ClientForm({
  secteurs,
  onSuccess,
  onCancel,
}: {
  secteurs: Secteur[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [doublon, setDoublon] = useState(false);
  const [loading, setLoading] = useState(false);

  async function envoyer(confirmerDoublon: boolean) {
    const form = formRef.current;
    if (!form) return;
    setError("");
    setDoublon(false);
    setLoading(true);
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, confirmerDoublon }),
    });
    setLoading(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue");
      setDoublon(json.doublon === true);
      return;
    }
    form.reset();
    router.refresh();
    onSuccess?.();
  }

  if (secteurs.length === 0) {
    return (
      <Alert tone="yellow" title="Aucun secteur">
        Créez d’abord un secteur dans la section « Secteurs » de la page.
      </Alert>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        envoyer(false);
      }}
      className="space-y-5"
    >
      {error &&
        (doublon ? (
          <Alert tone="yellow" title="Numéro déjà utilisé">
            {error}
          </Alert>
        ) : (
          <Alert title="Enregistrement impossible">{error}</Alert>
        ))}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Nom du commerce *</label>
          <input name="nomCommerce" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Responsable *</label>
          <input name="responsable" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Téléphone *</label>
          <input name="telephone" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Adresse *</label>
          <input name="adresse" required className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Secteur de livraison *</label>
          <select name="secteurId" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              Sélectionner un secteur
            </option>
            {secteurs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        {doublon && (
          <Button variant="secondary" disabled={loading} onClick={() => envoyer(true)}>
            Enregistrer quand même
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Patientez..." : "Enregistrer le client"}
        </Button>
      </div>
    </form>
  );
}