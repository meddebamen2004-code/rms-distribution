"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Card from "@/components/ui/Card";
import ArchiveButton from "@/components/ArchiveButton";
import { inputCls, tdCls, thCls } from "@/components/ui/styles";

export type ProduitRow = {
  id: number;
  reference: string;
  nom: string;
  categorie: string;
  prix: number;
  piecesParCarton: number;
  archive: boolean;
  stockLabel: string;
  bas: boolean;
};

export default function ProduitsTable({
  rows,
  categories,
}: {
  rows: ProduitRow[];
  categories: string[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const filtres = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!cat || r.categorie === cat) &&
        (!needle || r.nom.toLowerCase().includes(needle) || r.reference.toLowerCase().includes(needle))
    );
  }, [rows, q, cat]);

  const actifs = filtres.filter((r) => !r.archive).length;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-60 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit ou une référence"
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={`${inputCls} sm:w-56`}>
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p className="ml-auto text-xs text-slate-500">{actifs} produits actifs</p>
      </div>

      <div className="overflow-x-auto border-t border-slate-200">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Produit</th>
              <th className={thCls}>Référence</th>
              <th className={thCls}>Catégorie</th>
              <th className={thCls}>Prix</th>
              <th className={thCls}>Conditionnement</th>
              <th className={thCls}>Stock</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtres.map((r) => (
              <tr key={r.id} className={r.archive ? "opacity-50" : ""}>
                <td className={`${tdCls} font-semibold text-slate-900`}>
                  {r.nom} {r.archive && <em className="font-normal text-slate-500">(archivé)</em>}
                </td>
                <td className={tdCls}>
                  <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                    {r.reference}
                  </span>
                </td>
                <td className={tdCls}>{r.categorie}</td>
                <td className={tdCls}>{r.prix.toFixed(2)} €</td>
                <td className={tdCls}>{r.piecesParCarton} pièces / carton</td>
                <td className={tdCls}>
                  <span className={r.bas ? "font-semibold text-red-600" : "font-semibold text-green-600"}>
                    {r.stockLabel}
                  </span>
                </td>
                <td className={tdCls}>
                  <ArchiveButton id={r.id} archive={r.archive} />
                </td>
              </tr>
            ))}
            {filtres.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                  Aucun produit ne correspond à la recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}