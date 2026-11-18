"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ClientForm from "@/components/ClientForm";

export default function ClientModal({ secteurs }: { secteurs: { id: number; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={18} /> Ajouter un client
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ajouter un client"
        subtitle="Le secteur détermine quel livreur voit ce client."
      >
        <ClientForm secteurs={secteurs} onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}