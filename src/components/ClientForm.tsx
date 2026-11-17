"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Secteur = { id: number; label: string };

export default function ClientForm({ secteurs }: { secteurs: Secteur[] }) {
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
  }

  if (secteurs.length === 0) {
    return <p className="text-orange-600">Créez d'abord un secteur.</p>;
  }

  const cls = "rounded border p-2";
  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        envoyer(false);
      }}
      className="grid max-w-2xl gap-3 sm:grid-cols-2"
    >
      <input name="nomCommerce" placeholder="Nom du commerce" required className={cls} />
      <input name="responsable" placeholder="Responsable" required className={cls} />
      <input name="telephone" placeholder="Téléphone" required className={cls} />
      <input name="adresse" placeholder="Adresse" required className={cls} />
      <select name="secteurId" required defaultValue="" className={`${cls} sm:col-span-2`}>
        <option value="" disabled>
          Secteur
        </option>
        {secteurs.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="sm:col-span-2">
          <p className={doublon ? "text-orange-600" : "text-red-600"}>{error}</p>
          {doublon && (
            <button
              type="button"
              onClick={() => envoyer(true)}
              className="mt-1 text-sm text-blue-700 underline"
            >
              Enregistrer quand même
            </button>
          )}
        </div>
      )}
      <button
        disabled={loading}
        className="rounded bg-blue-700 p-2 text-white disabled:opacity-50 sm:col-span-2"
      >
        {loading ? "Patientez..." : "Ajouter le client"}
      </button>
    </form>
  );
}