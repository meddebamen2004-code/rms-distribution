"use client";
import { useRouter } from "next/navigation";

export default function ArchiveButton({ id, archive }: { id: number; archive: boolean }) {
  const router = useRouter();

  async function toggle() {
    await fetch(`/api/produits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archive: !archive }),
    });
    router.refresh();
  }

  return (
    <button onClick={toggle} className="text-sm text-blue-700 underline">
      {archive ? "Restaurer" : "Archiver"}
    </button>
  );
}