-- CreateTable
CREATE TABLE "AjustementStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "variationPieces" INTEGER NOT NULL,
    "motif" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "commentaireGerant" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decideLe" DATETIME,
    "produitId" INTEGER NOT NULL,
    "demandeParId" INTEGER NOT NULL,
    "decideParId" INTEGER,
    "mouvementId" INTEGER,
    CONSTRAINT "AjustementStock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "Produit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AjustementStock_demandeParId_fkey" FOREIGN KEY ("demandeParId") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AjustementStock_decideParId_fkey" FOREIGN KEY ("decideParId") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AjustementStock_mouvementId_fkey" FOREIGN KEY ("mouvementId") REFERENCES "MouvementStock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AjustementStock_mouvementId_key" ON "AjustementStock"("mouvementId");

-- CreateIndex
CREATE INDEX "AjustementStock_statut_idx" ON "AjustementStock"("statut");
