"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ProduitForm from "@/components/ProduitForm";

export default function ProduitModal({ categories }: { categories: { id: number; nom: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={18} /> Ajouter un produit
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajouter un produit"
        subtitle="Renseignez les informations de la nouvelle référence."
      >
        <ProduitForm
          categories={categories}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}