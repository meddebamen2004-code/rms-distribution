"use client";
import Button from "@/components/ui/Button";

export default function PrintButton() {
  return (
    <Button variant="secondary" className="print:hidden" onClick={() => window.print()}>
      Imprimer / Enregistrer en PDF
    </Button>
  );
}