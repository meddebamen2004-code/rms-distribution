"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { inputCls, tdCls, thCls } from "@/components/ui/styles";

export type ClientRow = {
  id: number;
  nomCommerce: string;
  responsable: string;
  telephone: string;
  adresse: string;
  zone: string;
};

export default function ClientsTable({ rows, zones }: { rows: ClientRow[]; zones: string[] }) {
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("");

  const filtres = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!zone || r.zone === zone) &&
        (!needle ||
          [r.nomCommerce, r.responsable, r.telephone, r.adresse].some((v) =>
            v.toLowerCase().includes(needle)
          ))
    );
  }, [rows, q, zone]);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-60 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un client"
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={zone} onChange={(e) => setZone(e.target.value)} className={`${inputCls} sm:w-56`}>
          <option value="">Tous les secteurs</option>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <p className="ml-auto text-xs text-slate-500">{filtres.length} clients</p>
      </div>

      <div className="overflow-x-auto border-t border-slate-200">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Commerce</th>
              <th className={thCls}>Responsable</th>
              <th className={thCls}>Téléphone</th>
              <th className={thCls}>Adresse</th>
              <th className={thCls}>Secteur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtres.map((r) => (
              <tr key={r.id}>
                <td className={`${tdCls} font-semibold text-slate-900`}>{r.nomCommerce}</td>
                <td className={tdCls}>{r.responsable}</td>
                <td className={tdCls}>{r.telephone}</td>
                <td className={tdCls}>{r.adresse}</td>
                <td className={tdCls}>
                  <Badge tone="blue">{r.zone}</Badge>
                </td>
              </tr>
            ))}
            {filtres.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  Aucun client ne correspond à la recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}